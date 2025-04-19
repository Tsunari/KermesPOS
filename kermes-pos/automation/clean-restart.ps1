# Stop any running npm processes
Write-Host "Stopping running npm processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -ErrorAction SilentlyContinue
Stop-Process -Name "npm" -ErrorAction SilentlyContinue

# Navigate to the project directory
Set-Location (Split-Path $PSScriptRoot -Parent)
Write-Host "Changed directory to: $((Get-Location).Path)" -ForegroundColor Green

# Clean npm cache and remove directories
Write-Host "Cleaning project..." -ForegroundColor Yellow
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
npm cache clean --force

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Start the development server
Write-Host "Starting development server..." -ForegroundColor Green
npm start 