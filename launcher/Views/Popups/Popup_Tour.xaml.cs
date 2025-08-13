using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Numerics;
using System.Windows.Media.Animation;
using static launcher.Core.AppContext;
using static launcher.Core.AppController;
using launcher.Core.Models;
using launcher.Services;

namespace launcher
{
    public partial class Popup_Tour : UserControl
    {
        public static List<TourStep> OnBoardingItems { get; } = [
            new TourStep("Launcher Menu", "Quick access to settings and useful resources can be found in this menu.", new Rect(1,1,24,14), new Vector2(6,64)),
            new TourStep("Service Status", "Monitor the status of R5R services here. If there are any performance or service interruptions, you will see it here.", new Rect(210,1,31,14), new Vector2(600,64)),
            new TourStep("Downloads And Tasks", "Follow the progress of your game downloads / updates.", new Rect(246,1,31,14), new Vector2(760,64)),
            new TourStep("channels And Installing", "Here you can select the release channel you want to install, update, or play", new Rect(20,75,71,63), new Vector2(86,538)),
            new TourStep("Game Settings", "Clicking this allows you to access advanced settings for the selected release channel, as well as verify game files or uninstall.", new Rect(75,101,16,16), new Vector2(334,455)),
            new TourStep("News And Updates", "View latest updates, patch notes, guides, and anything else related to Valkyrie straight from the Team.", new Rect(102,77,190,116), new Vector2(455,128)),
            new TourStep("You're All Set", "You've successfully completed the Launcher Tour. If you have any questions or need further assistance, feel free to join our discord!", new Rect(135,95,0,0), new Vector2(430,305)),
            ];

        private int currentIndex = 0;

        public Popup_Tour()
        {
            InitializeComponent();
        }

        private void Next_Click(object sender, RoutedEventArgs e)
        {
            if (currentIndex + 1 >= OnBoardingItems.Count)
            {
                EndTour();
                return;
            }

            SetItem(currentIndex + 1);
        }

        public void SetItem(int index)
        {
            currentIndex = index;

            Next.Content = "Next";
            Skip.Visibility = Visibility.Visible;

            if (currentIndex == OnBoardingItems.Count - 1)
            {
                Next.Content = "Finish";
                Skip.Visibility = Visibility.Hidden;
            }

            TourStep item = OnBoardingItems[index];

            Title.Text = item.Title;
            Desc.Text = item.Description;
            Page.Text = $"{index + 1} of {OnBoardingItems.Count}";

            if (OnBoard_Control.RenderTransform is TransformGroup transformGroup)
            {
                var translateTransform = transformGroup.Children.OfType<TranslateTransform>().FirstOrDefault();
                AnimateTranslate(translateTransform, item.translatePos);
                AnimateGeoRect(OnBoardingClip, item.geoRect);
            }
        }

        private static void AnimateTranslate(TranslateTransform translateTransform, Vector2 xy)
        {
            if (translateTransform == null)
            {
                System.Diagnostics.Debug.WriteLine("TranslateTransform is null. Cannot animate.");
                return;
            }

            // Determine animation speed
            double speed = (bool)SettingsService.Get(SettingsService.Vars.Disable_Transitions) ? 1 : 400;

            // Animate X property
            var moveXAnimation = new DoubleAnimation
            {
                From = translateTransform.X,
                To = xy.X,
                Duration = new Duration(TimeSpan.FromMilliseconds(speed)),
                EasingFunction = new CubicEase { EasingMode = EasingMode.EaseInOut }
            };

            // Animate Y property
            var moveYAnimation = new DoubleAnimation
            {
                From = translateTransform.Y,
                To = xy.Y,
                Duration = new Duration(TimeSpan.FromMilliseconds(speed)),
                EasingFunction = new CubicEase { EasingMode = EasingMode.EaseInOut }
            };

            // Apply animations directly
            translateTransform.BeginAnimation(TranslateTransform.XProperty, moveXAnimation);
            translateTransform.BeginAnimation(TranslateTransform.YProperty, moveYAnimation);
        }

        private static void AnimateGeoRect(RectangleGeometry geo, Rect newRect)
        {
            if (geo == null)
            {
                System.Diagnostics.Debug.WriteLine("RectangleGeometry is null. Cannot animate.");
                return;
            }

            // Ensure the geometry is not frozen
            if (geo.IsFrozen)
            {
                // Clone the geometry to make it unfrozen
                geo = geo.Clone();
            }

            double speed = (bool)SettingsService.Get(SettingsService.Vars.Disable_Transitions) ? 1 : 400;

            var rectAnimation = new RectAnimation
            {
                From = geo.Rect,
                To = newRect,
                Duration = new Duration(TimeSpan.FromMilliseconds(speed)),
                EasingFunction = new CubicEase { EasingMode = EasingMode.EaseInOut }
            };

            // Apply the animation directly
            geo.BeginAnimation(RectangleGeometry.RectProperty, rectAnimation);
        }

        private void Skip_Click(object sender, RoutedEventArgs e)
        {
            EndTour();
        }
    }
}