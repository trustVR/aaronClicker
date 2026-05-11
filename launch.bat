@echo off
setlocal EnableExtensions

set "APP_VERSION=1.0.5"
set "UPDATE_MANIFEST_URL=https://raw.githubusercontent.com/trustVR/aaronClicker/main/update-manifest.json"
set "UPDATE_HELPER_PORT=18172"
set "APP_FILE=%~dp0Game files\index.html"
set "APP_URL="
set "BROWSER="

if defined UPDATE_MANIFEST_URL (
  powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%~dp0updater.ps1" -AppRoot "%~dp0" -CurrentVersion "%APP_VERSION%" -ManifestUrl "%UPDATE_MANIFEST_URL%" >nul 2>nul
  powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%~dp0update-server.ps1" -AppRoot "%~dp0" -CurrentVersion "%APP_VERSION%" -ManifestUrl "%UPDATE_MANIFEST_URL%" -Port "%UPDATE_HELPER_PORT%" >nul 2>nul
)

for /f "usebackq delims=" %%U in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = (Resolve-Path -LiteralPath $env:APP_FILE).Path; [System.Uri]::new($p).AbsoluteUri"`) do set "APP_URL=%%U"
if not defined APP_URL (
  set "APP_URL=%APP_FILE:\=/%"
  set "APP_URL=file:///%APP_URL%"
)

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%LocalAppData%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%LocalAppData%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "BROWSER=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER for /f "tokens=2,*" %%A in ('reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe" /ve 2^>nul ^| findstr /i "REG_"') do set "BROWSER=%%B"
if not defined BROWSER for /f "tokens=2,*" %%A in ('reg query "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe" /ve 2^>nul ^| findstr /i "REG_"') do set "BROWSER=%%B"
if not defined BROWSER for /f "tokens=2,*" %%A in ('reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" /ve 2^>nul ^| findstr /i "REG_"') do set "BROWSER=%%B"
if not defined BROWSER for /f "tokens=2,*" %%A in ('reg query "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" /ve 2^>nul ^| findstr /i "REG_"') do set "BROWSER=%%B"

if defined BROWSER (
  start "Aaron Clicker" "%BROWSER%" --app="%APP_URL%" --window-size=1100,720
) else (
  start "" "%APP_FILE%"
)

endlocal
