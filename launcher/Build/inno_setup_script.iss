[Setup]
AppName=R5Valkyrie
AppVersion=1.0.0
WizardStyle=modern
DefaultDirName=C:\Program Files\R5Valkyrie
DefaultGroupName=R5Valkyrie
UninstallDisplayIcon={app}\R5Valk Launcher\launcher.exe
Compression=lzma2
SolidCompression=yes
OutputDir=..\bin\Publish
PrivilegesRequired=admin
UninstallFilesDir={app}\R5Valk Launcher\
SetupIconFile=..\Assets\favicon.ico
AppPublisher=R5Valkyrie
AppPublisherURL=https://playvalkyrie.org
OutputBaseFilename=R5Valkyrie-Setup
UsePreviousGroup=no
UsePreviousAppDir=no

[Files]
Source: "..\bin\Publish\launcher.exe"; DestDir: "{app}\R5Valk Launcher\"

[Icons]
Name: "{group}\R5Valkyrie"; Filename: "{app}\R5Valk Launcher\launcher.exe"

[Dirs]
Name: "{app}"; Permissions: users-full
Name: "{app}\R5Valk Launcher"; Permissions: users-full
Name: "{app}\R5Valk Library"; Permissions: users-full