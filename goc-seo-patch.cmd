@echo off
setlocal enabledelayedexpansion

echo =====================================================
echo GOC SEO Full Patch Installer — greenoceanconsultants.com
echo =====================================================

REM ---------- 1. Create _redirects ----------
echo Creating _redirects...
(
echo # No automatic trailing slash redirects to avoid Cloudflare Pages errors
echo # Only include specific old-page redirects if needed
echo /old-page.html    /new-page/    301
) > _redirects

REM ---------- 2. Create _robots.txt ----------
echo Creating _robots.txt...
(
echo User-agent: *
echo Allow: /
echo Sitemap: [https://greenoceanconsultants.com/sitemap.xml](https://greenoceanconsultants.com/sitemap.xml)
echo Host: [https://greenoceanconsultants.com](https://greenoceanconsultants.com)
) > _robots.txt

REM ---------- 3. Create sitemap.xml ----------
echo Creating sitemap.xml...
(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<urlset xmlns="[http://www.sitemaps.org/schemas/sitemap/0.9"^>](http://www.sitemaps.org/schemas/sitemap/0.9%22^>)
echo   ^<url^>
echo     ^<loc^>[https://greenoceanconsultants.com/^](https://greenoceanconsultants.com/^)</loc^>
echo     ^<priority^>1.00^</priority^>
echo     ^<changefreq^>weekly^</changefreq^>
echo   ^</url^>
echo   ^<url^>
echo     ^<loc^>[https://greenoceanconsultants.com/contact/^](https://greenoceanconsultants.com/contact/^)</loc^>
echo     ^<priority^>0.6^</priority^>
echo     ^<changefreq^>monthly^</changefreq^>
echo   ^</url^>
echo ^</urlset^>
) > sitemap.xml

REM ---------- 4. Create version.txt ----------
echo Creating version.txt...
(
echo 2025-10-11
echo GOC SEO Patch v1
) > version.txt

REM ---------- 5. Scrub localhost & remove srcset ----------
echo Scrubbing localhost URLs and removing srcset/sizes from HTML files...
for /r %%f in (*.html) do (
echo Processing file: %%f
powershell -NoProfile -Command "(Get-Content -Raw '%%f') -replace 'https?://localhost(:\d+)?','' -replace 'https?://127.0.0.1(:\d+)?','' -replace '\s(srcset|sizes)="[^"]*"','' | Set-Content '%%f'"
if !errorlevel! neq 0 (
echo WARNING: failed to process %%f
)
)

REM ---------- 6. Generate Cloudflare Worker ----------
echo Generating cloudflare-worker-seo.js...
(
echo addEventListener('fetch', event => {
echo   event.respondWith(handle(event.request))
echo })

echo const DOMAIN = 'greenoceanconsultants.com'
echo const ORG_NAME = 'GOC Support Experts'
echo const DEFAULT_DESC = 'GOC provides businesses with exceptional customer experiences through reliable, efficient, and human-centered phone and chat support.'

echo async function handle(request) {
echo   const url = new URL(request.url)
echo   const resp = await fetch(request)
echo   const contentType = resp.headers.get('Content-Type') || ''

echo   if (!contentType.includes('text/html')) return resp

echo   let html = await resp.text()

echo   html = html.replace(/https?://localhost(:\d+)?/g, '')
echo   html = html.replace(/https?://127.0.0.1(:\d+)?/g, '')

echo   const pathname = url.pathname.replace(//index.html$/,'/')
echo   const canonical = `https://${DOMAIN}${pathname}`

echo   if (!/rel=['"]?canonical['"]?/.test(html)) {
echo     html = html.replace(/<head(?![\s\S]*rel=['"]?canonical['"]?)[\s\S]*?>/, match => {
echo       return match + `\n  <link rel="canonical" href="${canonical}" />`
echo     })
echo   } else {
echo     html = html.replace(/<link[^>]+rel=['"]?canonical['"]?[^>]*>/i, `<link rel="canonical" href="${canonical}" />`)
echo   }

echo   if (!/name=['"]description['"]/.test(html)) {
echo     html = html.replace(/<head(.*?)>/i, m => m + `\n  <meta name="description" content="${DEFAULT_DESC}" />`)
echo   }

echo   const og = `\n  <meta property="og:type" content="website" />\n  <meta property="og:site_name" content="${ORG_NAME}" />\n  <meta property="og:title" content="${ORG_NAME}" />\n  <meta property="og:description" content="${DEFAULT_DESC}" />\n  <meta property="og:url" content="${canonical}" />\n  <meta name="twitter:card" content="summary_large_image" />\n  <meta name="twitter:title" content="${ORG_NAME}" />\n  <meta name="twitter:description" content="${DEFAULT_DESC}" />\n`

echo   if (!/property=['"]og:title/.test(html)) {
echo     html = html.replace(/<head(.*?)>/i, m => m + og)
echo   }

echo   if (!/application/ld+json/.test(html)) {
echo     const jsonld = {
echo       "@context": "[https://schema.org](https://schema.org)",
echo       "@type": "Organization",
echo       "url": `https://${DOMAIN}`,
echo       "name": ORG_NAME

echo     }

echo     html = html.replace(/<head(.*?)>/i, m => m + `\n  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>`)
echo   }

echo   return new Response(html, resp)
echo }
) > cloudflare-worker-seo.js

echo =====================================================
echo Full patch completed!
echo - _redirects, _robots.txt, sitemap.xml, version.txt created
echo - localhost/srcset scrubbed in HTML files
echo - cloudflare-worker-seo.js generated
echo =====================================================
echo Next step: deploy cloudflare-worker-seo.js in Cloudflare dashboard
pause
