@echo off
setlocal
title GOC UltraSafe SMART (fix broken images + preload all CSS)
echo ====================================================
echo  GOC UltraSafe SMART (v1)
echo  - Removes old no-srcset guard (external or inline)
echo  - Injects SMART inline fixer (repairs only imgs
echo    missing src by copying from srcset/picture)
echo  - Preloads EVERY stylesheet (up to 8)
echo  - Does NOT rewrite HTML image attributes
echo  - Backup: _backup_htmls_ultrasafe_smart
echo ====================================================
echo.

set SRC=%~dp0
set BACKUP=%SRC%_backup_htmls_ultrasafe_smart
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
  cscript //nologo "%~dp0goc-ultrasafe-smart.js" "%%f"
)

echo.
echo Done. Backups in: %BACKUP%
echo Close this window or press any key to exit.
pause
