@echo off
setlocal enabledelayedexpansion

echo =====================================================
echo GOC SEO Full Patch Installer — greenoceanconsultants.com
echo =====================================================

REM ---------- 1. Create robots.txt (valid format) ----------
echo Creating robots.txt...
(
  echo User-agent: *
  echo Allow: /
  echo Sitemap: https://greenoceanconsultants.com/sitemap.xml
) > robots.txt
echo robots.txt created.

REM ---------- 2. Create safe _redirects (exact-path only) ----------
echo Creating _redirects...
(
  echo # Only include exact-path redirects to avoid Cloudflare Pages parsing errors
  echo # Example old page redirect - edit or remove as needed
  echo /old-page.html    /new-page/    301
) > _redirects
echo _redirects created.

REM ---------- 3. Create sitemap.xml ----------
echo Creating sitemap.xml...
(
  echo ^<?xml version="1.0" encoding="UTF-8"?^>
  echo ^<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"^>
  echo   ^<url^>
  echo     ^<loc^>https://greenoceanconsultants.com/^</loc^>
  echo     ^<priority^>1.00^</priority^>
  echo     ^<changefreq^>weekly^</changefreq^>
  echo   ^</url^>
  echo   ^<url^>
  echo     ^<loc^>https://greenoceanconsultants.com/contact/^</loc^>
  echo     ^<priority^>0.6^</priority^>
  echo     ^<changefreq^>monthly^</changefreq^>
  echo   ^</url^>
  echo ^</urlset^>
) > sitemap.xml
echo sitemap.xml created.

REM ---------- 4. Create version.txt ----------
echo Creating version.txt...
(
  echo 2025-10-11
  echo GOC SEO Patch v2
) > version.txt
echo version.txt created.

REM ---------- 5. Generate cloudflare-worker-seo.js ----------
echo Generating cloudflare-worker-seo.js...
(
  echo addEventListener('fetch', event => {
  echo   event.respondWith(handle(event.request))
  echo })
  echo
  echo const DOMAIN = 'greenoceanconsultants.com'
  echo const ORG_NAME = 'GOC Support Experts'
  echo const DEFAULT_DESC = 'GOC provides businesses with exceptional customer experiences through reliable, efficient, and human-centered phone and chat support.'
  echo
  echo async function handle(request) {
  echo   const url = new URL(request.url)
  echo   const resp = await fetch(request)
  echo   const contentType = resp.headers.get('Content-Type') || ''
  echo
  echo   if (!contentType.includes('text/html')) return resp
  echo
  echo   let html = await resp.text()
  echo
  echo   // remove localhost occurrences
  echo   html = html.replace(/https?:\\/\\/localhost(:\\d+)?/g, '')
  echo   html = html.replace(/https?:\\/\\/127\\.0\\.0\\.1(:\\d+)?/g, '')
  echo
  echo   const pathname = url.pathname.replace(/\\/index\\.html$/,'/')
  echo   const canonical = `https://${DOMAIN}${pathname}`
  echo
  echo   if (!/rel=['"]?canonical['"]?/.test(html)) {
  echo     html = html.replace(/<head(?![\\s\\S]*rel=['"]?canonical['"]?)[\\s\\S]*?>/, match => {
  echo       return match + `\n  <link rel="canonical" href="${canonical}" />`
  echo     })
  echo   } else {
  echo     html = html.replace(/<link[^>]+rel=['"]?canonical['"]?[^>]*>/i, `<link rel="canonical" href="${canonical}" />`)
  echo   }
  echo
  echo   if (!/name=['"]description['"]/.test(html)) {
  echo     html = html.replace(/<head(.*?)>/i, m => m + `\n  <meta name="description" content="${DEFAULT_DESC}" />`)
  echo   }
  echo
  echo   const og = `\n  <meta property="og:type" content="website" />\n  <meta property="og:site_name" content="${ORG_NAME}" />\n  <meta property="og:title" content="${ORG_NAME}" />\n  <meta property="og:description" content="${DEFAULT_DESC}" />\n  <meta property="og:url" content="${canonical}" />\n  <meta name="twitter:card" content="summary_large_image" />\n  <meta name="twitter:title" content="${ORG_NAME}" />\n  <meta name="twitter:description" content="${DEFAULT_DESC}" />\n`
  echo   if (!/property=['"]og:title['"]/.test(html)) {
  echo     html = html.replace(/<head(.*?)>/i, m => m + og)
  echo   }
  echo
  echo   if (!/application\\/ld\\+json/.test(html)) {
  echo     const jsonld = {
  echo       "@context": "https://schema.org",
  echo       "@type": "Organization",
  echo       "url": `https://${DOMAIN}`,
  echo       "name": ORG_NAME
  echo     }
  echo     html = html.replace(/<head(.*?)>/i, m => m + `\n  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>`)
  echo   }
  echo
  echo   return new Response(html, resp)
  echo }
) > cloudflare-worker-seo.js
echo cloudflare-worker-seo.js created.

REM ---------- 6. Create fix-html.ps1 (PowerShell script) ----------
echo Creating fix-html.ps1...
(
  echo # Backup HTML files & fix localhost/srcset issues
  echo $cwd = Get-Location
  echo $backup = Join-Path -Path $cwd -ChildPath "backup_html_before_scrub"
  echo if (-not (Test-Path $backup)) { New-Item -ItemType Directory -Path $backup | Out-Null }
  echo
  echo Get-ChildItem -Recurse -Filter *.html | ForEach-Object {
  echo   $src = $_.FullName
  echo   $rel = $src.Substring($cwd.Path.Length).TrimStart('\')
  echo   $dest = Join-Path $backup $rel
  echo   $dirdest = Split-Path $dest -Parent
  echo   if (-not (Test-Path $dirdest)) { New-Item -ItemType Directory -Path $dirdest -Force | Out-Null }
  echo   Copy-Item -Path $src -Destination $dest -Force
  echo }
  echo
  echo Write-Host "Backup complete. Now processing HTML files..."
  echo Get-ChildItem -Recurse -Filter *.html | ForEach-Object {
  echo   $path = $_.FullName
  echo   $text = Get-Content -Raw -Encoding UTF8 $path
  echo
  echo   # Replace absolute localhost or 127.0.0.1 (with optional port) and keep path
  echo   $text = $text -replace 'https?:\\/\\/localhost(?::\\d+)?(\\/[^\"\\s>]+)', '$1'
  echo   $text = $text -replace 'https?:\\/\\/127\\.0\\.0\\.1(?::\\d+)?(\\/[^\"\\s>]+)', '$1'
  echo
  echo   # Remove srcset, sizes, imagesrcset, data-srcset attributes (single or double quotes)
  echo   $text = $text -replace '\\s(?:srcset|sizes|imagesrcset|data-srcset)=(?:\"[^\"]*\"|''[^'']*'')', ''
  echo
  echo   # Remove any empty src=\"\" attributes left accidentally
  echo   $text = $text -replace '\\s?src\\s?=\\s?\"\"', ''
  echo
  echo   Set-Content -Path $path -Value $text -Encoding UTF8
  echo   Write-Host "Processed: $path"
  echo }
) > fix-html.ps1
echo fix-html.ps1 created.

REM ---------- 7. Run PowerShell fixer ----------
echo Running fix-html.ps1 (this will create a backup folder and process HTML)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%CD%\fix-html.ps1"
if errorlevel 1 (
  echo WARNING: PowerShell script returned an error. Check fix-html.ps1 and the console output above.
) else (
  echo PowerShell fixer completed successfully.
)

echo =====================================================
echo Patch finished.
echo - robots.txt, _redirects, sitemap.xml, version.txt created/updated.
echo - cloudflare-worker-seo.js generated.
echo - HTML files backed up to backup_html_before_scrub and processed.
echo =====================================================
echo Next steps:
echo 1) Inspect a few files in backup_html_before_scrub to confirm backup is OK.
echo 2) Open processed HTML files in the repo to confirm img src paths are now root-relative (no 'localhost').
echo 3) Commit & push changes, then redeploy Pages.
echo 4) Deploy cloudflare-worker-seo.js as a Worker and ensure the route greenoceanconsultants.com/* is set with Fail Open.
pause
endlocal
