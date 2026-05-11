param(
  [Parameter(Mandatory = $true)]
  [string]$AppRoot,

  [Parameter(Mandatory = $true)]
  [string]$CurrentVersion,

  [Parameter(Mandatory = $true)]
  [string]$ManifestUrl,

  [int]$Port = 18172,

  [switch]$Serve
)

$ErrorActionPreference = 'Stop'

function Start-DetachedServer {
  function Quote-Arg {
    param([string]$Value)
    '"' + ($Value -replace '"', '\"') + '"'
  }

  $scriptPath = $PSCommandPath
  $args = @(
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    (Quote-Arg $scriptPath),
    '-AppRoot',
    (Quote-Arg $AppRoot),
    '-CurrentVersion',
    (Quote-Arg $CurrentVersion),
    '-ManifestUrl',
    (Quote-Arg $ManifestUrl),
    '-Port',
    [string]$Port,
    '-Serve'
  ) -join ' '

  Start-Process -FilePath 'powershell.exe' -ArgumentList $args -WindowStyle Hidden | Out-Null
}

function Send-HttpResponse {
  param(
    [System.Net.Sockets.TcpClient]$Client,
    [int]$StatusCode,
    [string]$StatusText,
    [string]$Body
  )

  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
  $headers = @(
    "HTTP/1.1 $StatusCode $StatusText",
    'Content-Type: application/json; charset=utf-8',
    'Access-Control-Allow-Origin: *',
    'Access-Control-Allow-Methods: GET, POST, OPTIONS',
    'Access-Control-Allow-Headers: Content-Type',
    "Content-Length: $($bytes.Length)",
    'Connection: close',
    '',
    ''
  ) -join "`r`n"

  $stream = $Client.GetStream()
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  $stream.Write($bytes, 0, $bytes.Length)
  $stream.Flush()
}

function Invoke-UpdateAndRelaunch {
  $updaterPath = Join-Path $AppRoot 'updater.ps1'
  $launchPath = Join-Path $AppRoot 'launch.bat'

  Start-Sleep -Milliseconds 700

  if (Test-Path -LiteralPath $updaterPath) {
    & powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $updaterPath -AppRoot $AppRoot -CurrentVersion $CurrentVersion -ManifestUrl $ManifestUrl *> $null
  }

  if (Test-Path -LiteralPath $launchPath) {
    Start-Process -FilePath $launchPath -WorkingDirectory $AppRoot -WindowStyle Hidden | Out-Null
  }
}

function Get-ManifestJson {
  try {
    $manifest = Invoke-RestMethod -Uri ($ManifestUrl + '?t=' + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) -UseBasicParsing
    return (@{
      version = [string]$manifest.version
      zipUrl = [string]$manifest.zipUrl
    } | ConvertTo-Json -Compress)
  } catch {
    return '{"ok":false}'
  }
}

if (-not $Serve) {
  Start-DetachedServer
  exit 0
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse('127.0.0.1'), $Port)

try {
  $listener.Start()
} catch {
  exit 0
}

$deadline = (Get-Date).AddHours(8)
try {
  while ((Get-Date) -lt $deadline) {
    if (-not $listener.Pending()) {
      Start-Sleep -Milliseconds 200
      continue
    }

    $client = $listener.AcceptTcpClient()
    try {
      $client.ReceiveTimeout = 1500
      $reader = [System.IO.StreamReader]::new($client.GetStream(), [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      while ($true) {
        $line = $reader.ReadLine()
        if ($null -eq $line -or $line -eq '') { break }
      }

      if (-not $requestLine) {
        Send-HttpResponse -Client $client -StatusCode 400 -StatusText 'Bad Request' -Body '{"ok":false}'
        continue
      }

      $parts = $requestLine.Split(' ')
      $method = $parts[0]
      $path = $parts[1]

      if ($method -eq 'OPTIONS') {
        Send-HttpResponse -Client $client -StatusCode 204 -StatusText 'No Content' -Body ''
      } elseif ($method -eq 'GET' -and $path -like '/status*') {
        Send-HttpResponse -Client $client -StatusCode 200 -StatusText 'OK' -Body '{"ok":true}'
      } elseif ($method -eq 'GET' -and $path -like '/manifest*') {
        Send-HttpResponse -Client $client -StatusCode 200 -StatusText 'OK' -Body (Get-ManifestJson)
      } elseif ($method -eq 'POST' -and $path -like '/update*') {
        Send-HttpResponse -Client $client -StatusCode 202 -StatusText 'Accepted' -Body '{"ok":true,"updating":true}'
        $client.Close()
        Invoke-UpdateAndRelaunch
        break
      } else {
        Send-HttpResponse -Client $client -StatusCode 404 -StatusText 'Not Found' -Body '{"ok":false}'
      }
    } catch {
      try {
        Send-HttpResponse -Client $client -StatusCode 500 -StatusText 'Server Error' -Body '{"ok":false}'
      } catch {}
    } finally {
      if ($client) { $client.Close() }
    }
  }
} finally {
  $listener.Stop()
}
