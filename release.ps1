param(
    [switch]$force
)

#region Helper Functions
function Write-Section {
    param([string]$Title, [int]$Step, [int]$Total)
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ("Step $($Step) of $($Total): $Title") -ForegroundColor Yellow
    Write-Host "================================" -ForegroundColor Cyan
}

function Write-ErrorAndExit {
    param(
        [string]$Message,
        [scriptblock]$BeforeExit = $null
    )
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    if ($BeforeExit) { & $BeforeExit }
    exit 1
}
#endregion Helper Functions

#region Globals
$ErrorActionPreference = 'Stop'
$startTime = Get-Date
$totalSteps = 10
#endregion Globals

#region Pre-checks
# Check for uncommitted changes before starting (unless --force is set)
if (-not $force) {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-ErrorAndExit "There are uncommitted changes in the repository. Please commit or stash them before running the release script." { Write-Host $gitStatus }
    }
}
#endregion Pre-checks

try {
    #region Step 1: Version Increment
    Write-Section "Version Increment" 1 $totalSteps
    $packageJsonPath = "./kermes-electron/package.json"
    $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
    $currentVersion = $packageJson.version
    Write-Host "Current version: $currentVersion" -ForegroundColor Green
    Write-Host "Which version do you want to increment?" -ForegroundColor Magenta
    Write-Host "1. Major"
    Write-Host "2. Minor"
    Write-Host "3. Patch"
    $choice = Read-Host "Enter 1, 2, or 3 (or q to quit)"
    $versionParts = $currentVersion -split '\.'
    $major = [int]$versionParts[0]
    $minor = [int]$versionParts[1]
    $patch = [int]$versionParts[2]
    switch ($choice) {
        '1' { $major++; $minor=0; $patch=0 }
        '2' { $minor++; $patch=0 }
        '3' { $patch++ }
        'q' { exit 0 }
        default { Write-ErrorAndExit "Invalid choice. Exiting." }
    }
    $newVersion = "$major.$minor.$patch"
    $packageJson.version = $newVersion
    $packageJson | ConvertTo-Json -Depth 100 | Set-Content $packageJsonPath -Encoding UTF8
    Write-Host "Updated version to $newVersion in $packageJsonPath" -ForegroundColor Green
    # Also update kermes-pos/package.json version
    $posPackageJsonPath = "./kermes-pos/package.json"
    if (Test-Path $posPackageJsonPath) {
        $posPackageJson = Get-Content $posPackageJsonPath | ConvertFrom-Json
        $posPackageJson.version = $newVersion
        $posPackageJson | ConvertTo-Json -Depth 100 | Set-Content $posPackageJsonPath -Encoding UTF8
        Write-Host "Updated version to $newVersion in $posPackageJsonPath" -ForegroundColor Green
    } else {
        Write-Host "kermes-pos/package.json not found, skipping version update for kermes-pos." -ForegroundColor Yellow
    }
    $deployToHosting = $false
    $deployChoice = Read-Host "Do you want to deploy to hosting after release? (y/n)"
    if ($deployChoice -eq 'y' -or $deployChoice -eq 'Y') {
        $deployToHosting = $true
    }
    #endregion Version Increment

    #region Step 2: Build kermes-pos
    Write-Section "Build kermes-pos" 2 $totalSteps
    cd ./kermes-pos
    npm run build
    if ($LASTEXITCODE -ne 0) { Write-ErrorAndExit "kermes-pos build failed." }
    cd ..
    #endregion Step 2

    #region Step 3: Update title in build index.html
    Write-Section "Update title in build index.html" 3 $totalSteps
    $indexPath = "./kermes-pos/build/index.html"
    if (Test-Path $indexPath) {
        $newTitle = "<title>Kermes POS v$newVersion</title>"
        (Get-Content $indexPath) -replace '<title>.*?</title>', $newTitle | Set-Content $indexPath -Encoding UTF8
        Write-Host "Updated <title> in build/index.html to 'Kermes POS v$newVersion'" -ForegroundColor Green
    } else {
        Write-ErrorAndExit "build/index.html not found!"
    }
    #endregion Step 3

    #region Step 4: Copy build folder to electron
    Write-Section "Copy build folder to kermes-electron" 4 $totalSteps
    Remove-Item -Recurse -Force ./kermes-electron/build -ErrorAction SilentlyContinue
    Copy-Item -Recurse -Force ./kermes-pos/build ./kermes-electron/build
    Write-Host "Copied build folder successfully." -ForegroundColor Green
    #endregion Step 4

    #region Step 5: Clean dist folder before electron build
    Write-Section "Clean dist folder" 5 $totalSteps
    $distPath = "./kermes-electron/dist"
    if (Test-Path $distPath) {
        Remove-Item -Recurse -Force $distPath
        Write-Host "Deleted old dist folder." -ForegroundColor Green
    } else {
        Write-Host "No dist folder to delete." -ForegroundColor Gray
    }
    #endregion Step 5

    #region Step 6: Build kermes-electron
    Write-Section "Build kermes-electron" 6 $totalSteps
    cd ./kermes-electron
    npm run build
    if ($LASTEXITCODE -ne 0) { Write-ErrorAndExit "kermes-electron build failed." }
    cd ..
    #endregion Step 6

    #region Step 7: Prepare release files
    Write-Section "Prepare release files" 7 $totalSteps # Ömer war hier, ömer ist ein bisschen freaky, talha war hier, ich liebe essen
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
    #endregion Step 7

    #region Step 8: Generate changelog section from commit messages
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
            if ($desc) {
                $desc = $desc.Substring(0,1).ToUpper() + $desc.Substring(1)
                $globalNotes += "- $desc"
            }
        } else {
            $typeTags = [regex]::Matches($line, "--(feat|bug|change|chore)") | ForEach-Object { $_.Groups[1].Value }
            $dirTags = [regex]::Matches($line, "--(electron|pos|web)") | ForEach-Object { $_.Groups[1].Value }
            if ($typeTags.Count -gt 0 -and $dirTags.Count -gt 0) {
                $desc = $line -replace "--(feat|bug|change|chore)", "" -replace "--(electron|pos|web)", "" -replace "^\s*-*\s*", "" -replace "\s+$", ""
                if ($desc) {
                    $desc = $desc.Substring(0,1).ToUpper() + $desc.Substring(1)
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
        }
    }
    # Capitalize the first letter of each bullet point in changelogSection
    function Capitalize-FirstLetter {
        param([string]$text)
        if ($text.Length -gt 1) {
            return ($text.Substring(0,2).ToUpper() + $text.Substring(2))
        } elseif ($text.Length -eq 1) {
            return $text.ToUpper()
        } else {
            return $text
        }
    }
    $changelogSection = ($changelogSection -split "`n") | ForEach-Object {
        if ($_ -match '^\s*- ') {
            $bullet = $_.Substring(0, $_.IndexOf('-')+2)
            $rest = $_.Substring($_.IndexOf('-')+2).TrimStart()
            $capitalized = if ($rest.Length -gt 0) { $rest.Substring(0,1).ToUpper() + $rest.Substring(1) } else { $rest }
            "$bullet$capitalized"
        } else {
            $_
        }
    } | Out-String
    # Insert changelog section after the 7th line (index 6), with one blank line before and after
    $changelogLines = Get-Content $changelogPath
    $newSection = @($changelogSection)
    $before = $changelogLines[0..6]
    $after = $changelogLines[7..($changelogLines.Count-1)]
    $finalChangelog = $before + $newSection + $after
    Set-Content $changelogPath -Value $finalChangelog -Encoding UTF8
    # Custom header for release notes
    $releaseNotesHeader = "### 🚀 Kermes POS $newVersion Release Notes ($newDate)`n"
    $releaseNotes = $releaseNotesHeader + $changelogSection
    #endregion Step 8

    #region Step 9: Push commits before changelog and release
    Write-Section "Push commits" 9 $totalSteps
    git add .
    git commit -m "chore: prepare release $newVersion"
    git push
    if ($LASTEXITCODE -ne 0) { Write-ErrorAndExit "Git push failed." }
    #endregion Step 9

    #region Step 10: Create GitHub release and upload assets
    Write-Section "Create GitHub Release" 10 $totalSteps
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
    #endregion Step 10

    if ($deployToHosting) {
        Write-Host "Deploying to Firebase Hosting..." -ForegroundColor Cyan
        Push-Location ./kermes-pos
        firebase deploy --only hosting
        Pop-Location
    }

    #region Final Output
    $endTime = Get-Date
    $duration = $endTime - $startTime
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ("All done! Total time: {0:mm\:ss} (mm:ss)" -f $duration) -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Cyan
    #endregion Final Output
}
catch {
    Write-Host "[FATAL ERROR] $_" -ForegroundColor Red
    exit 1
}
