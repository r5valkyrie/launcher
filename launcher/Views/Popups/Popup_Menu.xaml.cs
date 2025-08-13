using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using static launcher.Core.AppContext;
using static launcher.Core.AppController;

namespace launcher
{
    /// <summary>
    /// Interaction logic for subMenu.xaml
    /// </summary>
    public partial class Popup_Menu : UserControl
    {
        public Button settingsButton;

        public Popup_Menu()
        {
            InitializeComponent();
            settingsButton = Settings;
        }

        private void SupportCreator_Click(object sender, RoutedEventArgs e)
        {
            Process.Start(new ProcessStartInfo("cmd", $"/c start https://ko-fi.com/amos0") { CreateNoWindow = true });
        }

        private void Discord_Click(object sender, RoutedEventArgs e)
        {
            Process.Start(new ProcessStartInfo("cmd", $"/c start https://discord.gg/GcJSMUGJyD") { CreateNoWindow = true });
        }

        private void Website_Click(object sender, RoutedEventArgs e)
        {
            Process.Start(new ProcessStartInfo("cmd", $"/c start https://playvalkyrie.org") { CreateNoWindow = true });
        }

        private void Settings_Click(object sender, RoutedEventArgs e)
        {
            if (!appState.InSettingsMenu && !appState.InAdvancedMenu)
            {
                Menu_Popup.IsOpen = false;
                ShowSettingsControl();

                //i hate this
                Settings_Control.gameInstalls.CollapseItemsOnFirstLoad();
            }
        }

        private void Exit_Click(object sender, RoutedEventArgs e)
        {
            Environment.Exit(0);
        }

        private void CreatorYoutube_Click(object sender, RoutedEventArgs e)
        {
            Process.Start(new ProcessStartInfo("cmd", $"/c start https://www.youtube.com/channel/UCNIbjhwX7HrVCOtFZab_Jqg") { CreateNoWindow = true });
        }

        private void Tour_Click(object sender, RoutedEventArgs e)
        {
            Menu_Popup.IsOpen = false;
            ShowOnBoardAskPopup();
        }
    }
}