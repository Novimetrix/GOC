@echo off
setlocal enabledelayedexpansion

echo === GOC SEO + Mobile Fix (v4.2) ===
echo Backing up current HTML files...

set SRC=%~dp0
set BACKUP=%SRC%_backup_htmls
if not exist "%BACKUP%" mkdir "%BACKUP%"

for /r "%SRC%" %%f in (*.html) do (
  copy "%%f" "%BACKUP%" >nul
)

echo Processing HTML files...
for /r "%SRC%" %%f in (*.html) do (
  echo Patching: %%~nxf
  cscript //nologo "%SRC%goc-seo-perf-v4.2.js" "%%f"
)

echo Done.
pause
