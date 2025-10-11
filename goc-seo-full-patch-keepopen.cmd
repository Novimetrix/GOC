@echo off
title GOC SEO Full Patch Runner (v2)
echo === GOC SEO Full Patch Runner (v2) ===
cd /d "%~dp0"

powershell -ExecutionPolicy Bypass -File .\fix-html.ps1
powershell -ExecutionPolicy Bypass -File .\scan-missing-images.ps1

echo.
echo Patch run finished. If missing images were found, open missing_images_report.csv.
pause
