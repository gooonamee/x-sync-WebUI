# X sync 後台管理系統 (X-Sync Local Management Backend)

> 🚀 **專為 X (Twitter) 書籤與點讚設計的本機管理面板與微服務**  
> 隱私至上、100% 離線運行、零外部依賴、純 Python 3 標準庫打造。

---

## 📖 專案簡介

**X sync 後台管理系統** 是搭配 **X sync 瀏覽器擴充功能** 使用的本機管理後台與資料保存服務。當您透過擴充功能在 x.com (Twitter) 採集書籤或點讚內容時，擴充功能會自動將推文資料與多媒體連結傳送至此本地伺服器，並安全地寫入本機 SQLite 資料庫中。

本系統內建高質感、像素級還原 Twitter 風格的 Web 管理介面，支援全文搜尋、作者檢索、媒體篩選、標籤分類管理、右鍵捷徑操作，以及單篇/批次匯出標準 Markdown 文件（適配 Obsidian、Logseq、Notion 等知識庫工具）。

---

## ✨ 核心特色

1. **🔒 100% 本地隱私保障**：
   - 所有推文資料、標籤與媒體圖片皆儲存於您電腦本機（`server/data/`），絕不上傳至任何第三方雲端或遠端伺服器。
2. **⚡ 零環境依賴 (Zero Dependencies)**：
   - 僅使用 Python 3 原生標準庫（`http.server`、`sqlite3`、`socketserver`、`urllib`），不需要執行 `pip install`，也不需安裝 Node.js，開箱即用。
3. **🖥️ 現代化 Twitter 風格介面**：
   - 1:1 還原 Twitter / X 的視覺體驗與深淺色搭配。
   - 支援網格檢視（Grid）與列表檢視（List）切換。
   - 支援多圖排版拼貼與影片標籤預覽。
4. **🔍 強大的搜尋與多維度過濾**：
   - 雙搜尋引擎：內文全文檢索、原作者暱稱/帳號 (`@handle`) 搜尋。
   - 條件篩選：按媒體類型（純文字 / 含圖片 / 含影片）、貼文語言、時間範圍（7天 / 30天 / 1年）及自定義標籤快速過濾。
5. **🏷️ 靈活的標籤管理系統**：
   - 單則推文右鍵選單：滑鼠右鍵點擊卡片可快速新增/移除標籤，或一鍵刪除推文。
   - 專屬標籤維護中心：支援標籤更名、批次替換與合併。
6. **📦 知識庫級別的 Markdown 匯出**：
   - **單一彙總文件 (.md)**：將勾選推文合併為一份結構清晰的報告。
   - **獨立壓縮包 (.zip)**：為每篇推文建立獨立 `.md` 檔案，內建標準 YAML Frontmatter 元數據與原文連結，完美相容 Obsidian 與 Logseq。
7. **🌐 完整多語言國際化 (i18n)**：
   - 預設繁體中文，並支援 English (en)、Deutsch (德文)、Français (法文)、Español (西班牙文)、简体中文，介面即時無縫切換。

---

## 📁 目錄結構說明

```text
x-sync-backend/
├── server/                     # 本地後端服務與資料庫
│   ├── server.py               # HTTP API 伺服器 (預設連接埠 8765)
│   ├── database.py             # SQLite 資料庫連線與結構定義
│   ├── markdown_exporter.py    # Markdown 匯出與 ZIP 壓縮引擎
│   └── data/                   # 資料保存目錄 (已加入 .gitignore)
│       ├── x_sync.db           # 空白 SQLite 資料庫實體檔案
│       └── media/              # 本地下載的媒體檔案存放資料夾 (.gitkeep)
├── web/                        # 前端管理介面 (純靜態檔案)
│   ├── index.html              # 管理後台主頁面
│   ├── style.css               # 樣式定義
│   ├── app.js                  # 核心互動邏輯與 API 通訊
│   ├── i18n.js                 # 多語言翻譯字典
│   └── assets/                 # Logo 與品牌圖示資源
├── start.sh                    # macOS / Linux 一鍵啟動腳本
├── start.bat                   # Windows 一鍵啟動腳本
├── .gitignore                  # Git 忽略配置規則 (排除暫存與下載快取)
├── README-zhtw.md              # 繁體中文說明文件
└── README.md                   # 英文說明文件
```

---

## 🚀 快速開始使用

### 系統需求
- **作業系統**：macOS / Windows / Linux
- **Python 環境**：Python 3.9 或更高版本（確認終端機輸入 `python3 --version` 或 `python --version` 可正常顯示）

---

### 第一步：啟動本機伺服器

#### 🔹 macOS / Linux
開啟終端機 (Terminal)，進入專案目錄後執行：
```bash
chmod +x start.sh
./start.sh
```
*(伺服器將在後台監聽 `http://localhost:8765/`，並自動為您在瀏覽器開啟管理面板)*

#### 🔹 Windows
雙擊資料夾內的 **`start.bat`**，或在命令提示字元 (CMD) / PowerShell 中執行：
```cmd
start.bat
```

#### 🔹 手動啟動方式 (跨平台通用)
```bash
python3 server/server.py
# 或在 Windows:
python server\server.py
```
啟動成功後，打開瀏覽器訪問：👉 **[http://localhost:8765/](http://localhost:8765/)**

---

### 第二步：安裝 Chrome 瀏覽器外掛

1. 打開 Google Chrome（或 Chromium 架構瀏覽器如 Edge / Brave）。
2. 在網址列輸入並前往：`chrome://extensions/`
3. 開啟右上角的 **「開發人員模式 (Developer mode)」**。
4. 點選左上角的 **「載入未打包項目 (Load unpacked)」**。
5. 選取您的 **X sync 擴充功能資料夾 (`extension`)**。
6. 安裝完成後，Chrome 工具列將出現 X sync 專屬圖示。

---

### 第三步：開始同步您的 X 書籤與點讚

1. 在 Chrome 中開啟並登入 [x.com](https://x.com/)。
2. 前往您的 **[書籤頁面](https://x.com/i/bookmarks)** 或個人資料頁的 **「喜歡 (Likes)」** 分頁。
3. 點擊瀏覽器工具列上的 **X sync 擴充功能圖示**。
4. 選擇同步模式（例如：「一次同步 50 筆」、「深度同步 100 筆」或「全量同步」）。
5. 點擊 **「開始同步書籤」** 或 **「開始同步點讚」**。
6. 頁面右下角將顯示即時進度視窗，採集到的推文將自動去重並即時寫入本機資料庫。
7. 同步完成後，回到管理介面 (`http://localhost:8765/`) 重新整理，即可立即瀏覽與管理推文！

---

## 💡 常見問題與備份指引

### 1. 如何備份我已同步的推文資料？
- 您的所有推文、標籤與同步紀錄均保存在 **`server/data/x_sync.db`** 中。
- 您只需將 `x_sync.db` 與 `server/data/media/` 資料夾複製至備份硬碟或隨身碟，即可完成 100% 完整離線備份。

### 2. 連接埠 8765 被佔用怎麼辦？
- 預設連接埠為 `8765`。若需更換，請編輯 `server/server.py` 頂部的 `PORT = 8765` 改為其他可用埠號（如 `8766`），並同步更新擴充功能中的 API 端點網址。

### 3. 如何上傳部署至個人的 GitHub 倉庫？
本壓縮包已內建標準 `.gitignore`，解壓縮後即可直接初始化 Git：
```bash
# 1. 進入解壓縮後的目錄
cd x-sync-backend

# 2. 初始化 Git 倉庫
git init

# 3. 加入所有檔案並提交
git add .
git commit -m "Initial commit: X sync backend management system"

# 4. 關聯到您的 GitHub 倉庫並推播 (請替換為您的倉庫網址)
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

---

## 📄 開源授權

本專案採用 [MIT License](https://opensource.org/licenses/MIT) 授權釋出，歡迎自由分叉、修改與再發布。
