param(
  [Parameter(Mandatory = $true)]
  [string]$AppRoot,

  [Parameter(Mandatory = $true)]
  [string]$CurrentVersion,

  [Parameter(Mandatory = $true)]
  [string]$ManifestUrl
)

$ErrorActionPreference = 'Stop'

function Write-UpdaterStatus {
  param([string]$Message)
  Write-Host "[Aaron Clicker updater] $Message"
}

function Get-PackageRoot {
  param([string]$ExtractRoot)

  $candidates = @((Get-Item -LiteralPath $ExtractRoot)) + @(Get-ChildItem -LiteralPath $ExtractRoot -Directory)
  foreach ($candidate in $candidates) {
    $launchPath = Join-Path $candidate.FullName 'launch.bat'
    $indexPath = Join-Path $candidate.FullName 'Game files\index.html'
    if ((Test-Path -LiteralPath $launchPath) -and (Test-Path -LiteralPath $indexPath)) {
      return $candidate.FullName
    }
  }

  throw 'The downloaded ZIP does not look like an Aaron Clicker release.'
}

function Test-NewerVersion {
  param(
    [string]$Latest,
    [string]$Current
  )

  try {
    return ([version]$Latest) -gt ([version]$Current)
  } catch {
    return $Latest -ne $Current
  }
}

function ConvertTo-UpdateManifest {
  param($Manifest)

  if ($Manifest.content) {
    $json = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String(($Manifest.content -replace '\s', '')))
    return $json | ConvertFrom-Json
  }

  return $Manifest
}

if ([string]::IsNullOrWhiteSpace($ManifestUrl)) {
  exit 0
}

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('AaronClickerUpdate_' + [guid]::NewGuid().ToString('N'))
$zipPath = Join-Path $tempRoot 'update.zip'
$extractRoot = Join-Path $tempRoot 'extract'

try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  New-Item -ItemType Directory -Path $tempRoot, $extractRoot -Force | Out-Null

  Write-UpdaterStatus 'checking for updates...'
  $manifest = ConvertTo-UpdateManifest (Invoke-RestMethod -Uri $ManifestUrl -UseBasicParsing)

  if (-not $manifest.version -or -not $manifest.zipUrl) {
    throw 'Update manifest must contain version and zipUrl.'
  }

  if (-not (Test-NewerVersion -Latest ([string]$manifest.version) -Current $CurrentVersion)) {
    Write-UpdaterStatus 'already up to date.'
    exit 0
  }

  Write-UpdaterStatus "downloading version $($manifest.version)..."
  Invoke-WebRequest -Uri ([string]$manifest.zipUrl) -OutFile $zipPath -UseBasicParsing

  Expand-Archive -LiteralPath $zipPath -DestinationPath $extractRoot -Force
  $packageRoot = Get-PackageRoot -ExtractRoot $extractRoot

  Write-UpdaterStatus 'installing update...'
  Get-ChildItem -LiteralPath $packageRoot -Force | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $AppRoot -Recurse -Force
  }

  Write-UpdaterStatus "updated to version $($manifest.version)."
  exit 0
} catch {
  Write-UpdaterStatus "update skipped: $($_.Exception.Message)"
  exit 0
} finally {
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}
