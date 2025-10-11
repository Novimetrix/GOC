@echo off
setlocal enabledelayedexpansion

echo === GOC Perf Runtime (v1) — images untouched; no PowerShell ===
set SRC=%~dp0
set BACKUP=%SRC%_backup_htmls_perf_runtime_v1
if not exist "%BACKUP%" mkdir "%BACKUP%"

echo Backing up HTML files...
for /r "%SRC%" %%f in (*.html) do (
  copy "%%f" "%BACKUP%" >nul
)

echo Processing HTML files...
for /r "%SRC%" %%f in (*.html) do (
  echo Patching: %%~nxf
  cscript //nologo "%SRC%goc-perf-runtime-v1.js" "%%f"
)

echo Done.
echo Backup: %BACKUP%
pause
