@echo off
setlocal ENABLEDELAYEDEXPANSION

REM drop-in-headers.cmd — puts a Cloudflare Pages `_headers` file
REM into common build output folders so headers apply without
REM hunting for config.

set "ROOT=%~dp0"
set "TMP=%ROOT%headers_tmp_%RANDOM%.txt"

REM --- Write headers content ---
(
echo /wp-content/themes/blocksy/static/bundle/*
echo   Content-Type: application/javascript
echo   X-Content-Type-Options: nosniff
echo   Cross-Origin-Resource-Policy: cross-origin
echo.
echo /wp-content/plugins/*
echo   Content-Type: application/javascript
echo   X-Content-Type-Options: nosniff
echo   Cross-Origin-Resource-Policy: cross-origin
echo.
echo /*.js
echo   Content-Type: application/javascript
echo   X-Content-Type-Options: nosniff
) > "!TMP!"

REM --- Target folders (root + common build dirs) ---
set DIRS=.^ public^ dist^ build^ out^ static

for %%D in (!DIRS!) do (
  if "%%D"=="." (
    copy /Y "!TMP!" "%ROOT%_headers" >nul
    echo Wrote: %ROOT%_headers
  ) else (
    if not exist "%ROOT%%%D" mkdir "%ROOT%%%D" >nul 2>nul
    copy /Y "!TMP!" "%ROOT%%%D\_headers" >nul
    echo Wrote: %ROOT%%%D\_headers
  )
)

del /Q "!TMP!" >nul 2>nul
echo.
echo Done. Commit the new ^/_headers files and push. Then purge Cloudflare cache.
pause
