# deploy.ps1
# PowerShell script to deploy kermes-web to Firebase

param(
    [switch]$nobuild
)

# Ensure firebase-tools is installed
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Host "firebase-tools not found. Installing globally via npm..."
    npm install -g firebase-tools
}

# Set working directory to the project root (adjust if needed)
$projectDir = "$PSScriptRoot\kermes-pos"
if (-not (Test-Path $projectDir)) {
    Write-Error "Project directory '$projectDir' not found."
    exit 1
}
Set-Location $projectDir

# Build the project (adjust command if using a different build tool)
if (-not $nobuild) {
    if (Test-Path "package.json") {
        Write-Host "Installing dependencies..."
        npm install

        Write-Host "Building the project..."
        npm run build
    }
} else {
    Write-Host "Skipping build step due to --nobuild flag."
}

# Deploy to Firebase
Write-Host "Deploying to Firebase..."
firebase deploy --only hosting

Write-Host "Deployment complete."

Set-Location $PSScriptRoot