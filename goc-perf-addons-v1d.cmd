@echo off
setlocal
echo === GOC Perf Add-ons (v1d JS) — images untouched ===
for /r "%~dp0" %%f in (*.html) do (
  echo Patching: %%~nxf
  cscript //nologo "%~dp0goc-perf-addons-v1d.js" "%%f"
)
echo Done.
pause
