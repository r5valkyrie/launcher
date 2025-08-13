using Hardcodet.Wpf.TaskbarNotification;
using launcher.Networking;
using launcher.Services;
using System.IO;
using System.Windows;
using static launcher.Services.LoggerService;
using static launcher.Core.AppContext;
using static launcher.Core.AppController;
using launcher.GameLifecycle.Models;

namespace launcher.Game
{
    public static class GameRepairer
    {
        public static async Task<bool> Start()
        {
            try
            {
                if (!await RunPreRepairChecksAsync()) return false;

                GameFileManager.SetInstallState(true, "REPAIRING");

                bool repairNeeded = await ExecuteMainRepairAsync();
                await PerformPostRepairActionsAsync();

                return !repairNeeded || !appState.BadFilesDetected;
            }
            catch (Exception ex)
            {
                LogError(LogSource.Repair, $"A critical error occurred during repair: {ex.Message}");
                return false;
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
        private static async Task<bool> RunRepairProcessAsync(string releaseChannelDirectory, Func<Task<Task<LocalFileChecksum[]>>> prepareChecksums, Func<Task<GameManifest>> fetchFileManifest, string checkStatus, string compareStatus, string downloadStatus)
        {
            GameFileManager.UpdateStatusLabel(checkStatus, LogSource.Repair);
            var checksumTasks = await prepareChecksums();

            GameFileManager.UpdateStatusLabel(compareStatus, LogSource.Repair);
            var GameManifest = await fetchFileManifest();
            int badFileCount = await ChecksumManager.VerifyFileIntegrity(GameManifest, checksumTasks, releaseChannelDirectory);

            if (badFileCount > 0)
            {
                GameFileManager.UpdateStatusLabel(downloadStatus, LogSource.Repair);
                var downloadTasks = GameFileManager.InitializeRepairTasks(releaseChannelDirectory);

                using var cts = new CancellationTokenSource();
                Task progressUpdateTask = DownloadService.UpdateGlobalDownloadProgressAsync(cts.Token);

                GameFileManager.ShowSpeedLabels(true, true);
                await Task.WhenAll(downloadTasks);
                GameFileManager.ShowSpeedLabels(false, false);
                await cts.CancelAsync();
                return true; // Indicates that a repair was attempted.
            }

            return false; // No repair was needed.
        }

        private static async Task<bool> RunPreRepairChecksAsync()
        {
            await Task.Delay(1);

            if (appState.IsInstalling || !appState.IsOnline || ReleaseChannelService.IsLocal()) return false;

            if (IsR5ApexOpen())
            {
                var result = MessageBox.Show("Valkyrie must be closed to repair.\n\nClose the game now?", "Valkyrie", MessageBoxButton.YesNo, MessageBoxImage.Warning);
                if (result == MessageBoxResult.Yes)
                {
                    CloseR5Apex();
                }
                else
                {
                    return false;
                }
            }

            if (ReleaseChannelService.IsUpdateAvailable())
            {
                Update_Button.Visibility = Visibility.Hidden;
                ReleaseChannelService.SetUpdateAvailable(false);
            }
            return true;
        }

        private static async Task<bool> ExecuteMainRepairAsync()
        {
            string releaseChannelDirectory = ReleaseChannelService.GetDirectory();
            DownloadService.StartSpeedMonitor();
            DownloadService.ConfigureConcurrency();
            DownloadService.ConfigureDownloadSpeed();

            var result = await RunRepairProcessAsync(
                releaseChannelDirectory,
                () => Task.FromResult(Task.WhenAll(ChecksumManager.PrepareCoreFileChecksumTasks(releaseChannelDirectory))),
                () => ApiService.GetGameManifestAsync(optional: false),
                "Checking core files...",
                "Comparing core files...",
                "Downloading core files..."
            );

            DownloadService.StopSpeedMonitor();
            return result;
        }

        private static async Task PerformPostRepairActionsAsync()
        {
            // Check and repair language files.
            await RepairLanguageFilesAsync();

            // Update local state.
            ReleaseChannelService.SetInstalled(true);
            ReleaseChannelService.SetVersion(ReleaseChannelService.GetServerVersion());

            // Clean up cache files.
            string sigCacheFile = Path.Combine(ReleaseChannelService.GetDirectory(), "cfg", "startup.bin");
            if (File.Exists(sigCacheFile)) File.Delete(sigCacheFile);

            // Update UI and send notification.
            SetupAdvancedMenu();
            SendNotification($"Valkyrie ({ReleaseChannelService.GetName()}) has been repaired!", BalloonIcon.Info);

            // Check for existing HD Textures.
            if (CheckForHDTextures(ReleaseChannelService.GetDirectory()))
            {
                ReleaseChannelService.SetDownloadHDTextures(true);
                // Asynchronously repair optional files without waiting.
                await RepairOptionalFilesAsync();
            }
        }

        private static async Task RepairOptionalFilesAsync()
        {
            await RunRepairProcessAsync(
                ReleaseChannelService.GetDirectory(),
                () => Task.FromResult(Task.WhenAll(ChecksumManager.PrepareOptChecksumTasks(ReleaseChannelService.GetDirectory()))),
                () => ApiService.GetGameManifestAsync(optional: true),
                "Checking optional files...",
                "Comparing optional files...",
                "Downloading optional files..."
            );
            SendNotification($"Valkyrie ({ReleaseChannelService.GetName()}) optional files have been repaired!", BalloonIcon.Info);
        }

        private static async Task RepairLanguageFilesAsync()
        {
            if (!appState.IsOnline) return;

            string releaseChannelDirectory = ReleaseChannelService.GetDirectory();

            GameManifest serverManifest = await ApiService.GetLanguageFilesAsync();
            GameManifest manifestForRepair = new GameManifest
            {
                files = serverManifest.files
                    .Where(file => File.Exists(Path.Combine(releaseChannelDirectory, file.path)))
                    .ToList()
            };

            if (!manifestForRepair.files.Any())
            {
                LogInfo(LogSource.Repair, "No local language files found to verify.");
                return;
            }

            Func<Task<Task<LocalFileChecksum[]>>> prepareChecksums = async () =>
            {
                var checksumTasks = await ChecksumManager.PrepareLangChecksumTasksAsync(releaseChannelDirectory);
                return Task.WhenAll(checksumTasks);
            };

            await RunRepairProcessAsync(
                releaseChannelDirectory,
                prepareChecksums,
                () => Task.FromResult(manifestForRepair),
                "Checking language files...",
                "Comparing language files...",
                "Downloading language files..."
            );
        }

        private static bool CheckForHDTextures(string releaseChannelDirectory)
        {
            return Directory.EnumerateFiles(releaseChannelDirectory, "*.opt.starpak", SearchOption.AllDirectories)
                .Any(path => !path.Contains(Path.DirectorySeparatorChar + "mods" + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase));
        }
    }
}