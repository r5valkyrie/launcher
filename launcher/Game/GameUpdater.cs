using Hardcodet.Wpf.TaskbarNotification;
using launcher.Networking;
using launcher.Services;
using System.IO;
using System.Windows;
using static launcher.Services.LoggerService;
using static launcher.Core.AppController;
using static launcher.Core.AppContext;
using launcher.GameLifecycle.Models;

namespace launcher.Game
{
    public enum UpdateFileType { Main, Optional, Language }

    public static class GameUpdater
    {
        public static async Task Start()
        {
            try
            {
                if (!await RunPreUpdateChecksAsync()) return;

                GameFileManager.SetInstallState(true, "UPDATING");

                await ExecuteMainUpdateAsync();
                await PerformPostUpdateActionsAsync();
            }
            catch (Exception ex)
            {
                LogError(LogSource.Update, $"A critical error occurred during update: {ex.Message}");
            }
            finally
            {
                GameFileManager.SetInstallState(false);
                DiscordService.SetRichPresence("", "Idle");
            }
        }

        // ============================================================================================
        // Private Helper Methods
        // ============================================================================================
        private static async Task RunUpdateProcessAsync(UpdateFileType fileType)
        {
            string releaseChannelDirectory = ReleaseChannelService.GetDirectory();

            await CheckForDeletedFilesAsync(fileType);

            GameFileManager.UpdateStatusLabel($"Checking {fileType} files", LogSource.Update);

            Task<LocalFileChecksum[]> checksumTasks;
            switch (fileType)
            {
                case UpdateFileType.Main:
                    checksumTasks = Task.WhenAll(ChecksumManager.PrepareCoreFileChecksumTasks(releaseChannelDirectory));
                    break;
                case UpdateFileType.Optional:
                    checksumTasks = Task.WhenAll(ChecksumManager.PrepareOptChecksumTasks(releaseChannelDirectory));
                    break;
                case UpdateFileType.Language:
                    checksumTasks = Task.WhenAll(await ChecksumManager.PrepareLangChecksumTasksAsync(releaseChannelDirectory));
                    break;
                default:
                    return;
            }

            GameFileManager.UpdateStatusLabel($"Fetching latest {fileType} files", LogSource.Update);

            GameManifest GameManifest;
            switch (fileType)
            {
                case UpdateFileType.Main:
                    GameManifest = await ApiService.GetGameManifestAsync(optional: false);
                    break;
                case UpdateFileType.Optional:
                    GameManifest = await ApiService.GetGameManifestAsync(optional: true);
                    break;
                case UpdateFileType.Language:
                    GameManifest serverManifest = await ApiService.GetLanguageFilesAsync();

                    GameManifest = new GameManifest
                    {
                        files = serverManifest.files
                            .Where(f => File.Exists(Path.Combine(releaseChannelDirectory, f.path)))
                            .ToList()
                    };
                    break;
                default:
                    return;
            }

            await Task.WhenAll(checksumTasks);

            GameFileManager.UpdateStatusLabel($"Finding updated {fileType} files", LogSource.Update);
            int changedFileCount = await ChecksumManager.VerifyFileIntegrity(GameManifest, checksumTasks, releaseChannelDirectory, true);

            if (changedFileCount > 0)
            {
                GameFileManager.UpdateStatusLabel($"Downloading updated {fileType} files", LogSource.Update);
                var (downloadTasks, multipartFiles) = GameFileManager.InitializeRepairTasks(releaseChannelDirectory);

                using var cts = new CancellationTokenSource();
                Task progressUpdateTask = DownloadService.UpdateGlobalDownloadProgressAsync(cts.Token);

                GameFileManager.ShowSpeedLabels(true, true);
                await Task.WhenAll(downloadTasks);
                await GameFileManager.MergeAndCleanupMultiPartFiles(multipartFiles);
                GameFileManager.ShowSpeedLabels(false, false);
                await cts.CancelAsync();
            }
        }

        private static async Task<bool> RunPreUpdateChecksAsync()
        {
            await Task.Delay(1);

            if (appState.IsInstalling || !appState.IsOnline || ReleaseChannelService.IsLocal() || !ReleaseChannelService.IsUpdateAvailable() || ReleaseChannelService.GetLocalVersion() == ReleaseChannelService.GetServerVersion())
                return false;

            if (IsR5ApexOpen())
            {
                var result = MessageBox.Show("Valkyrie must be closed to update.\n\nClose the game now?", "Valkyrie", MessageBoxButton.YesNo, MessageBoxImage.Warning);
                if (result == MessageBoxResult.Yes)
                {
                    CloseR5Apex();
                }
                else
                {
                    return false;
                }
            }

            ReleaseChannelService.SetUpdateAvailable(false);
            return true;
        }

        private static async Task ExecuteMainUpdateAsync()
        {
            DownloadService.StartSpeedMonitor();
            DownloadService.ConfigureConcurrency();
            DownloadService.ConfigureDownloadSpeed();

            await RunUpdateProcessAsync(UpdateFileType.Main);
        }

        private static async Task PerformPostUpdateActionsAsync()
        {
            await Task.Delay(1);

            ReleaseChannelService.SetInstalled(true);
            ReleaseChannelService.SetVersion(ReleaseChannelService.GetServerVersion());

            string sigCacheFile = Path.Combine(ReleaseChannelService.GetDirectory(), "cfg", "startup.bin");
            if (File.Exists(sigCacheFile)) File.Delete(sigCacheFile);

            SendNotification($"Valkyrie ({ReleaseChannelService.GetName()}) has been updated!", BalloonIcon.Info);
            SetupAdvancedMenu();

            if (ReleaseChannelService.ShouldDownloadHDTextures())
            {
                await UpdateOptionalFilesAsync();
            }

            await UpdateLanguageFilesAsync();
        }

        private static async Task UpdateOptionalFilesAsync()
        {
            await RunUpdateProcessAsync(UpdateFileType.Optional);
            SendNotification($"Valkyrie ({ReleaseChannelService.GetName()}) optional files have been updated!", BalloonIcon.Info);
        }

        private static async Task UpdateLanguageFilesAsync()
        {
            await RunUpdateProcessAsync(UpdateFileType.Language);
            SendNotification($"Valkyrie ({ReleaseChannelService.GetName()}) language files have been updated!", BalloonIcon.Info);
        }

        private static async Task CheckForDeletedFilesAsync(UpdateFileType fileType)
        {
            string releaseChannelDirectory = ReleaseChannelService.GetDirectory();
            var allLocalFiles = Directory.GetFiles(releaseChannelDirectory, "*", SearchOption.AllDirectories)
                .Select(f => Path.GetRelativePath(releaseChannelDirectory, f))
                .ToList();

            GameManifest serverFileManifest;
            Func<string, bool> fileTypeFilter;

            switch (fileType)
            {
                case UpdateFileType.Main:
                    serverFileManifest = await ApiService.GetGameManifestAsync(optional: false);
                    var languageManifest = await ApiService.GetLanguageFilesAsync();
                    serverFileManifest.files.AddRange(languageManifest.files);
                    fileTypeFilter = path => !path.EndsWith("opt.starpak", StringComparison.OrdinalIgnoreCase);
                    break;
                case UpdateFileType.Optional:
                    serverFileManifest = await ApiService.GetGameManifestAsync(optional: true);
                    fileTypeFilter = path => path.EndsWith("opt.starpak", StringComparison.OrdinalIgnoreCase);
                    break;
                case UpdateFileType.Language:
                    serverFileManifest = await ApiService.GetLanguageFilesAsync();
                    fileTypeFilter = path => path.Contains(Path.Combine("audio", "ship")) && IsLanguageFile(path, serverFileManifest);
                    break;
                default:
                    return;
            }

            var serverFilesSet = serverFileManifest.files
                .Select(f => f.path.Replace('/', '\\'))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var filesToDelete = allLocalFiles
                .Where(fileTypeFilter)
                .Where(localFile => !serverFilesSet.Contains(localFile));

            foreach (var relativePath in filesToDelete)
            {
                try
                {
                    string fullPath = Path.Combine(releaseChannelDirectory, relativePath);
                    if (File.Exists(fullPath))
                    {
                        File.Delete(fullPath);
                    }
                }
                catch (Exception ex)
                {
                    LogException($"Failed to delete obsolete file: {relativePath}", LogSource.Update, ex);
                }
            }
        }

        private static bool IsLanguageFile(string filePath, GameManifest languageManifest)
        {
            var serverFilesSet = languageManifest.files
                .Select(f => f.path.Replace('/', '\\'))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            return serverFilesSet.Any(serverFile => filePath.EndsWith(serverFile, StringComparison.OrdinalIgnoreCase));
        }
    }
}