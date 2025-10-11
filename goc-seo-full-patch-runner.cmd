@echo off
title GOC SEO Full Patch Runner (AutoFetch v2)
echo === GOC SEO Full Patch Runner (AutoFetch v2) ===
cd /d "%~dp0"

powershell -ExecutionPolicy Bypass -File .\fix-html.ps1
powershell -ExecutionPolicy Bypass -File .\scan-missing-images.ps1
powershell -ExecutionPolicy Bypass -File .\fetch-missing-images.ps1
powershell -ExecutionPolicy Bypass -File .\scan-missing-images.ps1

echo.
echo All steps finished. Check missing_images_report.csv for any remaining items.
pause
