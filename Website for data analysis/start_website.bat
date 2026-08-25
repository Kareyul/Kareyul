@echo off
title Launch Data Analysis Website

echo ===================================================
echo 🚀 Launching Data Analysis Portal...
echo ===================================================

:: Check if the Node.js server is already running on port 3000
netstat -ano | findstr :3000 > nul
if %errorlevel% equ 0 (
    echo [OK] Node.js server is already running on port 3000.
) else (
    echo [INFO] Starting Node.js server...
    :: Launch Node.js server in a separate minimized or background window
    start "Node.js Data Analysis Server" /min cmd /c "node server.js"
    echo [INFO] Waiting 2 seconds for server to initialize...
    timeout /t 2 > nul
)

echo [OK] Opening browser to http://localhost:3000...
start http://localhost:3000

echo ===================================================
echo Done! You can close this window now.
echo ===================================================
timeout /t 3 > nul
exit
