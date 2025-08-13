using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace launcher.Services
{
    public static class NetworkHealthService
    {
        public static readonly HttpClient HttpClient = new() { Timeout = TimeSpan.FromSeconds(30) };

        public static SemaphoreSlim DownloadSemaphore = new(100);

        public static async Task<bool> IsCdnAvailableAsync()
        {
            try
            {
                using var client = new HttpClient();
                client.Timeout = TimeSpan.FromSeconds(5); // Set a timeout (e.g., 5 seconds)

                var response = await client.GetAsync($"https://cdn.playvalkyrie.org/launcher/config.json");
                return response.IsSuccessStatusCode; // Return true if the request was successful
            }
            catch
            {
                return false; // Return false if there's an exception (e.g., timeout or network error)
            }
        }

        public static async Task<bool> IsNewsApiAvailableAsync()
        {
            try
            {
                using var client = new HttpClient();
                client.Timeout = TimeSpan.FromSeconds(5); // Set a timeout (e.g., 5 seconds)

                var response = await client.GetAsync($"{Launcher.NEWSURL}/posts/?key={Launcher.NEWSKEY}&include=tags,authors");
                return response.IsSuccessStatusCode; // Return true if the request was successful
            }
            catch
            {
                return false; // Return false if there's an exception (e.g., timeout or network error)
            }
        }

        public static async Task<bool> IsMasterServerAvailableAsync()
        {
            try
            {
                using var client = new HttpClient();
                client.Timeout = TimeSpan.FromSeconds(5); // Set a timeout (e.g., 5 seconds)

                var response = await client.GetAsync($"https://r5r.org");
                return response.IsSuccessStatusCode; // Return true if the request was successful
            }
            catch
            {
                return false; // Return false if there's an exception (e.g., timeout or network error)
            }
        }
    }
} 