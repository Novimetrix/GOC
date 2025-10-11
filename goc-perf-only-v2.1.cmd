@echo off
setlocal enabledelayedexpansion

echo === GOC Performance Patch (v2.1 - SAFE, images untouched) ===
echo Backing up current HTML files...

set SRC=%~dp0
set BACKUP=%SRC%_backup_htmls_perf_v21
if not exist "%BACKUP%" mkdir "%BACKUP%"

for /r "%SRC%" %%f in (*.html) do (
  copy "%%f" "%BACKUP%" >nul
)

echo Processing HTML files (performance hints only)...
for /r "%SRC%" %%f in (*.html) do (
  echo Patching: %%~nxf
  cscript //nologo "%SRC%goc-perf-only-v2.1.js" "%%f"
)

echo Done.
pause
