# X-sync WebUI

> 🚀 **X-sync WebUI 專為視覺化檢視與整理透過 X-Sync Chrome 擴充功能所儲存的 X 書籤與點讚資料而設計**

在本地使用 X-sync WebUI 檢視您的資料非常簡單，只需幾步：
1. 從本倉庫下載檔案至您指定的資料夾。
2. 點擊或執行 `./start.sh`（Mac / Linux）或 `start.bat`（Windows）。
3. 打開瀏覽器訪問 [http://localhost:8765](http://localhost:8765) 網頁。

> ℹ️ **注意**：運行 X-sync WebUI 需要目標電腦已安裝 Python 3。

- 🌐 **官方網站**：[https://www.gooo.name/tool/Browser/Xsync.html](https://www.gooo.name/tool/Browser/Xsync.html)
- 📦 **X-sync Extension WebUI 倉庫**：[https://github.com/gooonamee/x-sync-WebUI](https://github.com/gooonamee/x-sync-WebUI)

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

## 🧩 如何搭配 Chrome 擴充功能同步

### 第一步：安裝 Chrome 瀏覽器外掛
1. 前往 Chrome 線上應用程式商店 [「X sync」擴充功能頁面](https://chromewebstore.google.com/detail/ffpdbmdjolkbfoapdcdepojhhncpopjm?utm_source=item-share-cb)。
2. 點擊 **「加到 Chrome」**（Add to Chrome）按鈕。
3. 安裝完成！Chrome 工具列將出現 X sync 專屬圖示。

### 第二步：開始同步您的 X 書籤與點讚
1. 在 Chrome 中開啟並登入 [x.com](https://x.com/)。
2. 前往您的 **[書籤頁面](https://x.com/i/bookmarks)** 或個人資料頁的 **「喜歡 (Likes)」** 分頁。
3. 點擊瀏覽器工具列上的 **X sync 擴充功能圖示**。
4. 選擇同步模式（例如：「一次同步 50 筆」、「深度同步 100 筆」或「全量同步」）。
5. 點擊 **「開始同步書籤」** 或 **「開始同步點讚」**。
6. 頁面右下角將顯示即時進度視窗，採集到的推文將自動去重並即時寫入本機資料庫。
7. 同步完成後，回到管理介面 ([http://localhost:8765](http://localhost:8765)) 重新整理，即可立即瀏覽與管理推文！

---

## 📁 目錄結構說明

```text
x-sync-WebUI/
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

## 💡 常見問題與備份指引

- **如何備份推文資料**：您的所有推文、標籤與同步紀錄均保存在 `server/data/x_sync.db` 中。您只需將 `x_sync.db` 與 `server/data/media/` 資料夾複製至備份硬碟，即可完成 100% 完整離線備份。
- **連接埠 8765 被佔用**：預設連接埠為 `8765`。若需更換，可直接透過環境變數啟動：`PORT=8766 python3 server/server.py`，或編輯 `server/server.py` 中的連接埠設定。

---

## 📄 開源授權

本專案採用 [MIT License](https://opensource.org/licenses/MIT) 授權釋出，歡迎自由分叉、修改與再發布。
