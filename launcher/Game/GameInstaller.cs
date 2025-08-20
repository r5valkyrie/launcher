using Hardcodet.Wpf.TaskbarNotification;
using launcher.Services;
using System.Windows;
using System.Windows.Controls;
using static launcher.Core.AppContext;
using static launcher.Services.LoggerService;
using static launcher.Core.AppController;
using launcher.Networking;
using launcher.GameLifecycle.Models;

namespace launcher.Game
{
    public static class GameInstaller
    {
        public static async Task Start()
        {
            try
            {
                if (!await RunPreFlightChecksAsync()) return;

                GameFileManager.SetInstallState(true, "INSTALLING");

                await ExecuteDownloadAndRepairAsync();
                await PerformPostInstallActionsAsync();
            }
            catch (Exception ex)
            {
                LogError(LogSource.Installer, $"A critical error occurred during installation: {ex.Message}");
            }
            finally
            {
                GameFileManager.SetInstallState(false);
                DiscordService.SetRichPresence("", "Idle");
            }
        }

        public static async Task HDTextures()
        {
            if (appState.IsInstalling || !appState.IsOnline || ReleaseChannelService.IsLocal()) return;

            GameManifest GameManifest = await ApiService.GetGameManifestAsync(optional: true);
            if (!await CheckForSufficientSpaceAsync(GameManifest, "HD Textures")) return;

            GameFileManager.SetInstallState(true);
            try
            {
                await RunDownloadProcessAsync(GameManifest, "Downloading optional files");

                ReleaseChannelService.SetDownloadHDTextures(true);
                appDispatcher.Invoke(() => Settings_Control.gameInstalls.UpdateGameItems());
                SendNotification($"Valkyrie ({ReleaseChannelService.GetName()}) optional files have been installed!", BalloonIcon.Info);
            }
            finally
            {
                GameFileManager.SetInstallState(false);
                DiscordService.SetRichPresence("", "Idle");
            }
        }

        public static async Task LangFile(CheckBox checkBox, GameManifest GameManifest, string language, bool bypass_block = false)
        {
            if (!appState.IsOnline || (appState.BlockLanguageInstall && !bypass_block)) return;

            if (!await CheckForSufficientSpaceAsync(GameManifest, "Language File")) return;

            GameManifest.files = GameManifest.files.Where(file => file.path.Contains(language)).ToList();

            appDispatcher.Invoke(() => { if (checkBox != null) checkBox.IsEnabled = false; });

            try
            {
                await RunDownloadProcessAsync(GameManifest, "Downloading language files", showMainSpeed: false);
            }
            finally
            {
                appDispatcher.Invoke(() => { if (checkBox != null) checkBox.IsEnabled = true; });
            }
        }

        // ============================================================================================
        // Private Helper Methods
        // ============================================================================================
        private static async Task RunDownloadProcessAsync(GameManifest GameManifest, string statusLabel, bool showMainSpeed = true)
        {
            DownloadService.StartSpeedMonitor();
            DownloadService.ConfigureConcurrency();
            DownloadService.ConfigureDownloadSpeed();

            string releaseChannelDirectory = ReleaseChannelService.GetDirectory();
            var (downloadTasks, multipartFiles) = GameFileManager.InitializeDownloadTasks(GameManifest, releaseChannelDirectory);

            using var cts = new CancellationTokenSource();
            Task progressUpdateTask = DownloadService.UpdateGlobalDownloadProgressAsync(cts.Token);

            GameFileManager.ShowSpeedLabels(showMainSpeed, true);
            GameFileManager.UpdateStatusLabel(statusLabel, LogSource.Installer);

            await Task.WhenAll(downloadTasks);
            await GameFileManager.MergeAndCleanupMultiPartFiles(multipartFiles);

            GameFileManager.ShowSpeedLabels(false, false);
            await cts.CancelAsync();
        }

        private static async Task<bool> RunPreFlightChecksAsync()
        {
            if (appState.IsInstalling || !appState.IsOnline || ReleaseChannelService.IsLocal()) return false;

            if (string.IsNullOrEmpty((string)SettingsService.Get(SettingsService.Vars.Library_Location)))
            {
                appDispatcher.Invoke(() => ShowInstallLocation());
                return false;
            }

            if (!ReleaseChannelService.IsEULAAccepted())
            {
                appDispatcher.Invoke(() => ShowEULA());
                return false;
            }

            if (ReleaseChannelService.DoesExeExist())
            {
                await Task.Run(() => GameRepairer.Start());
                return false; // Pivoted to repair, so stop the install flow.
            }

            GameManifest GameManifest = await ApiService.GetGameManifestAsync(optional: false);
            const long extraSpaceBuffer = 30L * 1024 * 1024 * 1024; // 30 GB
            return await CheckForSufficientSpaceAsync(GameManifest, "Valkyrie", extraSpaceBuffer);
        }

        private static async Task<bool> CheckForSufficientSpaceAsync(GameManifest GameManifest, string installName, long extraBuffer = 0)
        {
            await Task.Delay(1);

            long requiredSpace = GameManifest.files.Sum(f => f.size) + extraBuffer;
            string libraryLocation = (string)SettingsService.Get(SettingsService.Vars.Library_Location);

            if (string.IsNullOrEmpty(libraryLocation))
            {
                appDispatcher.Invoke(() => ShowInstallLocation());
                return false;
            }

            if (!HasEnoughFreeSpace(libraryLocation, requiredSpace))
            {
                MessageBox.Show($"Not enough free space to install {installName}.\n\nRequired: {FormatBytes(requiredSpace)}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                return false;
            }
            return true;
        }

        private static async Task ExecuteDownloadAndRepairAsync()
        {
            GameManifest GameManifest = await ApiService.GetGameManifestAsync(optional: false);
            await RunDownloadProcessAsync(GameManifest, "Downloading game files");

            if (appState.BadFilesDetected)
            {
                GameFileManager.UpdateStatusLabel("Repairing game files", LogSource.Installer);
                await AttemptGameRepair();
            }
        }

        private static async Task PerformPostInstallActionsAsync()
        {
            GameManifest GameManifest = await ApiService.GetLanguageFilesAsync();
            bool languageAvailable = GameManifest.languages.Contains(appState.language_name, StringComparer.OrdinalIgnoreCase);
            if (languageAvailable && appState.language_name != "english")
            {
                await LangFile(null, GameManifest, appState.language_name, bypass_block: true);
            }

            ReleaseChannelService.SetInstalled(true);
            ReleaseChannelService.SetVersion(ReleaseChannelService.GetServerVersion());
            appDispatcher.Invoke(() => SetupAdvancedMenu());
            SendNotification($"Valkyrie ({ReleaseChannelService.GetName()}) has been installed!", BalloonIcon.Info);

            GameManifest optFiles = await ApiService.GetGameManifestAsync(optional: true);
            appDispatcher.Invoke(() =>
            {
                OptFiles_Control.SetDownloadSize(optFiles);
                ShowDownloadOptlFiles();
            });
        }

        private static async Task AttemptGameRepair()
        {
            bool isRepaired = false;
            for (int i = 0; i < Launcher.MAX_REPAIR_ATTEMPTS && !isRepaired; i++)
            {
                isRepaired = await GameRepairer.Start();
            }
            appState.BadFilesDetected = !isRepaired;
        }

        private static string FormatBytes(long bytes)
        {
            if (bytes == 0) return "0 B";
            string[] suffixes = { "B", "KB", "MB", "GB", "TB" };
            int place = Convert.ToInt32(Math.Floor(Math.Log(bytes, 1024)));
            double num = Math.Round(bytes / Math.Pow(1024, place), 2);
            return $"{num} {suffixes[place]}";
        }
    }
}