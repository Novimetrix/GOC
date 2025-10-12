@echo off
REM goc-menu-fix.cmd — runs the PowerShell patch in the current folder
powershell -ExecutionPolicy Bypass -File "%~dp0goc-menu-fix.ps1" "."
echo.
echo Done. You can close this window.
pause
