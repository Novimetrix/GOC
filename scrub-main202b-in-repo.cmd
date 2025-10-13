@echo off
setlocal ENABLEDELAYEDEXPANSION

:: Scrub ONLY Blocksy "main202b.js" and its references in the REPO folder
:: Usage:
::   Double-click to run on default repo path, or pass a custom path:
::     scrub-main202b-in-repo.cmd "C:\Path\to\repo\root"

set "HERE=%~dp0"
set "ROOT=%~1"
if "%ROOT%"=="" set "ROOT=C:\NovimetrixRepo\GOC"

echo Repo root: "%ROOT%"

set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
"%PS%" -NoProfile -ExecutionPolicy Bypass -File "%HERE%scrub-main202b-in-repo.ps1" -Root "%ROOT%"

echo.
echo Done. Press any key to close...
pause >nul
