# GlassTube

**See-through page & ad blocker for YouTube.** A Chrome extension (Manifest V3, plain JavaScript, no build step).

- **Blocks ads**: skips and mutes video ads, hides ad slots, and blocks the main ad requests.
- **Transparent page**: on a watch page, the normal YouTube player stays where it is with all its own buttons. A muted live copy of the video plays behind the see-through page (header, description, recommendations). The copy follows the real player, so pausing or seeking the video does the same to the background.

## Controls

| Where | What |
|---|---|
| YouTube player | Works exactly as normal. Pause/seek here also pauses/seeks the background. |
| Keyboard | **Alt+T** turns transparent mode on or off. |
| Toolbar popup | Turn ads/transparency on or off, **Transparency** level, **Panel blur** (makes text easier to read) |

Some copy-protected videos (official music videos, movies) can't be copied. On those, the background stays plain dark.

## Install (developer mode)

1. Download this repo (**Code → Download ZIP** and unzip it, or `git clone https://github.com/dinesh-suryanand/glasstube.git`).
2. Open `chrome://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick the `glasstube` folder (the one that has `manifest.json`).
4. Pin it from the puzzle-piece menu, then reload your YouTube tabs.

After you change the code, click ↻ on the extension card and reload YouTube.

## Publish to the Chrome Web Store

1. Make the zip (run inside this folder):
   ```bash
   zip -r ../glasstube.zip . -x "*.DS_Store"
   ```
2. Register at https://chrome.google.com/webstore/devconsole. It costs $5 once.
3. Click **New item**, upload the zip, and fill in the listing: description, icon, a 1280×800 screenshot.
4. Privacy tab: justify each permission (`storage` = settings, `declarativeNetRequest` = ad blocking, youtube.com = page features). Say you collect no data, and link a simple privacy policy page.
5. Submit for review. For updates, raise `"version"` in `manifest.json` and upload a new zip.

Note: blocking YouTube ads breaks YouTube's Terms of Service, and the store may reject or remove YouTube ad blockers. YouTube also changes its page often, so selectors will need occasional updates.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | Extension config (Manifest V3) |
| `src/content.js` | Ad skipping, transparent mode (background copy) |
| `src/content.css` | Ad hiding, background copy layout, see-through panels |
| `src/background.js` | Turns network ad blocking on/off with the setting |
| `rules/ad_rules.json` | Network block rules for ad domains |
| `popup/` | Toolbar popup with settings |
