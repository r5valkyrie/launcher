using launcher.Views.Popups.Models.Services;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using static launcher.Services.LoggerService;

namespace launcher
{
    /// <summary>
    /// Interaction logic for StatusPopup.xaml
    /// </summary>
    public partial class Popup_Services : UserControl
    {
        private const int refresh_interval = 30;
        private const string website_url = "https://playvalkyrie.org/";
        private const string status_url = "https://status.playvalkyrie.org/";
        private const string ms_url = "https://ms.playvalkyrie.org/";
        private const string cdn_url = "https://cdn.playvalkyrie.org/launcher/config.json";

        public Popup_Services()
        {
            InitializeComponent();
        }

        private void Border_Loaded(object sender, RoutedEventArgs e)
        {
        }

        public async void StartStatusTimer()
        {
            await Dispatcher.InvokeAsync(() =>
            {
                var app = (App)Application.Current;
                Brush downBrush = app.ThemeDictionary["ThemeStatusNonOperational"] as SolidColorBrush;

                MSStatusBG.Background = downBrush;
                CDNStatusBG.Background = downBrush;
                WebsiteStatusBG.Background = downBrush;
                lblWebsiteStatus.Text = "Non-Operational";
                lblMSStatus.Text = "Non-Operational";
                lblPlayersCount.Text = "~";
                lblServerCount.Text = "~";
            });

            Task.Run(() => GetMasterServerStatusInfo());
            Task.Run(() => GetWebsiteStatusInfo());
            Task.Run(() => GetCDNStatusInfo());

            int current_time = 0;

            while (true)
            {
                await Task.Delay(1000);
                current_time++;

                Dispatcher.Invoke(() =>
                {
                    LastUpdate.Text = $"Last Update: {current_time} seconds ago";
                });

                if (current_time >= refresh_interval)
                {
                    Task.Run(() => GetMasterServerStatusInfo());
                    Task.Run(() => GetWebsiteStatusInfo());
                    Task.Run(() => GetCDNStatusInfo());
                    current_time = 0;
                }
            }
        }

        private async Task GetMasterServerStatusInfo()
        {
            bool isMSUP = await IsUrlUp(ms_url);

            await Dispatcher.InvokeAsync(() =>
            {
                var app = (App)Application.Current;
                Brush upBrush = app.ThemeDictionary["ThemeStatusOperational"] as SolidColorBrush;
                Brush downBrush = app.ThemeDictionary["ThemeStatusNonOperational"] as SolidColorBrush;

                MSStatusBG.Background = isMSUP ? upBrush : downBrush;
                lblMSStatus.Text = isMSUP ? "Operational" : "Non-Operational";
            });

            if (!isMSUP)
            {
                LogError(LogSource.API, "Master Server is down.");

                await Dispatcher.InvokeAsync(() =>
                {
                    lblPlayersCount.Text = "~";
                    lblServerCount.Text = "~";
                });
                return;
            }

            string serverlist = await SendPostRequestAsync($"{ms_url}servers", "{}");

            if (string.IsNullOrEmpty(serverlist))
            {
                await Dispatcher.InvokeAsync(() =>
                {
                    lblPlayersCount.Text = "error";
                    lblServerCount.Text = "error";
                });
                LogError(LogSource.API, "Failed to get server list from API.");
                return;
            }

            GameServerList game_server_list = JsonConvert.DeserializeObject<GameServerList>(serverlist);

            if (!game_server_list.success)
            {
                await Dispatcher.InvokeAsync(() =>
                {
                    lblPlayersCount.Text = "error";
                    lblServerCount.Text = "error";
                });
                LogError(LogSource.API, "Failed to get server list from API.");
                return;
            }

            int total_players = 0;

            foreach (var server in game_server_list.servers)
                total_players += int.Parse(server.playerCount);

            await Dispatcher.InvokeAsync(() =>
            {
                lblPlayersCount.Text = total_players.ToString();
                lblServerCount.Text = game_server_list.servers.Count.ToString();
            });
        }

        private async Task GetWebsiteStatusInfo()
        {
            bool isWebsiteUP = await IsUrlUp(website_url);

            await Dispatcher.InvokeAsync(() =>
            {
                var app = (App)Application.Current;
                Brush upBrush = app.ThemeDictionary["ThemeStatusOperational"] as SolidColorBrush;
                Brush downBrush = app.ThemeDictionary["ThemeStatusNonOperational"] as SolidColorBrush;

                WebsiteStatusBG.Background = isWebsiteUP ? upBrush : downBrush;
                lblWebsiteStatus.Text = isWebsiteUP ? "Operational" : "Non-Operational";
            });
        }

        private async Task GetCDNStatusInfo()
        {
            bool isCDNUP = await IsUrlUp(cdn_url);

            await Dispatcher.InvokeAsync(() =>
            {
                var app = (App)Application.Current;
                Brush upBrush = app.ThemeDictionary["ThemeStatusOperational"] as SolidColorBrush;
                Brush downBrush = app.ThemeDictionary["ThemeStatusNonOperational"] as SolidColorBrush;

                CDNStatusBG.Background = isCDNUP ? upBrush : downBrush;
                lblCNDStatus.Text = isCDNUP ? "Operational" : "Non-Operational";
            });
        }

        private static async Task<bool> IsUrlUp(string url)
        {
            try
            {
                using var client = new HttpClient();
                client.Timeout = TimeSpan.FromSeconds(5);
                using var stream = await client.GetStreamAsync(url);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<string> SendPostRequestAsync(string url, string jsonContent)
        {
            using (HttpClient client = new HttpClient())
            {
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                HttpResponseMessage response = await client.PostAsync(url, content);

                response.EnsureSuccessStatusCode();

                string responseJson = await response.Content.ReadAsStringAsync();
                return responseJson;
            }
        }

        private void moreInfo_Click(object sender, RoutedEventArgs e)
        {
            Process.Start(new ProcessStartInfo("cmd", $"/c start {status_url}") { CreateNoWindow = true });
        }
    }
}