namespace patch_creator
{
    partial class MainWIndow
    {
        /// <summary>
        ///  Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///  Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        ///  Required method for Designer support - do not modify
        ///  the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(MainWIndow));
            textBox1 = new TextBox();
            label1 = new Label();
            label2 = new Label();
            textBox2 = new TextBox();
            button1 = new Button();
            button2 = new Button();
            button3 = new Button();
            comboBox1 = new ComboBox();
            label3 = new Label();
            progressBar1 = new ProgressBar();
            progressLabel = new Label();
            totalFilesLeft = new Label();
            richTextBox2 = new RichTextBox();
            label4 = new Label();
            groupBox1 = new GroupBox();
            richTextBox1 = new RichTextBox();
            PurgeListBtn = new Button();
            PurgeAllBtn = new Button();
            groupBox2 = new GroupBox();
            blogslugTxt = new TextBox();
            label7 = new Label();
            label6 = new Label();
            concurrentTasks = new NumericUpDown();
            versionTxt = new TextBox();
            label5 = new Label();
            groupBox1.SuspendLayout();
            groupBox2.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)concurrentTasks).BeginInit();
            SuspendLayout();
            // 
            // textBox1
            // 
            textBox1.Location = new Point(206, 34);
            textBox1.Name = "textBox1";
            textBox1.Size = new Size(534, 23);
            textBox1.TabIndex = 0;
            // 
            // label1
            // 
            label1.AutoSize = true;
            label1.Location = new Point(206, 16);
            label1.Name = "label1";
            label1.Size = new Size(64, 15);
            label1.TabIndex = 1;
            label1.Text = "Game Files";
            // 
            // label2
            // 
            label2.AutoSize = true;
            label2.Location = new Point(206, 60);
            label2.Name = "label2";
            label2.Size = new Size(81, 15);
            label2.TabIndex = 3;
            label2.Text = "Output Folder";
            // 
            // textBox2
            // 
            textBox2.Location = new Point(206, 78);
            textBox2.Name = "textBox2";
            textBox2.Size = new Size(534, 23);
            textBox2.TabIndex = 2;
            // 
            // button1
            // 
            button1.Location = new Point(206, 410);
            button1.Name = "button1";
            button1.Size = new Size(632, 43);
            button1.TabIndex = 4;
            button1.Text = "Create Patch";
            button1.UseVisualStyleBackColor = true;
            button1.Click += button1_Click;
            // 
            // button2
            // 
            button2.Location = new Point(746, 78);
            button2.Name = "button2";
            button2.Size = new Size(92, 23);
            button2.TabIndex = 5;
            button2.Text = "Browse";
            button2.UseVisualStyleBackColor = true;
            button2.Click += button2_Click;
            // 
            // button3
            // 
            button3.Location = new Point(746, 34);
            button3.Name = "button3";
            button3.Size = new Size(92, 23);
            button3.TabIndex = 6;
            button3.Text = "Browse";
            button3.UseVisualStyleBackColor = true;
            button3.Click += button3_Click;
            // 
            // comboBox1
            // 
            comboBox1.FormattingEnabled = true;
            comboBox1.Location = new Point(12, 34);
            comboBox1.Name = "comboBox1";
            comboBox1.Size = new Size(188, 23);
            comboBox1.TabIndex = 7;
            // 
            // label3
            // 
            label3.AutoSize = true;
            label3.Location = new Point(12, 16);
            label3.Name = "label3";
            label3.Size = new Size(93, 15);
            label3.TabIndex = 8;
            label3.Text = "Release Channel";
            // 
            // progressBar1
            // 
            progressBar1.Location = new Point(12, 459);
            progressBar1.Name = "progressBar1";
            progressBar1.Size = new Size(1121, 23);
            progressBar1.TabIndex = 11;
            // 
            // progressLabel
            // 
            progressLabel.Location = new Point(12, 485);
            progressLabel.Name = "progressLabel";
            progressLabel.Size = new Size(981, 20);
            progressLabel.TabIndex = 12;
            progressLabel.Text = "waiting";
            progressLabel.TextAlign = ContentAlignment.MiddleLeft;
            // 
            // totalFilesLeft
            // 
            totalFilesLeft.Location = new Point(999, 484);
            totalFilesLeft.Name = "totalFilesLeft";
            totalFilesLeft.Size = new Size(134, 20);
            totalFilesLeft.TabIndex = 13;
            totalFilesLeft.Text = "0/0";
            totalFilesLeft.TextAlign = ContentAlignment.MiddleRight;
            // 
            // richTextBox2
            // 
            richTextBox2.DetectUrls = false;
            richTextBox2.Location = new Point(844, 34);
            richTextBox2.Name = "richTextBox2";
            richTextBox2.Size = new Size(289, 419);
            richTextBox2.TabIndex = 14;
            richTextBox2.Text = "";
            richTextBox2.WordWrap = false;
            // 
            // label4
            // 
            label4.AutoSize = true;
            label4.Location = new Point(844, 16);
            label4.Name = "label4";
            label4.Size = new Size(194, 15);
            label4.TabIndex = 15;
            label4.Text = "Iqnore Files / Folders - One Per Line";
            // 
            // groupBox1
            // 
            groupBox1.Controls.Add(richTextBox1);
            groupBox1.Controls.Add(PurgeListBtn);
            groupBox1.Controls.Add(PurgeAllBtn);
            groupBox1.Location = new Point(206, 107);
            groupBox1.Name = "groupBox1";
            groupBox1.Size = new Size(632, 297);
            groupBox1.TabIndex = 16;
            groupBox1.TabStop = false;
            groupBox1.Text = "CF Tools";
            // 
            // richTextBox1
            // 
            richTextBox1.DetectUrls = false;
            richTextBox1.Location = new Point(6, 22);
            richTextBox1.Name = "richTextBox1";
            richTextBox1.Size = new Size(620, 231);
            richTextBox1.TabIndex = 17;
            richTextBox1.Text = "";
            richTextBox1.WordWrap = false;
            // 
            // PurgeListBtn
            // 
            PurgeListBtn.Location = new Point(6, 259);
            PurgeListBtn.Name = "PurgeListBtn";
            PurgeListBtn.Size = new Size(451, 32);
            PurgeListBtn.TabIndex = 18;
            PurgeListBtn.Text = "Purge List";
            PurgeListBtn.UseVisualStyleBackColor = true;
            PurgeListBtn.Click += PurgeListBtn_Click;
            // 
            // PurgeAllBtn
            // 
            PurgeAllBtn.Location = new Point(463, 259);
            PurgeAllBtn.Name = "PurgeAllBtn";
            PurgeAllBtn.Size = new Size(163, 32);
            PurgeAllBtn.TabIndex = 17;
            PurgeAllBtn.Text = "Purge Everything";
            PurgeAllBtn.UseVisualStyleBackColor = true;
            PurgeAllBtn.Click += button4_Click;
            // 
            // groupBox2
            // 
            groupBox2.Controls.Add(blogslugTxt);
            groupBox2.Controls.Add(label7);
            groupBox2.Controls.Add(label6);
            groupBox2.Controls.Add(concurrentTasks);
            groupBox2.Controls.Add(versionTxt);
            groupBox2.Controls.Add(label5);
            groupBox2.Location = new Point(12, 63);
            groupBox2.Name = "groupBox2";
            groupBox2.Size = new Size(188, 390);
            groupBox2.TabIndex = 19;
            groupBox2.TabStop = false;
            groupBox2.Text = "Settings";
            // 
            // blogslugTxt
            // 
            blogslugTxt.Location = new Point(6, 85);
            blogslugTxt.Name = "blogslugTxt";
            blogslugTxt.Size = new Size(175, 23);
            blogslugTxt.TabIndex = 24;
            // 
            // label7
            // 
            label7.AutoSize = true;
            label7.Location = new Point(6, 67);
            label7.Name = "label7";
            label7.Size = new Size(57, 15);
            label7.TabIndex = 25;
            label7.Text = "Blog Slug";
            // 
            // label6
            // 
            label6.AutoSize = true;
            label6.Location = new Point(6, 114);
            label6.Name = "label6";
            label6.Size = new Size(175, 15);
            label6.TabIndex = 23;
            label6.Text = "Max Concurrent Tasks ( 1 - 500 )";
            // 
            // concurrentTasks
            // 
            concurrentTasks.Location = new Point(6, 132);
            concurrentTasks.Maximum = new decimal(new int[] { 500, 0, 0, 0 });
            concurrentTasks.Name = "concurrentTasks";
            concurrentTasks.Size = new Size(175, 23);
            concurrentTasks.TabIndex = 22;
            concurrentTasks.Value = new decimal(new int[] { 100, 0, 0, 0 });
            // 
            // versionTxt
            // 
            versionTxt.Location = new Point(6, 41);
            versionTxt.Name = "versionTxt";
            versionTxt.Size = new Size(175, 23);
            versionTxt.TabIndex = 20;
            // 
            // label5
            // 
            label5.AutoSize = true;
            label5.Location = new Point(6, 23);
            label5.Name = "label5";
            label5.Size = new Size(45, 15);
            label5.TabIndex = 21;
            label5.Text = "Version";
            // 
            // MainWIndow
            // 
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            BackColor = SystemColors.Control;
            ClientSize = new Size(1141, 513);
            Controls.Add(groupBox2);
            Controls.Add(groupBox1);
            Controls.Add(label4);
            Controls.Add(richTextBox2);
            Controls.Add(totalFilesLeft);
            Controls.Add(progressLabel);
            Controls.Add(progressBar1);
            Controls.Add(label3);
            Controls.Add(comboBox1);
            Controls.Add(button3);
            Controls.Add(button2);
            Controls.Add(button1);
            Controls.Add(label2);
            Controls.Add(textBox2);
            Controls.Add(label1);
            Controls.Add(textBox1);
            FormBorderStyle = FormBorderStyle.Fixed3D;
            Icon = (Icon)resources.GetObject("$this.Icon");
            Name = "MainWIndow";
            Text = "Valkyrie Patch Creator";
            Load += Form1_Load;
            groupBox1.ResumeLayout(false);
            groupBox2.ResumeLayout(false);
            groupBox2.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)concurrentTasks).EndInit();
            ResumeLayout(false);
            PerformLayout();
        }

        #endregion

        private TextBox textBox1;
        private Label label1;
        private Label label2;
        private TextBox textBox2;
        private Button button1;
        private Button button2;
        private Button button3;
        private ComboBox comboBox1;
        private Label label3;
        private ProgressBar progressBar1;
        private Label progressLabel;
        private Label totalFilesLeft;
        private RichTextBox richTextBox2;
        private Label label4;
        private GroupBox groupBox1;
        private RichTextBox richTextBox1;
        private Button PurgeListBtn;
        private Button PurgeAllBtn;
        private GroupBox groupBox2;
        private TextBox versionTxt;
        private Label label5;
        private Label label6;
        private NumericUpDown concurrentTasks;
        private TextBox blogslugTxt;
        private Label label7;
    }
}
