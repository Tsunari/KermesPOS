#region Helper Functions
function Write-Section {
    param([string]$Title, [int]$Step, [int]$Total)
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ("Step $($Step) of $($Total): $Title") -ForegroundColor Yellow
    Write-Host "================================" -ForegroundColor Cyan
}

function Write-ErrorAndExit {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    exit 1
}
#endregion

$ErrorActionPreference = 'Stop'
$startTime = Get-Date
$totalSteps = 9

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

    # Step 3: Update title in build index.html
    Write-Section "Update title in build index.html" 3 $totalSteps
    $indexPath = "./kermes-pos/build/index.html"
    if (Test-Path $indexPath) {
        (Get-Content $indexPath) -replace '<title>.*?</title>', '<title>Kermes POS</title>' | Set-Content $indexPath -Encoding UTF8
        Write-Host "Updated <title> in build/index.html to 'Kermes POS'" -ForegroundColor Green
    } else {
        Write-ErrorAndExit "build/index.html not found!"
    }

    # Step 4: Copy build folder to electron
    Write-Section "Copy build folder to kermes-electron" 4 $totalSteps
    Remove-Item -Recurse -Force ./kermes-electron/build -ErrorAction SilentlyContinue
    Copy-Item -Recurse -Force ./kermes-pos/build ./kermes-electron/build
    Write-Host "Copied build folder successfully." -ForegroundColor Green

    # Step 5: Clean dist folder before electron build
    Write-Section "Clean dist folder" 5 $totalSteps
    $distPath = "./kermes-electron/dist"
    if (Test-Path $distPath) {
        Remove-Item -Recurse -Force $distPath
        Write-Host "Deleted old dist folder." -ForegroundColor Green
    } else {
        Write-Host "No dist folder to delete." -ForegroundColor Gray
    }

    # Step 6: Build kermes-electron
    Write-Section "Build kermes-electron" 6 $totalSteps
    cd ./kermes-electron
    npm run build
    if ($LASTEXITCODE -ne 0) { Write-ErrorAndExit "kermes-electron build failed." }
    cd ..

    # Step 7: Prepare release files
    Write-Section "Prepare release files" 7 $totalSteps # Ömer war hier, ömer ist ein bisschen freaky
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

    # Step 8: Generate changelog section from commit messages
    Write-Section "Generate changelog from commits" 8 $totalSteps
    $lastTag = git describe --tags --abbrev=0 HEAD^
    $changelogPath = "./CHANGELOG.md"
    $commitBodies = git log "$lastTag..HEAD" --pretty=format:"%B" | Out-String
    $commitLines = $commitBodies -split "`r?`n" | Where-Object { $_.Trim() -ne "" }
    $newDate = Get-Date -Format "dd-MM-yyyy"
    $changelogSection = "## [$newVersion] - $newDate`n"
    $dirMap = @{
        "electron" = "Kermes Electron"
        "pos" = "Kermes POS"
        "web" = "Kermes Web"
    }
    $typeMap = @{
        "feat" = "Added"
        "bug" = "Fixed"
        "change" = "Changed"
        "chore" = "Changed"
    }
    $grouped = @{}
    $globalNotes = @()
    foreach ($line in $commitLines) {
        if ($line -match "--global") {
            $desc = $line -replace "--global", "" -replace "^\s*-*\s*", "" -replace "\s+$", ""
            if ($desc) { $globalNotes += "- $desc" }
        } else {
            $typeTags = [regex]::Matches($line, "--(feat|bug|change|chore)") | ForEach-Object { $_.Groups[1].Value }
            $dirTags = [regex]::Matches($line, "--(electron|pos|web)") | ForEach-Object { $_.Groups[1].Value }
            if ($typeTags.Count -gt 0 -and $dirTags.Count -gt 0) {
                $desc = $line -replace "--(feat|bug|change|chore)", "" -replace "--(electron|pos|web)", "" -replace "^\s*-*\s*", "" -replace "\s+$", ""
                if ($desc) {
                    foreach ($type in $typeTags) {
                        foreach ($dir in $dirTags) {
                            $dirKey = $dirMap[$dir]
                            $typeKey = $typeMap[$type]
                            if (-not $grouped.ContainsKey($dirKey)) { $grouped[$dirKey] = @{} }
                            if (-not $grouped[$dirKey].ContainsKey($typeKey)) { $grouped[$dirKey][$typeKey] = @() }
                            $grouped[$dirKey][$typeKey] += "- $desc"
                        }
                    }
                }
            }
        }
    }
    if ($globalNotes.Count -gt 0) {
        $changelogSection += "### Global`n"
        $changelogSection += ($globalNotes -join "`n") + "`n`n"
    }
    foreach ($dir in $dirMap.Values) {
        if ($grouped.ContainsKey($dir)) {
            $changelogSection += "### $dir`n"
            foreach ($type in @("Added", "Changed", "Fixed")) {
                if ($grouped[$dir].ContainsKey($type) -and $grouped[$dir][$type].Count -gt 0) {
                    $changelogSection += "#### $type`n"
                    $changelogSection += ($grouped[$dir][$type] -join "`n") + "`n"
                }
            }
            # $changelogSection += "`n"
        }
    }
    # Insert changelog section after the 7th line (index 6), with one blank line before and after
    $changelogLines = Get-Content $changelogPath
    $newSection = @($changelogSection)
    $before = $changelogLines[0..6]
    $after = $changelogLines[7..($changelogLines.Count-1)]
    $finalChangelog = $before + $newSection + $after
    Set-Content $changelogPath -Value $finalChangelog -Encoding UTF8
    $releaseNotes = $changelogSection

    # Step 9: Create GitHub release and upload assets
    Write-Section "Create GitHub Release" 9 $totalSteps
    $tag = "v$newVersion"
    $releaseTitle = "Kermes POS $newVersion"
    Write-Host "Creating GitHub release $tag..." -ForegroundColor Cyan
    gh release create $tag `
        "$($exeFile.FullName)" `
        "$($ymlFile.FullName)" `
        --title "$releaseTitle" `
        --notes "$releaseNotes"
    if ($LASTEXITCODE -ne 0) { Write-ErrorAndExit "GitHub release failed." }
    Write-Host "Release created and assets uploaded." -ForegroundColor Green

    $endTime = Get-Date
    $duration = $endTime - $startTime
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ("All done! Total time: {0:mm\:ss} (mm:ss)" -f $duration) -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Cyan
}
catch {
    Write-Host "[FATAL ERROR] $_" -ForegroundColor Red
    exit 1
}
