# scan-missing-images.ps1 — report missing images, skips backup folder
$root   = Get-Location
$csv    = Join-Path $root "missing_images_report.csv"
$items  = @()

$attrPattern = '(?:src|data-src|srcset|data-srcset|imagesrcset)\s*=\s*["'']([^"'']+)["'']'

Get-ChildItem -Recurse -Filter *.html | Where-Object { $_.FullName -notlike "*\backup_html_before_scrub\*" } | ForEach-Object {
    $htmlPath = $_.FullName
    $text = Get-Content -Raw -Encoding UTF8 $htmlPath

    $matches = [regex]::Matches($text, $attrPattern, 'IgnoreCase')
    foreach ($m in $matches) {
        $raw = $m.Groups[1].Value.Trim()
        $candidates = @($raw -split '\s*,\s*')
        foreach ($cand in $candidates) {
            $url = ($cand -split '\s+')[0]
            if ($url -match '^data:') { continue }
            $u2 = $url -replace '^https?:\/\/[^\/]+',''
            $u2 = $u2 -replace '^\/\/','/'
            if (-not ($u2 -match '^\/')) { $u2 = '/' + $u2 }
            $localPath = Join-Path $root ($u2.TrimStart('/').Replace('/','\'))
            if (-not (Test-Path $localPath)) {
                $items += [pscustomobject]@{
                    html        = $htmlPath
                    referenced  = $url
                    local_check = $localPath
                    exists      = $false
                }
            }
        }
    }
}

if ($items.Count -gt 0) {
    $items | Export-Csv -NoTypeInformation -Path $csv -Encoding UTF8
    Write-Host "Missing images found: $($items.Count). CSV -> $csv" -ForegroundColor Yellow
} else {
    [pscustomobject]@{html='';referenced='';local_check='';exists=$true} | Select-Object html,referenced,local_check,exists |
        Export-Csv -NoTypeInformation -Path $csv -Encoding UTF8
    Write-Host "No missing local image files detected." -ForegroundColor Green
}
