using System.IO;
using launcher.Services;

namespace launcher.Core.Services
{
    public class FileSystemService
    {
        public bool HasEnoughFreeSpace(string installPath, long requiredBytes)
        {
            string root = Path.GetPathRoot(Path.GetFullPath(installPath));
            if (string.IsNullOrEmpty(root))
                throw new ArgumentException("Invalid path", nameof(installPath));

            var drive = new DriveInfo(root);
            if (!drive.IsReady)
                throw new IOException($"Drive {drive.Name} is not ready.");

            return drive.AvailableFreeSpace >= requiredBytes;
        }

        public string GetBaseLibraryPath()
        {
            string libraryPath = (string)SettingsService.Get(SettingsService.Vars.Library_Location);
            string finalDirectory = Path.Combine(libraryPath, "R5Valk Library");
            return finalDirectory;
        }
    }
} 