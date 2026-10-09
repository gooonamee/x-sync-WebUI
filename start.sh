#!/bin/bash
# ==================================================
# X sync - Local Management Server Launcher (macOS/Linux)
# ==================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/server"

echo "=================================================="
echo "  啟動 X sync 本機伺服器與資料庫..."
echo "  目錄: $SERVER_DIR"
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
python3 "$SERVER_DIR/server.py"
