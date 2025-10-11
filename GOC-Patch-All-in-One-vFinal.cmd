@echo off
setlocal enabledelayedexpansion
title GOC Patch — All-in-One (vFinal)

echo =====================================================
echo   GOC Patch — All-in-One (vFinal)  [WSH / CMD]
echo   - Images kept working (no-srcset guard inlined)
echo   - Viewport + CSS preload + preconnect
echo   - localhost -> root-relative
echo   - Removes srcset/sizes (like your working patch)
echo   - Full backup before patching
echo =====================================================
echo.

set SRC=%~dp0
set BACKUP=%SRC%_backup_htmls_allinone
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
  echo -----------------------------------------------------
  echo Processing: %%~nxf
  cscript //nologo "%SRC%GOC-Patch-All-in-One-vFinal.js" "%%f"
)

echo.
echo Done. Backups in: %BACKUP%
echo Close this window or press any key to exit.
pause
