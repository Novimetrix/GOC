@echo off
setlocal ENABLEDELAYEDEXPANSION

:: Resolve this script's directory
set "HERE=%~dp0"

:: Use Windows PowerShell. If pwsh exists, you can switch, but sticking to built-in.
set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"

if not exist "%HERE%fix-and-patch-ONECLICK.ps1" (
  echo PowerShell script not found: "%HERE%fix-and-patch-ONECLICK.ps1"
  echo Make sure both the .cmd and .ps1 are in the same folder.
  pause
  exit /b 1
)

"%PS%" -NoProfile -ExecutionPolicy Bypass -File "%HERE%fix-and-patch-ONECLICK.ps1"
echo.
pause
