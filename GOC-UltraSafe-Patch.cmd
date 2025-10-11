@echo off
setlocal enabledelayedexpansion
title GOC Ultra‑Safe Patch (inline no-srcset + CSS preload only)

echo ========= GOC Ultra‑Safe Patch =========
echo This ONLY inlines no-srcset.js and preloads the first CSS.
echo It does NOT change images, src/srcset/sizes, URLs, or scripts.
echo A backup will be created.
echo ========================================
echo.

set SRC=%~dp0
set BACKUP=%SRC%_backup_htmls_ultrasafe
if not exist "%BACKUP%" (
  mkdir "%BACKUP%"
  echo Created backup folder: "%BACKUP%"
)

echo Backing up HTML files...
for /r "%SRC%" %%f in (*.html) do (
  copy /Y "%%f" "%BACKUP%" >nul
)

echo.
echo Patching HTML files...
for /r "%SRC%" %%f in (*.html) do (
  echo Processing: %%~nxf
  cscript //nologo "%SRC%goc-ultrasafe.js" "%%f"
)

echo.
echo Done. Backups in: %BACKUP%
echo Close this window or press any key to exit.
pause
