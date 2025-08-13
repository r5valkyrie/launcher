using Hardcodet.Wpf.TaskbarNotification;
using launcher.Core.Models;
using launcher.GameLifecycle.Models;
using launcher.Services;
using System.IO;
using System.Windows;
using System.Windows.Controls;
using static launcher.Core.AppController;
using static launcher.Core.AppContext;
using static launcher.Services.LoggerService;

namespace launcher.Game
{
    public static class GameUninstaller
    {
        public static async Task Start()
        {
            if (!await RunPreUninstallChecksAsync()) return;

            GameFileManager.SetInstallState(true, "UNINSTALLING");
            try
            {
                var allFiles = Directory.GetFiles(ReleaseChannelService.GetDirectory(), "*", SearchOption.AllDirectories);
                await RunUninstallProcessAsync(allFiles, "Removing game files");

                Directory.Delete(ReleaseChannelService.GetDirectory(), true);

                ReleaseChannelService.SetInstalled(false);
                ReleaseChannelService.SetDownloadHDTextures(false);
                ReleaseChannelService.SetVersion("");

                SendNotification($"Valkyrie ({ReleaseChannelService.GetName()}) has been uninstalled!", BalloonIcon.Info);
            }
            catch (Exception ex)
            {
                LogError(LogSource.Uninstaller, $"A critical error occurred during uninstall: {ex.Message}");
            }
            finally
            {
                GameFileManager.SetInstallState(false, "INSTALL");
                DiscordService.SetRichPresence("", "Idle");
            }
        }

        public static async Task LangFile(CheckBox checkBox, string language)
        {
            if (!ReleaseChannelService.IsInstalled() || !Directory.Exists(ReleaseChannelService.GetDirectory())) return;

            appDispatcher.Invoke(() => { if (checkBox != null) checkBox.IsEnabled = false; });
            GameFileManager.SetInstallState(true, "UNINSTALLING");
            try
            {
                GameManifest langFilesManifest = await ApiService.GetLanguageFilesAsync();
                langFilesManifest.files = langFilesManifest.files.Where(file => file.path.Contains(language)).ToList();

                List<string> filesToDelete = new();
                foreach(ManifestEntry file in langFilesManifest.files)
                {
                    string finalPath = Path.Combine(ReleaseChannelService.GetDirectory(), file.path);
                    filesToDelete.Add(finalPath);
                }

                await RunUninstallProcessAsync(filesToDelete, "Removing language files");
            }
            finally
            {
                GameFileManager.SetInstallState(false);
                appDispatcher.Invoke(() => { if (checkBox != null) checkBox.IsEnabled = true; });
            }
        }

        public static async Task HDTextures(ReleaseChannel channel)
        {
            if (!ReleaseChannelService.IsInstalled(channel) || !Directory.Exists(ReleaseChannelService.GetDirectory(channel))) return;

            GameFileManager.SetInstallState(true, "UNINSTALLING");
            try
            {
                var optFiles = Directory.GetFiles(ReleaseChannelService.GetDirectory(channel), "*.opt.starpak", SearchOption.AllDirectories);
                await RunUninstallProcessAsync(optFiles, "Removing HD textures");

                ReleaseChannelService.SetDownloadHDTextures(false, channel);
                SendNotification($"HD Textures ({ReleaseChannelService.GetName(true, channel)}) have been uninstalled!", BalloonIcon.Info);
            }
            finally
            {
                GameFileManager.SetInstallState(false, "PLAY");
            }
        }

        // ============================================================================================
        // Private Helper Methods
        // ============================================================================================

        private static async Task RunUninstallProcessAsync(IReadOnlyCollection<string> filesToDelete, string statusLabel)
        {
            GameFileManager.UpdateStatusLabel(statusLabel,LogSource.Uninstaller);

            await appDispatcher.InvokeAsync(() => { Progress_Bar.Maximum = filesToDelete.Count; Progress_Bar.Value = 0; });

            await Task.Run(() =>
            {
                Parallel.ForEach(filesToDelete, file =>
                {
                    try
                    {
                        File.Delete(file);
                    }
                    catch (Exception ex)
                    {
                        LogException($"Failed to delete file: {file}",LogSource.Uninstaller, ex);
                    }
                    finally
                    {
                        // Safely update the progress bar on the UI thread.
                        appDispatcher.Invoke(() => Progress_Bar.Value++);
                    }
                });
            });
        }

        private static async Task<bool> RunPreUninstallChecksAsync()
        {
            await Task.Delay(1);

            string channelDirectory = ReleaseChannelService.GetDirectory();
            if (!Directory.Exists(channelDirectory))
            {
                ReleaseChannelService.SetInstalled(false);
                ReleaseChannelService.SetDownloadHDTextures(false);
                ReleaseChannelService.SetVersion("");
                return false;
            }

            if (IsR5ApexOpen())
            {
                var result = MessageBox.Show("Valkyrie must be closed to uninstall.\n\nClose the game now?", "Valkyrie", MessageBoxButton.YesNo, MessageBoxImage.Warning);
                if (result == MessageBoxResult.Yes)
                {
                    CloseR5Apex();
                }
                else
                {
                    return false;
                }
            }

            return !IsAnyFileLocked(channelDirectory);
        }

        private static bool IsAnyFileLocked(string directoryPath)
        {
            foreach (string file in Directory.GetFiles(directoryPath))
            {
                if (IsFileLocked(file))
                {
                    MessageBox.Show($"The file '{Path.GetFileName(file)}' is in use. Please close any programs using it.", "File In Use", MessageBoxButton.OK, MessageBoxImage.Warning);
                    return true;
                }
            }
            return false;
        }

        private static bool IsFileLocked(string filePath)
        {
            try
            {
                using (new FileStream(filePath, FileMode.Open, FileAccess.ReadWrite, FileShare.None)) { }
            }
            catch (IOException)
            {
                // The file is unavailable because it is still being written to,
                // or being processed by another thread, or does not exist.
                return true;
            }
            return false;
        }
    }
}