#!/bin/bash
# ==================================================
# X sync - Local Management Server Launcher (macOS/Linux)
# ==================================================

# 取得專案根目錄（以目前腳本所在目錄動態定位）
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$PROJECT_ROOT/server"

echo "=================================================="
echo "  啟動 X sync 本機伺服器與資料庫..."
echo "  專案目錄: $PROJECT_ROOT"
echo "  服務目錄: $SERVER_DIR"
echo "  資料庫:   $SERVER_DIR/data/x_sync.db"
echo "=================================================="

# 確保資料與媒體儲存目錄存在
mkdir -p "$SERVER_DIR/data/media"

# 在預設瀏覽器開啟管理介面
if command -v open >/dev/null 2>&1; then
  (sleep 1 && open "http://localhost:8765/") &
elif command -v xdg-open >/dev/null 2>&1; then
  (sleep 1 && xdg-open "http://localhost:8765/") &
fi

# 啟動 Python 後端伺服器 (使用 Python 3 標準庫，零額外依賴)
cd "$SERVER_DIR" && python3 "server.py"
