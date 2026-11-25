@echo off
chcp 65001 >nul
title BizPilot Server

echo.
echo  ██████╗ ██╗███████╗██████╗ ██╗██╗      ██████╗ ████████╗
echo  ██╔══██╗██║╚══███╔╝██╔══██╗██║██║     ██╔═══██╗╚══██╔══╝
echo  ██████╔╝██║  ███╔╝ ██████╔╝██║██║     ██║   ██║   ██║   
echo  ██╔══██╗██║ ███╔╝  ██╔═══╝ ██║██║     ██║   ██║   ██║   
echo  ██████╔╝██║███████╗██║     ██║███████╗╚██████╔╝   ██║   
echo  ╚═════╝ ╚═╝╚══════╝╚═╝     ╚═╝╚══════╝ ╚═════╝    ╚═╝   
echo.
echo  CRM для малого бизнеса
echo  ─────────────────────────────────────────
echo.

:: Check Python
where python >nul 2>&1
if errorlevel 1 (
    echo  [ОШИБКА] Python не найден. Установите Python 3.10+ с python.org
    pause
    exit /b 1
)

:: Go to script directory
cd /d "%~dp0"

:: Check if port 8123 is already in use
netstat -ano | findstr ":8123 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo  [ИНФО] Сервер уже запущен на порту 8123
    echo  Открываю браузер...
    timeout /t 1 /nobreak >nul
    start "" "http://localhost:8123"
    exit /b 0
)

echo  Запускаю сервер на http://localhost:8123
echo  Нажмите Ctrl+C для остановки
echo.

:: Start server and open browser after 2 seconds
start /b cmd /c "timeout /t 2 /nobreak >nul && start "" http://localhost:8123"

python server.py

echo.
echo  Сервер остановлен.
pause
