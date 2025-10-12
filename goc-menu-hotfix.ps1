param(
  [switch]$Remove
)
$ErrorActionPreference='Stop'
$root = Get-Location
Write-Host "Working in $root"

# Targets: static export pages
$pages = Get-ChildItem -Recurse -File -Include *.html,*.htm

$hotfixId   = 'goc-menu-hotfix'
$hotfixCss  = @'
<style id="goc-menu-hotfix">
@media (max-width:1024px){
  .site-header, .ct-header { position:relative; z-index:100002 !important; }
  .ct-drawer, .ct-offcanvas, .offcanvas, nav[aria-label*="Mobile"] {
    position:fixed; z-index:100003 !important; pointer-events:auto !important;
  }
  body.ct-scroll-lock main,
  body.blocksy-offcanvas-open main,
  body.ct-scroll-lock [class*="hero"], body.blocksy-offcanvas-open [class*="hero"],
  body.ct-scroll-lock .elementor-section, body.blocksy-offcanvas-open .elementor-section {
    pointer-events:none !important;
  }
}
</style>
'@

$changed = 0

foreach($p in $pages){
  $t = Get-Content -LiteralPath $p.FullName -Raw -Encoding UTF8

  if($Remove){
    if($t -match 'id\s*=\s*"' + [regex]::Escape($hotfixId) + '"'){
      $t = [regex]::Replace($t, '<style[^>]*id\s*=\s*"' + [regex]::Escape($hotfixId) + '".*?</style>', '', 'Singleline,IgnoreCase')
      [IO.File]::WriteAllText($p.FullName,$t,[Text.UTF8Encoding]::new($false))
      Write-Host "Removed hotfix from: $($p.FullName)"
      $changed++
    }
    continue
  }

  # Ensure viewport meta for proper mobile behavior
  if($t -notmatch '<meta\s+name\s*=\s*"viewport"'){
    $viewport = '<meta name="viewport" content="width=device-width, initial-scale=1">'
    if($t -match '</head>'){
      $t = $t -replace '</head>', ($viewport + "`r`n</head>")
    } else {
      $t = $viewport + "`r`n" + $t
    }
  }

  # Inject hotfix once per page
  if($t -notmatch 'id\s*=\s*"' + [regex]::Escape($hotfixId) + '"'){
    if($t -match '</head>'){
      $t = $t -replace '</head>', ($hotfixCss + "`r`n</head>")
    } else {
      $t = $t + "`r`n" + $hotfixCss + "`r`n"
    }
    [IO.File]::WriteAllText($p.FullName,$t,[Text.UTF8Encoding]::new($false))
    Write-Host "Injected hotfix into: $($p.FullName)"
    $changed++
  }
}

Write-Host "`nDone. Pages changed: $changed"
if($Remove){ Write-Host "Revert complete." } else { Write-Host "Hotfix applied. If needed, run with -Remove to undo." }
