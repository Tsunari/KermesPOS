# Test script for automatic changelog generation (Step 8 from release.ps1)

$ErrorActionPreference = 'Stop'

$changelogPath = "./CHANGELOG.md"
$packageJsonPath = "./kermes-electron/package.json"
$packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
$newVersion = $packageJson.version
Write-Host "Current version: $($packageJson.version)" -ForegroundColor Green

Write-Host "Testing automatic changelog generation for version $newVersion..." -ForegroundColor Cyan

Set-Location -Path $PSScriptRoot

$lastTag = git describe --tags --abbrev=0 HEAD^
Write-Host "Last tag: $lastTag" -ForegroundColor Green
Write-Host "Current tag: $newVersion" -ForegroundColor Green
Write-Host "Running: git log v1.1.0..HEAD --pretty=format:`"%B`"" -ForegroundColor Yellow
$commitBodies = git log "$lastTag..HEAD" --pretty=format:"%B" | Out-String
Write-Host "Commit bodies raw output:" -ForegroundColor Yellow
Write-Host $commitBodies
$commitLines = $commitBodies -split "`r?`n" | Where-Object { $_.Trim() -ne "" }
$newDate = Get-Date -Format "dd-MM-yyyy"
$changelogSection = "## [$newVersion] - $newDate`n"
Write-Host $changelogSection
Write-Host $commitBodies
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
            # Remove all tags from description
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

Write-Host "Changelog updated!" -ForegroundColor Green

Write-Host "Current branch: $(git rev-parse --abbrev-ref HEAD)" -ForegroundColor Cyan
Write-Host "Current HEAD: $(git rev-parse HEAD)" -ForegroundColor Cyan
# Write-Host "Plain git log output:" -ForegroundColor Yellow
# git log --oneline | Out-String | Write-Host
