#region Helper Functions
function Write-Section {
    param([string]$Title, [int]$Step, [int]$Total)
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host ("Step $($Step) of $($Total): $Title") -ForegroundColor Yellow
    Write-Host "=================================" -ForegroundColor Cyan
}

function Write-ErrorAndExit {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    exit 1
}
#endregion

$ErrorActionPreference = 'Stop'
$startTime = Get-Date
$totalSteps = 6

try {
    # Step 1: Version Increment
    Write-Section "Version Increment" 1 $totalSteps
    $packageJsonPath = "./kermes-electron/package.json"
    $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
    $currentVersion = $packageJson.version
    Write-Host "Current version: $currentVersion" -ForegroundColor Green
    Write-Host "Which version do you want to increment?" -ForegroundColor Magenta
    Write-Host "1. Major"
    Write-Host "2. Minor"
    Write-Host "3. Patch"
    $choice = Read-Host "Enter 1, 2, or 3"
    $versionParts = $currentVersion -split '\.'
    $major = [int]$versionParts[0]
    $minor = [int]$versionParts[1]
    $patch = [int]$versionParts[2]
    switch ($choice) {
        '1' { $major++; $minor=0; $patch=0 }
        '2' { $minor++; $patch=0 }
        '3' { $patch++ }
        default { Write-ErrorAndExit "Invalid choice. Exiting." }
    }
    $newVersion = "$major.$minor.$patch"
    $packageJson.version = $newVersion
    $packageJson | ConvertTo-Json -Depth 100 | Set-Content $packageJsonPath -Encoding UTF8
    Write-Host "Updated version to $newVersion in $packageJsonPath" -ForegroundColor Green

    # Step 2: Build kermes-pos
    Write-Section "Build kermes-pos" 2 $totalSteps
    cd ./kermes-pos
    npm run build
    if ($LASTEXITCODE -ne 0) { Write-ErrorAndExit "kermes-pos build failed." }
    cd ..

    # Step 3: Copy build folder to electron
    Write-Section "Copy build folder to kermes-electron" 3 $totalSteps
    Remove-Item -Recurse -Force ./kermes-electron/build -ErrorAction SilentlyContinue
    Copy-Item -Recurse -Force ./kermes-pos/build ./kermes-electron/build
    Write-Host "Copied build folder successfully." -ForegroundColor Green

    # Step 3.5: Clean dist folder before electron build
    Write-Section "Clean dist folder" 3.5 $totalSteps
    $distPath = "./kermes-electron/dist"
    if (Test-Path $distPath) {
        Remove-Item -Recurse -Force $distPath
        Write-Host "Deleted old dist folder." -ForegroundColor Green
    } else {
        Write-Host "No dist folder to delete." -ForegroundColor Gray
    }

    # Step 4: Build kermes-electron
    Write-Section "Build kermes-electron" 4 $totalSteps
    cd ./kermes-electron
    npm run build
    if ($LASTEXITCODE -ne 0) { Write-ErrorAndExit "kermes-electron build failed." }
    cd ..

    # Step 5: Prepare release files
    Write-Section "Prepare release files" 5 $totalSteps
    $distPath = "./kermes-electron/dist"
    $exeFile = Get-ChildItem $distPath -Filter *.exe | Select-Object -First 1
    $ymlFile = Get-ChildItem $distPath -Filter latest.yml | Select-Object -First 1
    if ($null -eq $exeFile -or $null -eq $ymlFile) {
        Write-ErrorAndExit "Missing .exe or latest.yml in dist folder!"
    }
    $ymlContent = Get-Content $ymlFile.FullName -Raw
    $exeNameInYml = ($ymlContent | Select-String -Pattern 'url: (.+\.exe)' | ForEach-Object { $_.Matches[0].Groups[1].Value })
    if ($exeFile.Name -ne $exeNameInYml) {
        Write-Host "Renaming $($exeFile.Name) to $exeNameInYml for update compatibility..." -ForegroundColor Yellow
        $targetPath = Join-Path $distPath $exeNameInYml
        if (Test-Path $targetPath) {
            Write-ErrorAndExit "Cannot rename: $exeNameInYml already exists in dist folder!"
        }
        Rename-Item $exeFile.FullName -NewName $exeNameInYml -Force
        $exeFile = Get-ChildItem $distPath -Filter $exeNameInYml | Select-Object -First 1
    }
    Write-Host "Release files ready: $($exeFile.Name), $($ymlFile.Name)" -ForegroundColor Green

    # Step 6: Create GitHub release and upload assets
    Write-Section "Create GitHub Release" 6 $totalSteps
    $tag = "v$newVersion"
    $releaseTitle = "Kermes POS $newVersion"
    Write-Host "Creating GitHub release $tag..." -ForegroundColor Cyan
    gh release create $tag `
        "$($exeFile.FullName)" `
        "$($ymlFile.FullName)" `
        --title "$releaseTitle" `
        --notes "Automated release for version $newVersion"
    if ($LASTEXITCODE -ne 0) { Write-ErrorAndExit "GitHub release failed." }
    Write-Host "Release created and assets uploaded." -ForegroundColor Green

    $endTime = Get-Date
    $duration = $endTime - $startTime
    Write-Host "\n===============================" -ForegroundColor Cyan
    Write-Host ("All done! Total time: {0:mm\:ss} (mm:ss)" -f $duration) -ForegroundColor Green
    Write-Host "===============================\n" -ForegroundColor Cyan
}
catch {
    Write-Host "[FATAL ERROR] $_" -ForegroundColor Red
    exit 1
}
