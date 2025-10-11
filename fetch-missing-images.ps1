# fetch-missing-images.ps1 — downloads missing images from live site, general-purpose
$root = Get-Location
$csv  = Join-Path $root "missing_images_report.csv"
if (-not (Test-Path $csv)) { Write-Host "missing_images_report.csv not found. Run scan-missing-images.ps1 first."; exit 1 }

$rows = Import-Csv $csv | Where-Object { $_.exists -eq 'False' }
$ua = "GOC-Autofetch/1.1 (+https://greenoceanconsultants.com)"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$done = 0; $fail = 0

foreach ($r in $rows) {
  $dst = $r.local_check
  $url = $r.referenced
  if (-not $dst -or -not $url) { continue }
  if (Test-Path $dst) { continue }

  # Ensure destination folder
  $dir = Split-Path $dst -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

  try {
    $wc = New-Object System.Net.WebClient
    $wc.Headers.Add("User-Agent", $ua)
    $wc.DownloadFile($url, $dst)
    Write-Host ("Fetched -> {0}" -f $dst)
    $done++
  } catch {
    Write-Host ("FAILED -> {0}  (from {1})" -f $dst, $url) -ForegroundColor Yellow
    $fail++
  }
}

Write-Host ("Fetch complete. Success: {0}  Failed: {1}" -f $done, $fail) -ForegroundColor Green
