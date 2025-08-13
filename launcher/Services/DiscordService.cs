using DiscordRPC;
using DiscordRPC.Logging;
using static launcher.Core.AppContext;
using static launcher.Services.LoggerService;

namespace launcher.Services
{
    public class DiscordService
    {
        private static DiscordRpcClient RPC_client;
        private static RichPresence richPresence;
        private static Timestamps timestamps;

        public static void InitDiscordRPC()
        {
            if (!appState.IsOnline)
                return;

            if (RPC_client != null && RPC_client.IsInitialized)
                return;

            RPC_client = new DiscordRpcClient(Launcher.DISCORDRPC_CLIENT_ID)
            {
                Logger = new ConsoleLogger() { Level = LogLevel.Warning }
            };

            RPC_client.OnReady += (sender, e) =>
            {
                LogInfo(LogSource.DiscordRPC, $"Discord RPC connected as {e.User.Username}");
            };

            //RPC_client.OnPresenceUpdate += (sender, e) =>
            //{
            //    //LogInfo(LogSource.DiscordRPC, $"Received Update! {e.Presence}");
            //};

            RPC_client.OnError += (sender, e) =>
            {
                LogError(LogSource.DiscordRPC, $"Discord RPC Error: {e.Message}");
            };

            RPC_client.OnConnectionFailed += (sender, e) =>
            {
                LogError(LogSource.DiscordRPC, $"Discord RPC Connection Failed");
            };

            RPC_client.OnConnectionEstablished += (sender, e) =>
            {
                LogInfo(LogSource.DiscordRPC, $"Discord RPC Connection Established");
            };

            RPC_client.Initialize();

            SetRichPresence("", "Idle", "embedded_cover", "");
        }

        public static void SetRichPresence(string details, string state)
        {
            if (RPC_client == null || !RPC_client.IsInitialized)
                return;

            richPresence ??= new RichPresence();

            richPresence.Details = details;
            richPresence.State = state;

            if (timestamps == null) richPresence.Timestamps = timestamps;

            RPC_client.SetPresence(richPresence);
        }

        public static void SetRichPresence(string details, string state, string largeImageKey, string smallImageKey)
        {
            if (RPC_client == null || !RPC_client.IsInitialized)
                return;

            richPresence ??= new RichPresence();
            timestamps ??= new Timestamps() { Start = DateTime.UtcNow };

            richPresence.Timestamps = timestamps;
            richPresence.Details = details;
            richPresence.State = state;
            richPresence.Assets = new Assets()
            {
                LargeImageKey = largeImageKey,
                LargeImageText = "Valkyrie Launcher",
                SmallImageKey = smallImageKey,
                SmallImageText = "Valkyrie Launcher"
            };

            RPC_client.SetPresence(richPresence);
        }
    }
}
