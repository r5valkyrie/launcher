using Newtonsoft.Json;
using System.Diagnostics;

internal partial class Program
{
    private static async Task Main(string[] args)
    {
        Console.WriteLine("------ Valkyrie Launcher Self Updater ------");

        var appPath = AppDomain.CurrentDomain.BaseDirectory;
        DirectoryInfo parentDir = Directory.GetParent(appPath.TrimEnd(Path.DirectorySeparatorChar));

        var destinationPath = parentDir + "\\launcher.exe";

        Console.WriteLine("Deleting old launcher at " + destinationPath);//

        int maxAttempts = 10;  // Maximum retry attempts
        int attemptCount = 0;
        bool isFileReadyToDelete = false;

        while (attemptCount < maxAttempts)
        {
            try
            {
                if (!File.Exists(destinationPath))
                {
                    isFileReadyToDelete = true;
                    break;
                }

                // Try opening the file to check if it is in use
                using (FileStream fs = new FileStream(destinationPath, FileMode.Open, FileAccess.ReadWrite, FileShare.None))
                {
                    // If the file opens without exceptions, it's not in use
                    isFileReadyToDelete = true;
                    break;
                }
            }
            catch (IOException)
            {
                // If the file is in use, catch the IOException and retry
                Console.WriteLine("File is in use, retrying...");
                attemptCount++;
                Thread.Sleep(500); // Wait for 500 milliseconds before retrying
            }
        }

        if (isFileReadyToDelete)
        {
            if (File.Exists(destinationPath))
            {
                File.Delete(destinationPath);
                Console.WriteLine("Old launcher deleted successfully.");
            }
        }
        else
        {
            Console.WriteLine("Failed to delete the file after several attempts.");
        }

        await DownloadLauncherAsync(destinationPath);

        Console.WriteLine("Launching new launcher at " + destinationPath);
        var startInfo = new ProcessStartInfo
        {
            FileName = "cmd.exe",
            Arguments = $"/c start \"\" \"{destinationPath}\"",
            WorkingDirectory = parentDir.FullName
        };

        // Start the new process via cmd
        Process.Start(startInfo);

        // Exit the current process
        Environment.Exit(0);
    }

    private static async Task DownloadLauncherAsync(string destinationPath)
    {
        var launcherURL = "https://blaze.playvalkyrie.org/launcher.exe";

        Console.WriteLine("Downloading new launcher from " + launcherURL);
        HttpClient client = new();
        var response = await client.GetAsync(launcherURL, HttpCompletionOption.ResponseHeadersRead);
        response.EnsureSuccessStatusCode();

        using var stream = await response.Content.ReadAsStreamAsync();
        using var fileStream = new FileStream(destinationPath, FileMode.Create, FileAccess.Write, FileShare.None);

        Console.WriteLine("Writing new launcher to " + destinationPath);
        stream.CopyTo(fileStream);
        stream.Close();
        fileStream.Close();
    }
}

public class Asset
{
    public string url { get; set; }
    public int id { get; set; }
    public string node_id { get; set; }
    public string name { get; set; }
    public string label { get; set; }
    public Uploader uploader { get; set; }
    public string content_type { get; set; }
    public string state { get; set; }
    public int size { get; set; }
    public int download_count { get; set; }
    public DateTime created_at { get; set; }
    public DateTime updated_at { get; set; }
    public string browser_download_url { get; set; }
}

public class Author
{
    public string login { get; set; }
    public int id { get; set; }
    public string node_id { get; set; }
    public string avatar_url { get; set; }
    public string gravatar_id { get; set; }
    public string url { get; set; }
    public string html_url { get; set; }
    public string followers_url { get; set; }
    public string following_url { get; set; }
    public string gists_url { get; set; }
    public string starred_url { get; set; }
    public string subscriptions_url { get; set; }
    public string organizations_url { get; set; }
    public string repos_url { get; set; }
    public string events_url { get; set; }
    public string received_events_url { get; set; }
    public string type { get; set; }
    public string user_view_type { get; set; }
    public bool site_admin { get; set; }
}

public class Root
{
    public string url { get; set; }
    public string assets_url { get; set; }
    public string upload_url { get; set; }
    public string html_url { get; set; }
    public int id { get; set; }
    public Author author { get; set; }
    public string node_id { get; set; }
    public string tag_name { get; set; }
    public string target_commitish { get; set; }
    public string name { get; set; }
    public bool draft { get; set; }
    public bool prerelease { get; set; }
    public DateTime created_at { get; set; }
    public DateTime published_at { get; set; }
    public List<Asset> assets { get; set; }
    public string tarball_url { get; set; }
    public string zipball_url { get; set; }
    public string body { get; set; }
}

public class Uploader
{
    public string login { get; set; }
    public int id { get; set; }
    public string node_id { get; set; }
    public string avatar_url { get; set; }
    public string gravatar_id { get; set; }
    public string url { get; set; }
    public string html_url { get; set; }
    public string followers_url { get; set; }
    public string following_url { get; set; }
    public string gists_url { get; set; }
    public string starred_url { get; set; }
    public string subscriptions_url { get; set; }
    public string organizations_url { get; set; }
    public string repos_url { get; set; }
    public string events_url { get; set; }
    public string received_events_url { get; set; }
    public string type { get; set; }
    public string user_view_type { get; set; }
    public bool site_admin { get; set; }
}