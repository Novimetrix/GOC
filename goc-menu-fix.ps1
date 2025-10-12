# goc-menu-fix.ps1
# Use: Right-click → Run with PowerShell (or run in a PS window) inside your exported static site folder.
# It will:
#  1) Create /assets/js/fix-menu.js with a safe re-init for Blocksy menus.
#  2) Inject <script src="/assets/js/fix-menu.js" defer></script> before </body> in every .html/.htm file (if not present).

param(
  [string]$SiteRoot = "."
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path $SiteRoot

Write-Host "== GOC Static Menu Patch ==" -ForegroundColor Cyan
Write-Host "Root: $root"

# 1) Ensure assets/js exists
$assetsJs = Join-Path $root "assets/js"
New-Item -ItemType Directory -Path $assetsJs -Force | Out-Null

# 2) Write fix-menu.js
$fixJsPath = Join-Path $assetsJs "fix-menu.js"
$fixJs = @'
/**
 * fix-menu.js — Re-init Blocksy/Elementor bindings after HTTrack export.
 * Safe no-op if objects aren’t present.
 */
(function () {
  function reinit() {
    try {
      if (window.ctDrawer && typeof window.ctDrawer.init === 'function') {
        window.ctDrawer.init();
      }
    } catch (e) {}

    // Elementor frontend (if present)
    try {
      if (typeof elementorFrontend !== 'undefined' && elementorFrontend && typeof elementorFrontend.init === 'function') {
        elementorFrontend.init();
      }
    } catch (e) {}

    // Minimal generic fallback: togglers that specify a target via data-toggle-target
    try {
      document.querySelectorAll('[data-toggle-target]').forEach(function(btn){
        btn.__gocBound || btn.addEventListener('click', function(e){
          var sel = btn.getAttribute('data-toggle-target');
          if (!sel) return;
          var target = document.querySelector(sel);
          if (!target) return;
          target.classList.toggle('is-open');
          document.body.classList.toggle('goc-menu-open');
        });
        btn.__gocBound = true;
      });
    } catch(e) {}
  }

  var debouncing;
  function debounce(fn, wait){
    return function(){
      clearTimeout(debouncing);
      debouncing = setTimeout(fn, wait);
    };
  }

  document.addEventListener('DOMContentLoaded', reinit);
  window.addEventListener('load', reinit);
  window.addEventListener('resize', debounce(reinit, 200));
})();
'@

Set-Content -Path $fixJsPath -Value $fixJs -Encoding UTF8
Write-Host "Wrote: $fixJsPath" -ForegroundColor Green

# 3) Inject script tag into every .html/.htm if missing
$scriptTag = '<script src="/assets/js/fix-menu.js" defer></script>'
$files = Get-ChildItem -Path $root -Recurse -Include *.html, *.htm -File
$patched = 0
foreach ($f in $files) {
  $content = Get-Content $f.FullName -Raw
  if ($content -notmatch [regex]::Escape($scriptTag)) {
    if ($content -match '</body>') {
      $new = $content -replace '</body>', "$scriptTag`n</body>"
      Set-Content -Path $f.FullName -Value $new -Encoding UTF8
      $patched++
    } else {
      # If no </body>, append at end as a fallback
      Add-Content -Path $f.FullName -Value "`n$scriptTag`n"
      $patched++
    }
  }
}
Write-Host ("Patched {0} HTML file(s)." -f $patched) -ForegroundColor Yellow

Write-Host "Done. Deploy and purge cache." -ForegroundColor Cyan
