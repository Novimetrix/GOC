@echo off
setlocal enabledelayedexpansion

echo === GOC Performance Hybrid (v3) — images untouched; safe script defer ===
set SRC=%~dp0
set BACKUP=%SRC%_backup_htmls_perf_v3
if not exist "%BACKUP%" mkdir "%BACKUP%"

echo Backing up HTML files...
for /r "%SRC%" %%f in (*.html) do (
  copy "%%f" "%BACKUP%" >nul
)

echo Processing HTML files...
for /r "%SRC%" %%f in (*.html) do (
  echo Patching: %%~nxf
  cscript //nologo "%SRC%goc-perf-hybrid-v3.js" "%%f"
)

echo Done.
echo Backup: %BACKUP%
pause
