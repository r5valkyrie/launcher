using launcher.Services;
using System.Globalization;
using System.IO;
using System.Net;
using static launcher.Core.AppContext;
using static launcher.Services.LoggerService;

namespace launcher
{
    public static class Launcher
    {
        public const string VERSION = "1.3.9";

        #region Settings

        public const int MAX_REPAIR_ATTEMPTS = 5;
        public static string PATH { get; set; } = "";

        #endregion Settings

        #region Public Keys

        public const string NEWSKEY = "087606e4317f602d5854ba0e5a";
        public const string DISCORDRPC_CLIENT_ID = "1364049087434850444";

        #endregion Public Keys

        #region Public URLs

        public const string CONFIG_URL = "https://cdn.playvalkyrie.org/launcher/config.json";
        public const string BACKGROUND_VIDEO_URL = "https://cdn.playvalkyrie.org/launcher/video_backgrounds/";
        public const string NEWSURL = "https://blog.playvalkyrie.org/ghost/api/content";

        #endregion Public URLs

        public static void Init()
        {
            //string version = (bool)SettingsService.Get(SettingsService.Vars.Nightly_Builds) ? (string)SettingsService.Get(SettingsService.Vars.Launcher_Version) : VERSION;
            appDispatcher.Invoke(() => Version_Label.Text = VERSION);

            LogInfo(LogSource.Launcher, $"Launcher Version: {VERSION}");

            PATH = Path.GetDirectoryName(Environment.GetCommandLineArgs()[0]);
            LogInfo(LogSource.Launcher, $"Launcher path: {PATH}");

            appState.RemoteConfig = appState.IsOnline ? ApiService.GetRemoteConfig() : null;

            SettingsService.Load();

            appState.LauncherConfig = SettingsService.IniFile;
            LogInfo(LogSource.Launcher, $"Launcher config found");

            appState.cultureInfo = CultureInfo.CurrentCulture;
            appState.language_name = appState.cultureInfo.Parent.EnglishName.ToLower(new CultureInfo("en-US"));

            AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
        }
    }
}