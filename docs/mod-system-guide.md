# R5Valkyrie Mod System Guide

We're excited to introduce the brand new **Mod System** for **R5Valkyrie** — making it easier than ever to customize, expand, and manage your experience!

---

## How Mods Are Structured

- **Mods Folder**: All mods are located inside the `mods` directory in your R5Valkyrie base game folder.
- **Mod List (mods.vdf)**: Mods are enabled or disabled through the `mods.vdf` file. This file controls which mods are active:
  - Setting a value to `1` enables the mod
  - Setting a value to `0` disables it

---

## Individual Mod Structure

Each mod has its own folder inside the `mods` directory. Inside a typical mod folder, you'll find:

| Item | Description |
|------|-------------|
| **Pak Files** | For custom assets and content |
| **Resource Folder** | For localization (translations) and UI assets |
| **Scripts Folder** | For any custom logic or gameplay changes |
| **mod.vdf** | A configuration file describing the mod |

---

## What You Can Customize in a Mod

### Basic Information
Set your mod's name, unique ID, description, version number, and author.

### Localization
Attach your own translation files to support multiple languages.

```
resource/mymod_%language%.txt
```

### ConVars (Console Variables)
Define custom settings that players can tweak via the in-game console. You can set default values, min/max ranges, and helpful descriptions.

### Custom Audio
Include your own sounds, music, or voice lines through your mod's pak files.

> **Note:** Custom audio is currently not possible, but when it is available, the mod system is already ready for it.

### Custom Scripts
Add or override game behavior using your own scripts to create new features, modify movement, weapons, UI, or even create brand-new game modes.

---

## Example mod.vdf

Every mod has a `mod.vdf` file containing important information:

```
"mod"
{
    "name"          "R5R Mod: Flowstate"
    "id"            "Flowstate"
    "description"   "Mod for R5Valkyrie, includes Flowstate required convars and client text in 13 languages."
    "version"       "1.1"
    "author"        "authorname"

    "LocalizationFiles"
    {
        "resource/flowstate_%language%.txt" "1"
    }

    "PakLoadOnPlaylists"
    {
        "fs_scenarios" 1
        "fs_movementrecorder" 1
        "fs_dm" 1
        ...
    }

    "ConVars"
    {
        "enable_healthbar"
        {
            "helpText" "Displays flowstate healthbars"
            "flags" "ARCHIVE|RELEASE"
            "Values"
            {
                "default" "1"
                "min" "0"
                "max" "1"
            }
        }
        ...
    }
}
```

---

## Pak Files per Playlist

### Load Specific Pak Files
Load specific pak files based on the active map or playlist.

*Example: Only load special content when playing "Winter Express".*

### Map-specific Rpak Loading
You can configure map-specific `.rpak` files by creating `.kv` files inside the `scripts/levels/settings/` folder of your mod.

```
scripts/levels/settings/mp_rr_desertlands_mu1.kv
```

### Always-Loaded Rpaks
If you want a `.rpak` file to always be loaded (no matter the map or playlist), create a `preload.rson` file.

**Location:**
```
modfolder/paks/win64/preload.rson
```

**Contents:**
```
Paks:
[
    common_kral.rpak
]
```

---

## Custom VPK Files

Mods can also include **custom `.vpk` files** to override or add new content.

### How to Use
Place your `.vpk` files inside the mod's `vpk/` folder.

```
modfolder/vpk/
```

Any `.vpk` files found in the mod's folder structure will be **automatically loaded** by the game.

---

## Creating Custom Scripts

Want to extend the game with your own code? Here's how to register and run custom scripts with the new mod system.

### Step 1: Create a scripts.rson File

Inside your mod folder, create the file:

```
modfolder/scripts/vscripts/scripts.rson
```

**Example scripts.rson:**

```
When: "SERVER || CLIENT || UI"
Scripts:
[
    sh_kralstuff.gnut
]
```

| Field | Description |
|-------|-------------|
| **When** | Specifies which environments should load the script: `SERVER`, `CLIENT`, `UI`, or combinations |
| **Scripts** | Lists all `.gnut` files to be loaded |

### Step 2: Set Up the Main Script with Callbacks

Inside your main script (e.g., `sh_kralstuff.gnut`), define the following standard callbacks:

```cpp
#if SERVER
global function CodeCallback_kralstuff_ModInit()
#endif

#if CLIENT
global function ClientCodeCallback_kralstuff_ModInit()
#endif

#if UI
global function UICodeCallback_kralstuff_ModInit()
#endif

#if SERVER
void function CodeCallback_kralstuff_ModInit()
{
}
#endif

#if CLIENT
void function ClientCodeCallback_kralstuff_ModInit()
{
}
#endif

#if UI
void function UICodeCallback_kralstuff_ModInit()
{
}
#endif
```

### Callback Requirements

| Environment | Required Callback |
|-------------|-------------------|
| SERVER | `CodeCallback_*_ModInit()` |
| CLIENT | `ClientCodeCallback_*_ModInit()` |
| UI | `UICodeCallback_*_ModInit()` |

---

## Notes for Mod Developers

1. Always **globalize** your callback functions at the top
2. The script callback name is determined from the `id` field in `mod.vdf` — make sure it's renamed correctly
3. Use conditional compilation (`#if UI`, `#if SERVER`, `#if CLIENT`) to separate logic properly

---

## Why This Matters

This system brings **flexibility** and **clean organization** to R5Valkyrie modding:

- Easily toggle mods on/off without touching core game files
- Share, update, and organize mods easily without worrying about compatibility issues
- Allow deeper customization through ConVars and localization support

---

## Need Help?

Join our community on **Discord** and get your questions answered! Or, check out the mods available in the latest R5Valkyrie build, all ready for you to explore and use.

This is just the beginning — we're looking forward to seeing what **you** create!

