# X-sync WebUI

> 🚀 **X-sync WebUI is for Visually View and Organize your X bookmarks and Likes data stored with X-Sync Chrome Extension**

View your data locally with X-sync WebUI is easy. Just a few steps:
1. Download the files from this repo to the folder you want.
2. Click or run `./start.sh` (Mac/Linux) or `start.bat` (Windows).
3. Open your browser and check out the [http://localhost:8765](http://localhost:8765) web page.

> ℹ️ **Notice**: In order to run X-sync WebUI, it requires the target machine to already have Python 3 installed.

- 🌐 **Official Website**: [https://www.gooo.name/tool/Browser/Xsync.html](https://www.gooo.name/tool/Browser/Xsync.html)
- 📦 **X-sync Extension WebUI Repo**: [https://github.com/gooonamee/x-sync-WebUI](https://github.com/gooonamee/x-sync-WebUI)

---

## ✨ Key Features

1. **🔒 100% Local & Privacy-First**:
   - All tweets, metadata, tags, and media are stored exclusively on your local machine (`server/data/`). No personal data is sent to external clouds or servers.
2. **⚡ Zero External Dependencies**:
   - Powered purely by the Python 3 standard library (`http.server`, `sqlite3`, `socketserver`, `urllib`). No `pip install` or Node.js required.
3. **🖥️ Twitter-Native UI Experience**:
   - 1:1 pixel-perfect reproduction of modern X/Twitter design with dark/light theme support.
   - Dual view modes: Grid layout and List layout.
   - Multi-photo mosaic preview and dedicated video tags.
4. **🔍 Search & Multi-Dimensional Filtering**:
   - Dual search bars: Full-text keyword/link search + Author handle (`@handle`) filter.
   - Granular dropdown filters: Media types (Text-only / Images / Video), language, time range (7 days / 30 days / 1 year), and tags.
5. **🏷️ Tag Management & Context Actions**:
   - Right-click context popup on any tweet card to quickly attach tags or delete the tweet.
   - Comprehensive tag maintenance modal for batch renaming and organizing tags.
6. **📦 Knowledge-Base Ready Markdown Export**:
   - **Combined Markdown Document (.md)**: Merges selected tweets into a clean, structured digest.
   - **Individual Files Archive (.zip)**: Generates standalone `.md` files per tweet with standard YAML frontmatter, stats, and original quotes—ready for Obsidian or Logseq.
7. **🌐 Multi-Language Support (i18n)**:
   - Includes Traditional Chinese (繁體中文, default), English, German (Deutsch), French (Français), Spanish (Español), and Simplified Chinese (简体中文).

---

## 🧩 How to Sync with Chrome Extension

### Step 1: Install the Chrome Extension
1. Go to the Chrome Web Store [「X sync」Extension Page](https://chromewebstore.google.com/detail/ffpdbmdjolkbfoapdcdepojhhncpopjm?utm_source=item-share-cb).
2. Click the **「Add to Chrome」** button.
3. Done! The X sync icon will appear in your browser toolbar.

### Step 2: Start Syncing Your Bookmarks & Likes
1. In Chrome, log in to [x.com](https://x.com/).
2. Navigate to your [Bookmarks](https://x.com/i/bookmarks) or your profile's [Likes](https://x.com) tab.
3. Click the **X sync extension icon** in your browser toolbar.
4. Select your preferred sync batch (e.g., "Sync 50 Tweets", "Deep Sync 100", or "Full Sync").
5. Click **Sync Bookmarks** or **Sync Likes**.
6. A real-time HUD appears at the bottom-right corner of the page, automatically scrolling and de-duplicating tweets as it persists them into your local database.
7. Switch back to your WebUI at [http://localhost:8765](http://localhost:8765) to search, categorize, and export your collection!

---

## 📁 Repository Structure

```text
x-sync-WebUI/
├── server/                     # Local backend service & database
│   ├── server.py               # HTTP API server (default port 8765)
│   ├── database.py             # SQLite connection & schema initialization
│   ├── markdown_exporter.py    # Markdown conversion & ZIP packaging engine
│   └── data/                   # Data storage directory (tracked in .gitignore)
│       ├── x_sync.db           # Empty SQLite database file
│       └── media/              # Directory for downloaded media assets (.gitkeep)
├── web/                        # Web dashboard frontend (static assets)
│   ├── index.html              # Main dashboard HTML
│   ├── style.css               # Styling system
│   ├── app.js                  # Frontend state management & API interaction
│   ├── i18n.js                 # Multi-language dictionary
│   └── assets/                 # Logos & brand icons
├── start.sh                    # Launch script for macOS / Linux
├── start.bat                   # Launch script for Windows
├── .gitignore                  # Git ignore rules for clean repository tracking
├── README-zhtw.md              # Traditional Chinese documentation
└── README.md                   # English documentation
```

---

## 💡 Maintenance & Backup

- **Backing Up Data**: All your synced tweets, tags, and history logs reside inside `server/data/x_sync.db`. Copy `x_sync.db` and `server/data/media/` to your backup location for a 100% complete offline backup.
- **Port Conflict Resolution**: The default port is `8765`. If port 8765 is occupied, you can run `PORT=8766 python3 server/server.py` or edit `PORT = int(os.environ.get('PORT', 8765))` in `server/server.py`.

---

## 📄 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
