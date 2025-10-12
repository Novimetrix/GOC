@echo off
setlocal
title GOC Image Rehydrate Runtime (DOM-only fix)
echo ====================================================
echo  GOC Image Rehydrate Runtime (v1)
echo  - Injects a DOM runtime that:
echo      * copies data-src / data-srcset / imagesrcset / data-sizes
echo        into real attributes
echo      * ensures <img> inside <picture> gets a 'src' fallback
echo  - Does NOT disable srcset, does NOT rewrite HTML files
echo  - Removes old no-srcset guards (external or inline)
echo  - Backup to _backup_htmls_rehydrate
echo ====================================================
echo.

set SRC=%~dp0
set BACKUP=%SRC%_backup_htmls_rehydrate
if not exist "%BACKUP%" (
  mkdir "%BACKUP%"
  echo Created backup folder: "%BACKUP%"
)

echo Backing up HTML files...
for /r "%SRC%" %%f in (*.html) do (
  copy /Y "%%f" "%BACKUP%" >nul
)

echo.
echo Injecting runtime...
for /r "%SRC%" %%f in (*.html) do (
  echo Processing: %%~nxf
  cscript //nologo "%~dp0goc-image-rehydrate.js" "%%f"
)

echo.
echo Done. Backups in: %BACKUP%
echo Close this window or press any key to exit.
pause
