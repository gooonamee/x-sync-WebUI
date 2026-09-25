# X sync Backend Management System

> 🚀 **Local Web Management Dashboard & Microservice for X (Twitter) Bookmarks & Likes Sync**  
> Privacy-first, 100% offline, zero external dependencies, built purely with Python 3 standard library.

---

## 📖 Overview

The **X sync Backend Management System** is the local management interface and storage daemon designed to pair with the **X sync Browser Extension**. When you sync your X (Twitter) bookmarks or likes, the extension securely sends the extracted tweet payloads to this local server, persisting them into a local SQLite database on your machine.

It features a high-fidelity, pixel-perfect Twitter-themed Web UI supporting full-text search, author filtering, media inspection, tag management, right-click context shortcuts, and one-click export to standard Markdown files (formatted for **Obsidian**, **Logseq**, and **Notion**).

---

## ✨ Key Features

1. **🔒 100% Local & Privacy-Focused**:
   - All tweets, metadata, tags, and media assets are stored exclusively on your local machine (`server/data/`). No data is ever sent to third-party clouds or remote analytics servers.
2. **⚡ Zero External Dependencies**:
   - Powered purely by the Python 3 standard library (`http.server`, `sqlite3`, `socketserver`, `urllib`). No `pip install` required, and no Node.js runtime needed.
3. **🖥️ Twitter-Native User Experience**:
   - 1:1 reproduction of the modern X/Twitter web interface design.
   - Dual view modes: Grid layout and List layout.
   - Multi-photo mosaic preview and dedicated video tags.
4. **🔍 Robust Search & Multi-Dimensional Filtering**:
   - Dual search bars: Full-text keyword/link search + Author handle (`@handle`) filter.
   - Granular dropdown filters: Media types (Text-only / Images / Video), language, time range (7 days / 30 days / 1 year), and tags.
5. **🏷️ Intuitive Tag Management & Context Actions**:
   - Right-click context popup on any tweet card to quickly attach tags or delete the tweet.
   - Comprehensive tag maintenance modal for batch renaming and organizing tags.
6. **📦 Knowledge-Base Ready Markdown Export**:
   - **Combined Markdown Document (.md)**: Merges selected tweets into a clean, structured digest.
   - **Individual Files Archive (.zip)**: Generates standalone `.md` files per tweet with standard YAML frontmatter, stats, and original quotes—ready for Obsidian or Logseq.
7. **🌐 Multi-Language Support (i18n)**:
   - Includes Traditional Chinese (繁體中文, default), English, German (Deutsch), French (Français), Spanish (Español), and Simplified Chinese (简体中文).

---

## 📁 Repository Structure

```text
x-sync-backend/
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

## 🚀 Getting Started

### Prerequisites
- **Operating System**: macOS / Windows / Linux
- **Python Runtime**: Python 3.9+ installed (`python3 --version` or `python --version`)

---

### Step 1: Launch the Local Server

#### 🔹 macOS / Linux
Open Terminal, navigate to the folder, and run:
```bash
chmod +x start.sh
./start.sh
```
*(The server starts listening on `http://localhost:8765/` and automatically opens the dashboard in your default browser).*

#### 🔹 Windows
Double-click **`start.bat`** in File Explorer, or open Command Prompt (CMD) / PowerShell:
```cmd
start.bat
```

#### 🔹 Manual Launch (Cross-Platform)
```bash
python3 server/server.py
# Or on Windows:
python server\server.py
```
Open your browser and visit: 👉 **[http://localhost:8765/](http://localhost:8765/)**

---

### Step 2: Install the Chrome Extension

1. Open Google Chrome (or any Chromium browser such as Edge or Brave).
2. Navigate to: `chrome://extensions/`
3. Toggle on **Developer mode** in the top right corner.
4. Click **Load unpacked** on the top left.
5. Select the **`extension`** directory from your X sync distribution.
6. The X sync icon will now appear in your browser toolbar.

---

### Step 3: Sync Your Bookmarks & Likes

1. In Chrome, log in to [x.com](https://x.com/).
2. Navigate to your **[Bookmarks](https://x.com/i/bookmarks)** or your profile's **Likes** tab.
3. Click the **X sync extension icon** in the toolbar.
4. Select your preferred sync batch (e.g., "Sync 50 Tweets", "Deep Sync 100", or "Full Sync").
5. Click **Sync Bookmarks** or **Sync Likes**.
6. A real-time HUD appears at the bottom-right corner of the page, automatically scrolling and de-duplicating tweets as it persists them into your local database.
7. Switch back to your dashboard at `http://localhost:8765/` to search, categorize, and export your collection!

---

## 💡 Maintenance & Backup

### 1. Backing Up Your Data
- All your synced tweets, tags, and history logs reside inside **`server/data/x_sync.db`**.
- To create a full backup, simply copy `x_sync.db` and the `server/data/media/` folder to your backup location.

### 2. Port Conflict Resolution
- The default port is `8765`. If port 8765 is occupied, open `server/server.py` and adjust `PORT = 8765` to another port (e.g., `8766`), then update the corresponding endpoint in the extension settings.

### 3. Publishing to GitHub
This archive includes a ready-to-use `.gitignore`. You can directly initialize and push it to your GitHub account:
```bash
# 1. Enter the extracted folder
cd x-sync-backend

# 2. Initialize Git
git init

# 3. Stage and commit files
git add .
git commit -m "Initial commit: X sync backend management system"

# 4. Link to your GitHub repository and push
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

---

## 📄 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
