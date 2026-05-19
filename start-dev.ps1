param()

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$pos = Join-Path $root 'kermes-pos'
$electron = Join-Path $root 'kermes-electron'

# Prefer pwsh if available, otherwise fall back to Windows PowerShell
$pwshCmd = (Get-Command pwsh -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source) -or (Get-Command powershell -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source)
if (-not $pwshCmd) {
    Write-Error "No PowerShell executable found in PATH."
    exit 1
}

Write-Output "Starting kermes-pos in new terminal..."
Start-Process -FilePath $pwshCmd -ArgumentList '-NoExit', "-Command", "cd '$pos'; npm run start"

Start-Sleep -Milliseconds 300

Write-Output "Starting kermes-electron in new terminal..."
Start-Process -FilePath $pwshCmd -ArgumentList '-NoExit', "-Command", "cd '$electron'; npm run start"

Write-Output "Launched both dev servers."
