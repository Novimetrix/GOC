$ErrorActionPreference='Stop'
$root = Get-Location
Write-Host "Working in $root"

# -------------------------
# 1) Rewrite localhost + strip srcset/sizes in HTML/HTM/XML ONLY
# -------------------------
$targets = Get-ChildItem -Recurse -File -Include *.html,*.htm,*.xml

# These are SAFE for markup only. Do NOT include the 'collapse // to /' rule.
$rules = @(
  @{p='https?://localhost:\d+/'; r='/'},             # normal localhost
  @{p='https?://127\.0\.0\.1:\d+/'; r='/'},          # 127.0.0.1
  @{p='http%3A%2F%2Flocalhost%3A\d+%2F'; r='/'},     # URL-encoded localhost
  @{p='http%3A%2F%2F127\.0\.0\.1%3A\d+%2F'; r='/'},  # URL-encoded 127.0.0.1

  # Strip responsive attributes that cause missing images after export
  @{p='(?:\s)(srcset|imagesrcset)\s*=\s*\"[^\"]*\"'; r=''},
  @{p="(?:\s)(srcset|imagesrcset)\s*=\s*'[^']*'"; r=''},
  @{p='(?:\s)sizes\s*=\s*\"[^\"]*\"'; r=''},
  @{p="(?:\s)sizes\s*=\s*'[^']*'"; r=''}
)

$changed = @()

foreach($f in $targets){
  $text = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8
  $new  = $text
  foreach($r in $rules){ $new = [regex]::Replace($new,$r.p,$r.r) }

  if($new -ne $text){
    [IO.File]::WriteAllText($f.FullName,$new,[Text.UTF8Encoding]::new($false))
    Write-Host "Patched: $($f.FullName)"
    $changed += $f.FullName
  }
}

# -------------------------
# 2) Ensure runtime guard exists and is injected once
# -------------------------
$assetRelPath = "assets/js/no-srcset.js"
$assetFile = Join-Path $root $assetRelPath

$runtime = @'
(function(){
  if(window.__noSrcsetActive)return; window.__noSrcsetActive=true;
  function strip(el){ if(!el)return; el.removeAttribute("srcset"); el.removeAttribute("imagesrcset"); el.removeAttribute("sizes"); }
  function sweep(root){ (root.querySelectorAll?root:document).querySelectorAll("img,source,link").forEach(strip); }
  sweep(document);
  var mo=new MutationObserver(function(ms){ ms.forEach(function(m){
    if(m.type==="childList"){ m.addedNodes.forEach(function(n){ if(n.nodeType===1) sweep(n); }); }
    else if(m.type==="attributes"){ strip(m.target); }
  });});
  mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["srcset","imagesrcset","sizes"]});
})();
'@

# Write runtime guard
$assetDir = Split-Path $assetFile -Parent
if(-not (Test-Path $assetDir)){ New-Item -ItemType Directory -Path $assetDir | Out-Null }
[IO.File]::WriteAllText($assetFile,$runtime,[Text.UTF8Encoding]::new($false))
Write-Host "Wrote runtime guard: $assetRelPath"

# Inject a reference to the runtime guard into HTML pages (once)
$inject = '<script src="/assets/js/no-srcset.js"></script>'
$headOrBodyPattern = '</head>|</body>'

$pages = Get-ChildItem -Recurse -File -Include *.html,*.htm
foreach($h in $pages){
  $t = Get-Content -LiteralPath $h.FullName -Raw -Encoding UTF8
  if($t -notmatch [regex]::Escape($inject)){
    if($t -match '</head>'){
      $t = $t -replace '</head>', ($inject + "`r`n</head>")
    } elseif($t -match '</body>'){
      $t = $t -replace '</body>', ($inject + "`r`n</body>")
    } else {
      # Fallback: append at end
      $t = $t + "`r`n" + $inject + "`r`n"
    }
    [IO.File]::WriteAllText($h.FullName,$t,[Text.UTF8Encoding]::new($false))
    Write-Host "Injected script into: $($h.FullName)"
    $changed += $h.FullName
  }
}

# -------------------------
# 3) SAFE pass for JS/CSS assets: ONLY fix localhost → root. Do NOT touch anything else.
# -------------------------
$assetTargets = Get-ChildItem -Recurse -File -Include *.js,*.css
$assetRules = @(
  @{p='https?://localhost:\d+/'; r='/'},             # keep URLs root-relative
  @{p='https?://127\.0\.0\.1:\d+/'; r='/'},          # 127.0.0.1
  @{p='http%3A%2F%2Flocalhost%3A\d+%2F'; r='/'},     # URL-encoded localhost
  @{p='http%3A%2F%2F127\.0\.0\.1%3A\d+%2F'; r='/'}   # URL-encoded 127.0.0.1
)

foreach($f in $assetTargets){
  $text = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8
  $new  = $text
  foreach($r in $assetRules){ $new = [regex]::Replace($new,$r.p,$r.r) }
  if($new -ne $text){
    [IO.File]::WriteAllText($f.FullName,$new,[Text.UTF8Encoding]::new($false))
    Write-Host "Patched asset: $($f.FullName)"
    $changed += $f.FullName
  }
}

# -------------------------
# 4) Summary
# -------------------------
$localhostLeft = (Get-ChildItem -Recurse -File -Include *.html,*.htm,*.xml,*.js,*.css | Select-String -SimpleMatch 'localhost:' | Measure-Object).Count
$srcsetLeft    = (Get-ChildItem -Recurse -File -Include *.html,*.htm | Select-String -Pattern 'srcset=|imagesrcset=|sizes=' | Measure-Object).Count

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host ("  Files changed: {0}" -f ($changed | Select-Object -Unique | Measure-Object).Count)
Write-Host ("  localhost refs left (all files): {0}" -f $localhostLeft)
Write-Host ("  srcset/sizes left (HTML): {0}" -f $srcsetLeft)
Write-Host "Open GitHub Desktop → the edited files should now appear under Changes."
