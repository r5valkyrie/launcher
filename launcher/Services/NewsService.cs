using System.IO;
using System.Net.Http.Json;
using System.Text.Json;
using System.Windows;
using System.Windows.Media.Animation;
using System.Windows.Shapes;
using static launcher.Services.LoggerService;
using static launcher.Core.AppContext;
using launcher.Services.Models;

namespace launcher.Services
{
    public static class NewsService
    {
        private static List<List<NewsItem>> Pages = [[], [], [], []];
        private const int MaxItemsPerCategory = 8;
        private static bool firstTimePopulate = true;
        private static int currentPage = 0;
        private static Dictionary<string, bool> blogItemsCached = [];

        public async static void Populate()
        {
            // Populate the community category
            if (Pages[0].Count == 0)
                PopulateNewsCatagory("community", 0, false);

            // Populate the new legends category
            if (Pages[1].Count == 0)
            {
                Pages[1].Add(new NewsItem("Learn How to Play", "View a bunch of information ranging from tutorials, scripting, and more!", "", DateTime.Now.ToShortDateString(), "https://docs.r5reloaded.com/", "", false, "Welcome To R5R"));
                Pages[1].Add(new NewsItem("View Our Blog", "View out blog containing a bunch of usefull information and updates!", "", DateTime.Now.ToShortDateString(), "https://blog.r5reloaded.com/", "", true, "View Blog"));
                Pages[1].Add(new NewsItem("Join Our Discord", "Join our discord server to chat with other members of the community!", "", DateTime.Now.ToShortDateString(), "https://discord.gg/GcJSMUGJyD", "", true, "Join Discord"));
                Pages[1].Add(new NewsItem("Follow Us On X", "Follow us on x to stay up to date with the latest news and updates!", "", DateTime.Now.ToShortDateString(), "https://x.com/r5reloaded", "", true, "Follow Us"));
            }

            // Populate the support-us category
            if (Pages[2].Count == 0)
                PopulateNewsCatagory("support-us", 2, false);

            // Populate the patch notes category
            if (!ReleaseChannelService.IsLocal())
                PopulateNewsCatagory(await ReleaseChannelService.GetBlogSlug(), 3, true);

            appDispatcher.BeginInvoke(() =>
            {
                if (currentPage == 3)
                    SetPage(3);

                if(firstTimePopulate)
                {
                    SetPage(0);
                    firstTimePopulate = false;
                }
            });
        }

        private static void PopulateNewsCatagory(string slug, int index, bool shouldCache)
        {
            News news = new();

            if (blogItemsCached.TryGetValue(slug, out bool value) && value)
                news = GetCachedNewsItems(slug);
            else
                news = GetNewsItems(slug, shouldCache);

            appDispatcher.BeginInvoke(() =>
            {
                Pages[index].Clear();

                foreach (var post in news.posts)
                {
                    if (post.tags == null || post.tags.Count < 1)
                        continue;

                    var newsItem = new NewsItem(
                        post.title,
                        post.excerpt,
                        post.authors[0].name,
                        post.published_at.ToShortDateString(),
                        post.url,
                        post.feature_image,
                        string.IsNullOrEmpty(post.feature_image)
                    );

                    Pages[index].Add(newsItem);
                }
            });
        }

        public static void SetPage(int index)
        {
            currentPage = index;

            List<NewsItem> selected = Pages[index];
            NewsPanel.Children.Clear();

            int i = 0;
            foreach (NewsItem newsItem in selected)
            {
                double speed1 = (bool)SettingsService.Get(SettingsService.Vars.Disable_Animations) ? 1 : 500;
                double speed2 = (bool)SettingsService.Get(SettingsService.Vars.Disable_Animations) ? 1 : 200;
                double beginTime = (bool)SettingsService.Get(SettingsService.Vars.Disable_Animations) ? 0 : i * 0.1;
                i++;

                newsItem.BeginAnimation(UIElement.OpacityProperty, null);
                newsItem.BeginAnimation(FrameworkElement.MarginProperty, null);

                NewsPanel.Children.Add(newsItem);

                newsItem.Opacity = 0;
                newsItem.VerticalAlignment = VerticalAlignment.Top;
                newsItem.Margin = new Thickness(0, 100, 0, 0);

                Rectangle separator = new Rectangle
                {
                    Opacity = 0,
                    Width = 20
                };

                NewsPanel.Children.Add(separator);

                Storyboard storyboard = new Storyboard();

                DoubleAnimation fadeInAnimation = new DoubleAnimation
                {
                    From = 0,
                    To = 1,
                    Duration = TimeSpan.FromMilliseconds(speed1),
                    BeginTime = TimeSpan.FromSeconds(beginTime),
                    EasingFunction = new CubicEase { EasingMode = EasingMode.EaseOut }
                };
                Storyboard.SetTarget(fadeInAnimation, newsItem);
                Storyboard.SetTargetProperty(fadeInAnimation, new PropertyPath(UIElement.OpacityProperty));
                storyboard.Children.Add(fadeInAnimation);

                ThicknessAnimation slideUpAnimation = new ThicknessAnimation
                {
                    From = new Thickness(0, 50, 0, 0),
                    To = new Thickness(0, 30, 0, 0),
                    Duration = TimeSpan.FromMilliseconds(speed2),
                    BeginTime = TimeSpan.FromSeconds(beginTime),
                    EasingFunction = new CubicEase { EasingMode = EasingMode.EaseOut }
                };
                Storyboard.SetTarget(slideUpAnimation, newsItem);
                Storyboard.SetTargetProperty(slideUpAnimation, new PropertyPath(FrameworkElement.MarginProperty));
                storyboard.Children.Add(slideUpAnimation);

                storyboard.Begin();

                Task.Delay(500);
            }
        }

        private static News GetNewsItems(string slug, bool shouldCache)
        {
            News news = new();

            try
            {
                string filter = string.IsNullOrEmpty(slug) ? "" : $"&filter=tag:{slug}";
                //string order = sortByOldest ? "&order=published_at%20desc" : "&order=published_at%20asc";
                news = NetworkHealthService.HttpClient.GetFromJsonAsync<News>($"{Launcher.NEWSURL}/posts/?key={Launcher.NEWSKEY}&include=tags,authors{filter}&limit={MaxItemsPerCategory}&fields=title,excerpt,published_at,url,feature_image").Result;
            }
            catch
            {
                LogWarning(LogSource.Launcher, "Failed to fetch news items.");
            }

            if (shouldCache)
            {
                try
                {
                    string filePath = System.IO.Path.Combine(Launcher.PATH, "launcher_data\\cache", $"{slug}.json");
                    if (File.Exists(filePath))
                        File.Delete(filePath);

                    File.WriteAllText(filePath, JsonSerializer.Serialize(news));
                    blogItemsCached[slug] = true;

                    LogInfo(LogSource.Launcher, $"Cached news items for {slug}.");
                }
                catch (Exception ex)
                {
                    LogError(LogSource.Launcher, $"Failed to cache news items: {ex.Message}");
                }
            }

            return news;
        }

        private static News GetCachedNewsItems(string slug)
        {
            News news = new();

            string filePath = System.IO.Path.Combine(Launcher.PATH, "launcher_data\\cache", $"{slug}.json");
            if (!File.Exists(filePath))
                return news;

            string json = File.ReadAllText(filePath);

            if (string.IsNullOrEmpty(json))
                return news;

            try
            {
                news = JsonSerializer.Deserialize<News>(json);
            }
            catch (JsonException ex)
            {
                LogError(LogSource.Launcher, $"Failed to deserialize JSON: {ex.Message}");
            }

            return news;
        }

        public static void CachedCleared()
        {
            blogItemsCached.Clear();
        }
    }
}