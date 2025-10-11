# scan-missing-images.ps1 — report missing images only (skip backup), normalize URLs
$root   = Get-Location
$csv    = Join-Path $root "missing_images_report.csv"
$items  = @()

# Image extensions to consider
$imgExt = 'jpg','jpeg','png','gif','webp','svg','avif'

# regex to capture URLs from src / srcset-like attributes
$attrPattern = '(?:src|data-src|srcset|data-srcset|imagesrcset)\s*=\s*["'']([^"'']+)["'']'

function IsImageUrl($u) {
  $clean = ($u -replace '[?#].*$','')
  $ext = [System.IO.Path]::GetExtension($clean).TrimStart('.').ToLowerInvariant()
  return $imgExt -contains $ext
}

$origin = 'https://greenoceanconsultants.com'

Get-ChildItem -Recurse -Filter *.html | Where-Object { $_.FullName -notlike "*\backup_html_before_scrub\*" } | ForEach-Object {
    $htmlPath = $_.FullName
    $text = Get-Content -Raw -Encoding UTF8 $htmlPath

    $matches = [regex]::Matches($text, $attrPattern, 'IgnoreCase')
    foreach ($m in $matches) {
        $raw = $m.Groups[1].Value.Trim()
        # split srcset lists
        $candidates = @($raw -split '\s*,\s*')
        foreach ($cand in $candidates) {
            $url = ($cand -split '\s+')[0]
            if (-not (IsImageUrl $url)) { continue }
            if ($url -match '^data:') { continue }

            # Build absolute URL against origin and normalize path
            try {
              $abs = if ($url -match '^https?://') { [Uri]$url } else {
                if ($url.StartsWith('//')) { [Uri]("https:" + $url) } else { [Uri]([Uri]$origin, $url) }
              }
            } catch { continue }

            # Only consider our domain
            if ($abs.Host -ne ([Uri]$origin).Host) { continue }

            $localRel = $abs.AbsolutePath.TrimStart('/').Replace('/','\')
            $localPath = Join-Path $root $localRel

            if (-not (Test-Path $localPath)) {
                $items += [pscustomobject]@{
                    html        = $htmlPath
                    referenced  = $abs.AbsoluteUri
                    local_check = $localPath
                    exists      = $false
                }
            }
        }
    }
}

$items | Sort-Object html, referenced | Export-Csv -NoTypeInformation -Path $csv -Encoding UTF8
Write-Host ("Missing images listed in {0}: {1}" -f $csv, $items.Count)
