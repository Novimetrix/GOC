# fix-html.ps1 — backup and scrub HTML, prevents nested backups, skips backup folder
$ErrorActionPreference = 'Stop'
$cwd    = Get-Location
$backup = Join-Path $cwd "backup_html_before_scrub"

# Fresh backup (remove old one to avoid nesting)
if (Test-Path $backup) { Remove-Item -Recurse -Force $backup }
New-Item -ItemType Directory -Path $backup | Out-Null

Write-Host "Backing up HTML files..."
Get-ChildItem -Recurse -Filter *.html | Where-Object { $_.FullName -notlike "*\backup_html_before_scrub\*" } | ForEach-Object {
    $src     = $_.FullName
    $rel     = $src.Substring($cwd.Path.Length).TrimStart("\")
    $dest    = Join-Path $backup $rel
    $dirdest = Split-Path $dest -Parent
    if (-not (Test-Path $dirdest)) { New-Item -ItemType Directory -Path $dirdest -Force | Out-Null }
    Copy-Item -Path $src -Destination $dest -Force
}
Write-Host "Backup complete. Now processing HTML files..."

# Process HTML (skip backup dir)
Get-ChildItem -Recurse -Filter *.html | Where-Object { $_.FullName -notlike "*\backup_html_before_scrub\*" } | ForEach-Object {
    $path = $_.FullName
    $text = Get-Content -Raw -Encoding UTF8 $path

    # Replace absolute localhost/127.0.0.1 with root-relative path
    $text = $text -replace 'https?://localhost(:\d+)?(/[^"\s>]*)?', '$2'
    $text = $text -replace 'https?://127\.0\.0\.1(:\d+)?(/[^"\s>]*)?', '$2'

    # Remove srcset, sizes, imagesrcset, data-srcset, data-src
    $pattern = '\s(?:srcset|sizes|imagesrcset|data-srcset|data-src)=(?:"[^"]*"|''[^'']*'')'
    $text = [regex]::Replace($text, $pattern, "")

    Set-Content -Path $path -Value $text -Encoding UTF8
    Write-Host ("Processed: {0}" -f $path)
}
