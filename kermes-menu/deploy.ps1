#!/usr/bin/env pwsh

# This script builds the Next.js application and deploys it to Firebase Hosting for kermes-menu
# Ensure 'npx next dev' is not running and stop it if it is
$nextDevProcesses = Get-Process | Where-Object { $_.ProcessName -like "node" -and $_.Path -and (Get-Content $_.Path -Raw) -match "next.*dev" } 2>$null
if (-not $nextDevProcesses) {
    $nextDevProcesses = Get-Process | Where-Object { $_.ProcessName -like "node" -and $_.MainWindowTitle -match "next dev" } 2>$null
}
if (-not $nextDevProcesses) {
    $nextDevProcesses = Get-Process | Where-Object { $_.ProcessName -like "node" -and $_.CommandLine -match "next.*dev" } 2>$null
}
if ($nextDevProcesses) {
    $nextDevProcesses | ForEach-Object { Stop-Process -Id $_.Id -Force }
    Write-Host "'npx next dev' process(es) stopped."
} else {
    Write-Host "No 'npx next dev' process running."
}

# Build the Next.js application
npx next build

# Deploy to Firebase Hosting
firebase deploy --only hosting
