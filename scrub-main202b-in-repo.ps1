param(
  [string]$Root = "C:\NovimetrixRepo\GOC"
)

Write-Host "=== Scrub 'main202b.js' and references (REPO) ==="
Write-Host "Root: $Root"
if (-not (Test-Path -LiteralPath $Root)) {
  Write-Host "Root path not found. Exiting." -ForegroundColor Red
  exit 1
}

# 1) Delete any files named main202b.js anywhere under the repo
$deleted = 0
Get-ChildItem -LiteralPath $Root -Recurse -ErrorAction SilentlyContinue -File -Filter "main202b.js" |
  ForEach-Object {
    try {
      Remove-Item -LiteralPath $_.FullName -Force -ErrorAction SilentlyContinue
      $deleted++
      Write-Host "Deleted: $($_.FullName)"
    } catch {}
  }
Write-Host "Files deleted: $deleted"

# 2) Remove <script> tags that reference main202b.js (with or without ?ver=...)
#    Handles paths like 'themes/blocksy/static/bundle/main202b.js?ver=2.1.15' or 'wp-content/...'
$scriptPattern = '(?is)<script[^>]+src=["''](?:(?!["'']).)*main202b\.js(?:\?[^"'']*)?["''][^>]*>\s*</script>'

$modifiedCount = 0
Get-ChildItem -LiteralPath $Root -Recurse -Include *.html -File -ErrorAction SilentlyContinue |
  ForEach-Object {
    $p = $_.FullName
    $html = Get-Content -LiteralPath $p -Raw
    $fixed = [regex]::Replace($html, $scriptPattern, '')
    if ($fixed -ne $html) {
      Set-Content -LiteralPath $p -Value $fixed -Encoding UTF8
      $modifiedCount++
      Write-Host "Stripped reference in: $p"
    }
  }
Write-Host "HTML files modified: $modifiedCount"

# 3) Final verification across repo: list any remaining references
$remainingRefs = Select-String -Path (Join-Path $Root '**\*.html') -Pattern 'main202b\.js' -AllMatches -ErrorAction SilentlyContinue
if ($remainingRefs) {
  Write-Host ("WARNING: Remaining references found: {0}" -f ($remainingRefs.Count)) -ForegroundColor Yellow
  $remainingRefs | ForEach-Object { Write-Host (" - {0}:{1}" -f $_.Path, $_.LineNumber) }
} else {
  Write-Host "No remaining 'main202b.js' references detected in HTML."
}

Write-Host "=== Done ==="
