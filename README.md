# R5 Valkyrie Launcher

Modern game launcher for R5 Valkyrie built with Electron + Astro + React.

## Features

- Fast concurrent downloads with multipart support, checksum verification, and repair
- Dynamic Install / Update / Play primary action per channel
- Per‑channel settings, launch options, and install locations
- Background video with local caching via custom protocol
- Auto‑updates from GitHub Releases
- Dedicated server link per channel (optional)

> Update feed is published to `r5valkyrie/launcher_releases`. See releases here:
> https://github.com/r5valkyrie/launcher_releases

## Configuration

The launcher fetches a JSON config at startup (default):
`https://blaze.playvalkyrie.org/config.json`

Example:

```json
{
  "backgroundVideo": "shortshowcr5v.mp4",
  "channels": [
    {
      "name": "PTU",
      "game_url": "https://blaze.example.org/game_files",
      "dedi_url": "https://blaze.example.org/dedi_files/server_PTC_v2.71.2-250907.7z",
      "enabled": true
    }
  ]
}
```

- `backgroundVideo`: optional; loaded and cached (`r5v://`) with PNG fallback
- `channels[*].game_url`: base path containing `checksums.json`
- `channels[*].dedi_url`: optional link in Settings to download the dedicated server

## Downloads, Repair, Update

- Install/Update: reads `checksums.json`, downloads single files or multipart (with merge), then verifies checksums
- Repair: verifies existing files and re‑downloads only mismatches/missing
- Progress:
  - Global bar (bytes, speed, ETA)
  - Detailed per‑file/part view in the Downloads tab
  - Top‑right toast when finished

Multipart retry behavior:

- If a part fails checksum, it is retried once
- The UI emits a part reset so progress doesn’t flicker between old/new numbers during retry

## Dedicated Server

- If a channel has `dedi_url`, Settings shows a "Download Dedicated Server" button which opens the URL in the system browser

## Auto‑Update

- Uses `electron-updater` with GitHub provider
- Feed repository: `r5valkyrie/launcher_releases`
- Each release must include: `latest.yml`, installer `.exe`, and `.blockmap`

Latest: https://github.com/r5valkyrie/launcher_releases/releases/latest

## Notes

- Default install directory: `C:\\Program Files\\R5RValk Library\\<channel>`
- External links always open in the default browser
- Images/videos in `public/` are served from `dist/` in production

