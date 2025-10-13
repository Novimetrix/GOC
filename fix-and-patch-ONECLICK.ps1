$ErrorActionPreference='Stop'
$root = Get-Location
Write-Host "Working in $root"

# 1) Rewrite localhost + strip srcset/sizes in text files
$targets = Get-ChildItem -Recurse -File -Include *.html,*.htm,*.xml,*.js,*.css
$rules = @(
  @{p='https?://localhost:\d+/'; r='/'},
  @{p='https?://127\.0\.0\.1:\d+/'; r='/'},
  @{p='http%3A%2F%2Flocalhost%3A\d+%2F'; r='/'},
  @{p='http%3A%2F%2F127\.0\.0\.1%3A\d+%2F'; r='/'},
  @{p='(?:\s)(srcset|imagesrcset)\s*=\s*"[^"]*"'; r=''},
  @{p="(?:\s)(srcset|imagesrcset)\s*=\s*'[^']*'"; r=''},
  @{p='(?:\s)sizes\s*=\s*"[^"]*"'; r=''},
  @{p="(?:\s)sizes\s*=\s*'[^']*'"; r=''},
  @{p='(?<!:)/{2,}'; r='/'}
)

$changed=@()
foreach($f in $targets){
  $orig = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8
  $new = $orig
  foreach($r in $rules){ $new = [regex]::Replace($new,$r.p,$r.r) }
  if($new -ne $orig){
    [IO.File]::WriteAllText($f.FullName,$new,[Text.UTF8Encoding]::new($false))
    $changed += $f.FullName
    Write-Host "Changed: $($f.FullName)"
  }
}

# 2) Ensure runtime guard file exists/updated
$assetDir = Join-Path $root "assets\js"
$assetFile = Join-Path $assetDir "no-srcset.js"
if(!(Test-Path $assetDir)){ New-Item -ItemType Directory -Path $assetDir -Force | Out-Null }
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
$needsWrite = $true
if(Test-Path $assetFile){
  if((Get-Content -LiteralPath $assetFile -Raw -Encoding UTF8) -eq $runtime){ $needsWrite=$false }
}
if($needsWrite){
  [IO.File]::WriteAllText($assetFile,$runtime,[Text.UTF8Encoding]::new($false))
  Write-Host "Updated: $assetFile"
}

# 3) Inject <script src="/assets/js/no-srcset.js"></script> into HTML files (once)
$inject = '<script src="/assets/js/no-srcset.js"></script>'
$htmls = Get-ChildItem -Recurse -File -Include *.html,*.htm
foreach($h in $htmls){
  $t = Get-Content -LiteralPath $h.FullName -Raw -Encoding UTF8
  if($t -notmatch [regex]::Escape($inject)){
    if($t -match '</head>'){
      $t = $t -replace '</head>', ($inject + "`r`n</head>")
    } elseif($t -match '</body>'){
      $t = $t -replace '</body>', ($inject + "`r`n</body>")
    } else {
      $t += "`r`n$inject`r`n"
    }
    [IO.File]::WriteAllText($h.FullName,$t,[Text.UTF8Encoding]::new($false))
    Write-Host "Injected script into: $($h.FullName)"
    $changed += $h.FullName
  }
}

# 4) Summary for GitHub Desktop
$localhostLeft = (Get-ChildItem -Recurse -File -Include *.html,*.htm,*.xml,*.js,*.css | Select-String -SimpleMatch 'localhost:' | Measure-Object).Count
$srcsetLeft = (Get-ChildItem -Recurse -File -Include *.html,*.htm | Select-String -Pattern 'srcset=|imagesrcset=|sizes=' | Measure-Object).Count
Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host ("  Files changed: {0}" -f ($changed | Select-Object -Unique | Measure-Object).Count)
Write-Host ("  localhost refs left: {0}" -f $localhostLeft)
Write-Host ("  srcset/sizes left: {0}" -f $srcsetLeft)
Write-Host "Open GitHub Desktop → the edited HTML files should now appear under Changes."

# === FIX for malformed regex in main202b.js (Blocksy bundle) ===
try {
    $jsPath = "C:\Users\moham\Desktop\GOC-Export\GOC\localhost_10004\wp-content\themes\blocksy\static\bundle\main202b.js"
    if (Test-Path $jsPath) {
        $content = Get-Content -LiteralPath $jsPath -Raw
        # Replace `/^https?:\/\/.test`  ->  `/^https?:\/\/\/.test`
        $new = $content -replace '/\^https\?\:\/\/\.test','/^https?:\/\/\/.test'
        if ($new -ne $content) {
            Set-Content -LiteralPath $jsPath -Value $new -Encoding UTF8
            Write-Host "Fixed regex in main202b.js"
        } else {
            Write-Host "main202b.js already OK (no change)."
        }
    } else {
        Write-Host "main202b.js not found (skipped)."
    }
} catch {
    Write-Host "Error while fixing main202b.js: $($_.Exception.Message)"
}


# === FIX for malformed regex in main202b.js (Blocksy bundle) — LITERAL REPLACE (no regex) ===
try {
    $jsPath = "C:\Users\moham\Desktop\GOC-Export\GOC\localhost_10004\wp-content\themes\blocksy\static\bundle\main202b.js"
    if (Test-Path -LiteralPath $jsPath) {
        $content = Get-Content -LiteralPath $jsPath -Raw
        $orig1 = '/^https?:\/\/.test('
        $good1 = '/^https?:\/\/\/.test('
        $orig2 = '/^https?:\/\/.testn'
        $good2 = '/^https?:\/\/\/.testn'
        $orig3 = '/^https?:\/\/.test'
        $good3 = '/^https?:\/\/\/.test'
        $changed = $false

        if ($content.Contains($orig1)) { $content = $content.Replace($orig1, $good1); $changed = $true }
        if ($content.Contains($orig2)) { $content = $content.Replace($orig2, $good2); $changed = $true }
        if (-not $changed -and $content.Contains($orig3)) { $content = $content.Replace($orig3, $good3); $changed = $true }

        if ($changed) {
            Set-Content -LiteralPath $jsPath -Value $content -Encoding UTF8
            Write-Host "Fixed regex in main202b.js (literal replace)"
        } else {
            Write-Host "main202b.js already OK or pattern not found (skipped)."
        }
    } else {
        Write-Host "main202b.js not found (skipped)."
    }
} catch {
    Write-Host "Error while fixing main202b.js: $($_.Exception.Message)"
}

