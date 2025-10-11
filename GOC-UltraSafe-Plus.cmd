@echo off
setlocal
title GOC UltraSafe+ (inline no-srcset + preload ALL CSS)
echo ===============================================
echo  GOC UltraSafe+ (v1)
echo  - Inlines no-srcset.js (no network hop)
echo  - Adds <link rel="preload" as="style"> for
echo    EVERY stylesheet on the page (up to 8)
echo  - Does NOT change images/src/srcset/sizes
echo  - Does NOT change scripts (other than inlining)
echo  - Makes a backup: _backup_htmls_ultrasafe_plus
echo ===============================================
echo.

set SRC=%~dp0
set BACKUP=%SRC%_backup_htmls_ultrasafe_plus
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
  cscript //nologo "%~dp0goc-ultrasafe-plus.js" "%%f"
)

echo.
echo Done. Backups in: %BACKUP%
echo Close this window or press any key to exit.
pause
