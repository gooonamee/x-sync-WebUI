@echo off
chcp 65001 >nul
echo ==================================================
echo   Starting X sync Local Management Server...
echo ==================================================

if not exist "%~dp0server\data\media" (
    mkdir "%~dp0server\data\media"
)

start "" http://localhost:8765/
python "%~dp0server\server.py"
pause
