param(
    [switch]$force
)

# ============================================================
#region Helper Library
# ============================================================

# Ensure console can render box-drawing / Unicode characters
$script:UseUnicode = $true
try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {
    $script:UseUnicode = $false
}

# Box-drawing character sets (Unicode first, ASCII fallback)
if ($script:UseUnicode) {
    $BOX_TL = [string][char]0x250C   # ┌
    $BOX_TR = [string][char]0x2510   # ┐
    $BOX_BL = [string][char]0x2514   # └
    $BOX_BR = [string][char]0x2518   # ┘
    $BOX_H  = [string][char]0x2500   # ─
    $BOX_V  = [string][char]0x2502   # │
    $DH_TL  = [string][char]0x2554   # ╔
    $DH_TR  = [string][char]0x2557   # ╗
    $DH_BL  = [string][char]0x255A   # ╚
    $DH_BR  = [string][char]0x255D   # ╝
    $DH_H   = [string][char]0x2550   # ═
    $DH_V   = [string][char]0x2551   # ║
    $BAR_FULL  = [string][char]0x2588 # █
    $BAR_EMPTY = [string][char]0x2591 # ░
    $DIV_CHAR  = [string][char]0x2500 # ─
} else {
    $BOX_TL = '+'; $BOX_TR = '+'; $BOX_BL = '+'; $BOX_BR = '+'
    $BOX_H = '-'; $BOX_V = '|'
    $DH_TL = '+'; $DH_TR = '+'; $DH_BL = '+'; $DH_BR = '+'
    $DH_H = '='; $DH_V = '|'
    $BAR_FULL = '#'; $BAR_EMPTY = '-'
    $DIV_CHAR = '-'
}

$PANEL_WIDTH = 62  # interior width of all panels

# ---------------------------------------------------------------------------
function Write-Banner {
    param([string]$Version)
    $width = $PANEL_WIDTH + 2  # +2 for the two border chars
    Write-Host ""
    Write-Host ($DH_TL + ($DH_H * ($width - 2)) + $DH_TR) -ForegroundColor Cyan
    $line1 = "  Kermes Release Tool"
    $line2 = "  Professional monorepo release automation"
    $line3 = "  Loaded version: v$Version"
    Write-Host ($DH_V + $line1.PadRight($width - 2) + $DH_V) -ForegroundColor Cyan
    Write-Host ($DH_V + $line2.PadRight($width - 2) + $DH_V) -ForegroundColor DarkCyan
    Write-Host ($DH_V + $line3.PadRight($width - 2) + $DH_V) -ForegroundColor DarkGray
    Write-Host ($DH_BL + ($DH_H * ($width - 2)) + $DH_BR) -ForegroundColor Cyan
    Write-Host ""
}

# ---------------------------------------------------------------------------
function Write-StepHeader {
    param([int]$Step, [int]$Total, [string]$Name)
    $barWidth = 20
    $filled = [int][Math]::Round(($Step / $Total) * $barWidth)
    $empty = $barWidth - $filled
    $pct = [int][Math]::Round(($Step / $Total) * 100)
    $bar = ($BAR_FULL * $filled) + ($BAR_EMPTY * $empty)
    Write-Host ""
    Write-Divider
    Write-Host "  Step $Step of $Total  " -NoNewline -ForegroundColor DarkGray
    Write-Host $Name -NoNewline -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  [$bar] $pct%" -ForegroundColor Cyan
    Write-Divider
}

# ---------------------------------------------------------------------------
function Write-Divider {
    Write-Host ($DIV_CHAR * ($PANEL_WIDTH + 2)) -ForegroundColor DarkGray
}

# ---------------------------------------------------------------------------
function Write-Success {
    param([string]$Message, [string]$Detail = "")
    Write-Host "  [OK] " -NoNewline -ForegroundColor Green
    Write-Host $Message -NoNewline -ForegroundColor White
    if ($Detail) { Write-Host "  $Detail" -NoNewline -ForegroundColor DarkGray }
    Write-Host ""
}

# ---------------------------------------------------------------------------
function Write-Info {
    param([string]$Message)
    Write-Host "  [i] " -NoNewline -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor White
}

# ---------------------------------------------------------------------------
function Write-Warn {
    param([string]$Message)
    Write-Host "  [!] " -NoNewline -ForegroundColor Yellow
    Write-Host $Message -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
function Write-Err {
    param([string]$Message)
    Write-Host "  [X] " -NoNewline -ForegroundColor Red
    Write-Host $Message -ForegroundColor Red
}

# ---------------------------------------------------------------------------
function Write-Skipped {
    param([string]$Reason)
    Write-Host "  --- Skipped: $Reason" -ForegroundColor DarkGray
}

# ---------------------------------------------------------------------------
function Write-KeyValue {
    param([string]$Key, [string]$Value, [int]$KeyWidth = 18, [System.ConsoleColor]$ValueColor = [System.ConsoleColor]::White)
    $paddedKey = $Key.PadRight($KeyWidth)
    Write-Host "  $paddedKey" -NoNewline -ForegroundColor DarkGray
    Write-Host ": " -NoNewline -ForegroundColor DarkGray
    Write-Host $Value -ForegroundColor $ValueColor
}

# ---------------------------------------------------------------------------
function Prompt-Choice {
    param(
        [string]$Label = "Choose",
        [string[]]$Keys,
        [string[]]$Labels,
        [string]$QuitKey = "q"
    )
    Write-Host ""
    Write-Host "  $Label" -ForegroundColor DarkGray
    Write-Host "  " -NoNewline
    for ($i = 0; $i -lt $Keys.Count; $i++) {
        Write-Host "[$($Keys[$i])] " -NoNewline -ForegroundColor Cyan
        Write-Host "$($Labels[$i])  " -NoNewline -ForegroundColor White
    }
    Write-Host "[Q] Quit" -NoNewline -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  > " -NoNewline -ForegroundColor Cyan

    $result = $null
    while ($null -eq $result) {
        $key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        $char = $key.Character.ToString().ToLower()
        if ($char -eq $QuitKey.ToLower()) {
            Write-Host "Quit" -ForegroundColor DarkGray
            exit 0
        }
        for ($i = 0; $i -lt $Keys.Count; $i++) {
            if ($char -eq $Keys[$i].ToLower()) {
                Write-Host $Labels[$i] -ForegroundColor Yellow
                $result = $Keys[$i]
            }
        }
    }
    return $result
}

# ---------------------------------------------------------------------------
function Prompt-Confirm {
    param([string]$Label = "Proceed?", [bool]$DefaultYes = $true)
    $hint = if ($DefaultYes) { "[Y/n]" } else { "[y/N]" }
    Write-Host ""
    Write-Host "  $Label $hint  " -NoNewline -ForegroundColor Cyan
    $key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    $char = $key.Character.ToString().ToLower()
    if ($char -eq "`r" -or $char -eq "`n" -or $char -eq "") {
        $answer = $DefaultYes
    } elseif ($char -eq 'y') {
        $answer = $true
    } elseif ($char -eq 'n') {
        $answer = $false
    } else {
        $answer = $DefaultYes
    }
    $label = if ($answer) { "Yes" } else { "No" }
    Write-Host $label -ForegroundColor $(if ($answer) { "Green" } else { "DarkGray" })
    return $answer
}

# ---------------------------------------------------------------------------
function Format-FileSize {
    param([long]$Bytes)
    if ($Bytes -ge 1MB) {
        return ("{0:N1} MB" -f ($Bytes / 1MB))
    } else {
        return ("{0:N1} KB" -f ($Bytes / 1KB))
    }
}

# ---------------------------------------------------------------------------
function Write-FileSummary {
    param([object[]]$Files)
    # Files: array of @{Name=...; Path=...; Badge=...}
    $width = $PANEL_WIDTH + 2
    Write-Host ""
    Write-Host ($BOX_TL + (($BOX_H * 2) + " Assets to Upload " + ($BOX_H * ($width - 22))) + $BOX_TR) -ForegroundColor Cyan
    foreach ($f in $Files) {
        $fi = Get-Item $f.Path -ErrorAction SilentlyContinue
        $size = if ($fi) { Format-FileSize $fi.Length } else { "?" }
        $name = $f.Name
        $badge = $f.Badge
        # inner width = $PANEL_WIDTH = 62 chars; layout: name ... size  [badge]
        $right = "$size  [$badge]"
        $maxName = $PANEL_WIDTH - $right.Length - 2
        if ($name.Length -gt $maxName) { $name = $name.Substring(0, $maxName - 1) + "~" }
        $inner = " " + $name.PadRight($PANEL_WIDTH - $right.Length - 1) + $right + " "
        Write-Host ($BOX_V + $inner + $BOX_V) -ForegroundColor Cyan
    }
    Write-Host ($BOX_BL + ($BOX_H * ($width - 2)) + $BOX_BR) -ForegroundColor Cyan
    Write-Host ""
}

# ---------------------------------------------------------------------------
function Write-ReleaseSummaryPanel {
    param(
        [string]$UpdateType,   # "hot" or "core"
        [string]$OldVersion,
        [string]$NewVersion,
        [string]$LastTag,
        [int]$CommitCount,
        [string]$Branch
    )
    $width = $PANEL_WIDTH + 2
    $typeLabel = if ($UpdateType -eq "hot") { "Frontend Hot-Update" } else { "Core Shell Update" }
    Write-Host ""
    Write-Host ($BOX_TL + (($BOX_H * 2) + " Release Summary " + ($BOX_H * ($width - 20))) + $BOX_TR) -ForegroundColor Cyan

    function PanelLine([string]$key, [string]$val, [System.ConsoleColor]$vc) {
        $k = $key.PadRight(16)
        $inner = " $k : $val"
        $inner = $inner.PadRight($PANEL_WIDTH + 1)
        Write-Host ($BOX_V) -NoNewline -ForegroundColor Cyan
        Write-Host (" $k : ") -NoNewline -ForegroundColor DarkGray
        $valPart = $val.PadRight($PANEL_WIDTH - 20)
        Write-Host ($valPart) -NoNewline -ForegroundColor $vc
        # pad to fill
        $used = 1 + 16 + 3 + $valPart.Length + 1
        $pad = ($PANEL_WIDTH) - $used
        if ($pad -gt 0) { Write-Host (" " * $pad) -NoNewline }
        Write-Host $BOX_V -ForegroundColor Cyan
    }

    PanelLine "Update type" $typeLabel $(if ($UpdateType -eq "hot") { "Green" } else { "Yellow" })
    PanelLine "Version" "$OldVersion -> $NewVersion" "White"
    PanelLine "Last tag" "$LastTag  ($CommitCount commits)" "DarkGray"
    PanelLine "Branch" $Branch "Cyan"
    Write-Host ($BOX_BL + ($BOX_H * ($width - 2)) + $BOX_BR) -ForegroundColor Cyan
    Write-Host ""
}

# ---------------------------------------------------------------------------
function Write-UpdateTypeBadge {
    param([bool]$IsHot)
    $width = $PANEL_WIDTH + 2
    if ($IsHot) {
        $label = "  FRONTEND HOT-UPDATE  "
        $desc  = "  Only frontend assets changed. No new installer required."
        Write-Host ($BOX_TL + ($BOX_H * ($width - 2)) + $BOX_TR) -ForegroundColor Green
        Write-Host ($BOX_V + $label.PadRight($width - 2) + $BOX_V) -ForegroundColor Green
        Write-Host ($BOX_V + $desc.PadRight($width - 2) + $BOX_V) -ForegroundColor DarkGreen
        Write-Host ($BOX_BL + ($BOX_H * ($width - 2)) + $BOX_BR) -ForegroundColor Green
    } else {
        $label = "  CORE SHELL UPDATE  "
        $desc  = "  Electron shell files changed. Full installer required."
        Write-Host ($BOX_TL + ($BOX_H * ($width - 2)) + $BOX_TR) -ForegroundColor Yellow
        Write-Host ($BOX_V + $label.PadRight($width - 2) + $BOX_V) -ForegroundColor Yellow
        Write-Host ($BOX_V + $desc.PadRight($width - 2) + $BOX_V) -ForegroundColor DarkYellow
        Write-Host ($BOX_BL + ($BOX_H * ($width - 2)) + $BOX_BR) -ForegroundColor Yellow
    }
    Write-Host ""
}

# ---------------------------------------------------------------------------
function Write-DurationSummary {
    param([TimeSpan]$Duration, [string]$Version, [int]$AssetCount, [string]$ReleaseUrl = "")
    $width = $PANEL_WIDTH + 2
    $mm = [int]$Duration.TotalMinutes
    $ss = $Duration.Seconds
    $timeStr = "{0:D2}:{1:D2}" -f $mm, $ss
    Write-Host ""
    Write-Host ($DH_TL + ($DH_H * ($width - 2)) + $DH_TR) -ForegroundColor Green

    function FinalLine([string]$text) {
        Write-Host ($DH_V + ("  " + $text).PadRight($width - 2) + $DH_V) -ForegroundColor Green
    }

    FinalLine "Kermes POS v$Version released successfully!"
    FinalLine "Total time : $timeStr"
    FinalLine "$AssetCount assets uploaded to GitHub"
    if ($ReleaseUrl) { FinalLine $ReleaseUrl }
    Write-Host ($DH_BL + ($DH_H * ($width - 2)) + $DH_BR) -ForegroundColor Green
    Write-Host ""
}

# ---------------------------------------------------------------------------
function Write-FatalError {
    param([string]$StepName, [string]$Message)
    Write-Host ""
    Write-Host ("=" * ($PANEL_WIDTH + 2)) -ForegroundColor Red
    Write-Host "  FATAL ERROR in: $StepName" -ForegroundColor Red
    Write-Host "  $Message" -ForegroundColor Red
    Write-Host ("=" * ($PANEL_WIDTH + 2)) -ForegroundColor Red
    Write-Host ""
}

# ---------------------------------------------------------------------------
function Measure-StepTime {
    param([DateTime]$Start)
    $elapsed = (Get-Date) - $Start
    $secs = [Math]::Round($elapsed.TotalSeconds, 1)
    return "(${secs}s)"
}

#endregion Helper Library

# ============================================================
#region Globals
# ============================================================
$ErrorActionPreference = 'Stop'
$startTime = Get-Date
$totalSteps = 10
#endregion Globals

# ============================================================
#region Pre-checks
# ============================================================
# Check for uncommitted changes before starting (unless --force is set)
if (-not $force) {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-FatalError "Pre-check" "There are uncommitted changes in the repository. Commit or stash them before releasing."
        Write-Host $gitStatus -ForegroundColor DarkGray
        exit 1
    }
}

# Read current version for the banner
$_bannerPkg = Get-Content "./kermes-electron/package.json" -ErrorAction SilentlyContinue | ConvertFrom-Json
$_bannerVer = if ($_bannerPkg) { $_bannerPkg.version } else { "?.?.?" }
Write-Banner -Version $_bannerVer
#endregion Pre-checks

try {

    # ============================================================
    # Auto-detect update type (Hot-Update vs Core Shell Update)
    # ============================================================
    Write-Info "Fetching latest tags from remote..."
    try {
        git fetch --tags 2>&1 | Out-Null
    } catch {
        Write-Warn "Failed to fetch tags from remote. Using local tags."
    }

    $lastTag = $null
    try {
        $lastTag = git describe --tags --abbrev=0 HEAD
    } catch {
        # No tags yet; first release
    }

    $isHotUpdate = $true
    $changedShellFiles = @()

    if ($lastTag) {
        $changedFiles = git diff --name-only $lastTag HEAD
        foreach ($file in $changedFiles) {
            $normalizedFile = $file -replace '\\', '/'
            # Check if changes happened inside kermes-electron and NOT in build/ or dist/
            if ($normalizedFile -like "kermes-electron/*" -and
                $normalizedFile -notlike "kermes-electron/build/*" -and
                $normalizedFile -notlike "kermes-electron/dist/*") {
                if ($normalizedFile -eq "kermes-electron/package.json") {
                    $pkgDiff = git diff -U0 $lastTag HEAD -- "kermes-electron/package.json"
                    if ($pkgDiff -match '"dependencies"' -or $pkgDiff -match '"devDependencies"' -or $pkgDiff -match '"build"') {
                        $changedShellFiles += $file
                        $isHotUpdate = $false
                    }
                } else {
                    $changedShellFiles += $file
                    $isHotUpdate = $false
                }
            }
        }
    } else {
        $isHotUpdate = $false
    }

    Write-UpdateTypeBadge -IsHot $isHotUpdate

    if (-not $isHotUpdate -and $changedShellFiles.Count -gt 0) {
        Write-Info "Changed shell files:"
        foreach ($f in $changedShellFiles) {
            Write-Host "    $f" -ForegroundColor DarkGray
        }
    }

    # ============================================================
    # Step 1: Version Increment
    # ============================================================
    Write-StepHeader -Step 1 -Total $totalSteps -Name "Version Increment"
    $s1Start = Get-Date

    $packageJsonPath = "./kermes-electron/package.json"
    $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
    $currentVersion = $packageJson.version
    Write-KeyValue "Current version" $currentVersion -ValueColor Cyan

    $bumpChoice = Prompt-Choice -Label "Select version bump type:" `
        -Keys @("1","2","3") `
        -Labels @("Major","Minor","Patch")

    $versionParts = $currentVersion -split '\.'
    $major = [int]$versionParts[0]
    $minor = [int]$versionParts[1]
    $patch = [int]$versionParts[2]

    switch ($bumpChoice) {
        '1' { $major++; $minor = 0; $patch = 0 }
        '2' { $minor++; $patch = 0 }
        '3' { $patch++ }
        default { Write-FatalError "Version Increment" "Invalid choice '$bumpChoice'."; exit 1 }
    }
    $newVersion = "$major.$minor.$patch"
    $bumpType = switch ($bumpChoice) { '1'{"major"} '2'{"minor"} '3'{"patch"} }
    Write-Info "$currentVersion  ->  $newVersion  ($bumpType bump)"

    # Update kermes-electron/package.json
    $packageJson.version = $newVersion
    $packageJson | ConvertTo-Json -Depth 100 | Set-Content $packageJsonPath -Encoding UTF8

    # Also update kermes-pos/package.json version
    $posPackageJsonPath = "./kermes-pos/package.json"
    if (Test-Path $posPackageJsonPath) {
        $posPackageJson = Get-Content $posPackageJsonPath | ConvertFrom-Json
        $posPackageJson.version = $newVersion
        $posPackageJson | ConvertTo-Json -Depth 100 | Set-Content $posPackageJsonPath -Encoding UTF8
        Write-Success "Updated kermes-pos/package.json"
    } else {
        Write-Warn "kermes-pos/package.json not found, skipping version update for kermes-pos."
    }

    # Deploy to hosting prompt (default No)
    $deployToHosting = Prompt-Confirm -Label "Deploy to Firebase Hosting after release?" -DefaultYes $false

    Write-Success "Version set to $newVersion" (Measure-StepTime $s1Start)

    # ============================================================
    # Print Release Summary Panel (now we know new version)
    # ============================================================
    $commitsSinceTag = 0
    if ($lastTag) {
        try { $commitsSinceTag = [int](git rev-list "$lastTag..HEAD" --count) } catch {}
    }
    $currentBranch = ""
    try { $currentBranch = (git rev-parse --abbrev-ref HEAD).Trim() } catch { $currentBranch = "unknown" }

    Write-ReleaseSummaryPanel `
        -UpdateType $(if ($isHotUpdate) { "hot" } else { "core" }) `
        -OldVersion $currentVersion `
        -NewVersion $newVersion `
        -LastTag $(if ($lastTag) { $lastTag } else { "(none)" }) `
        -CommitCount $commitsSinceTag `
        -Branch $currentBranch

    # ============================================================
    # Step 2: Build kermes-pos
    # ============================================================
    Write-StepHeader -Step 2 -Total $totalSteps -Name "Build kermes-pos"
    $s2Start = Get-Date

    Push-Location ./kermes-pos
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Pop-Location
            Write-FatalError "Build kermes-pos" "npm run build exited with code $LASTEXITCODE"
            exit 1
        }
    } finally {
        Pop-Location
    }

    Write-Success "Built kermes-pos successfully" (Measure-StepTime $s2Start)

    # ============================================================
    # Step 3: Patch <title> in build/index.html
    # ============================================================
    Write-StepHeader -Step 3 -Total $totalSteps -Name "Patch build/index.html title"
    $s3Start = Get-Date

    $indexPath = "./kermes-pos/build/index.html"
    if (Test-Path $indexPath) {
        $newTitle = "<title>Kermes POS v$newVersion</title>"
        (Get-Content $indexPath) -replace '<title>.*?</title>', $newTitle | Set-Content $indexPath -Encoding UTF8
        Write-Success "Title patched to 'Kermes POS v$newVersion'" (Measure-StepTime $s3Start)
    } else {
        Write-FatalError "Patch index.html" "build/index.html not found!"
        exit 1
    }

    # ============================================================
    # Step 4: Copy kermes-pos/build -> kermes-electron/build
    # ============================================================
    Write-StepHeader -Step 4 -Total $totalSteps -Name "Copy build to kermes-electron"
    $s4Start = Get-Date

    Remove-Item -Recurse -Force ./kermes-electron/build -ErrorAction SilentlyContinue
    Copy-Item -Recurse -Force ./kermes-pos/build ./kermes-electron/build
    Write-Success "Copied build folder to kermes-electron" (Measure-StepTime $s4Start)

    # ============================================================
    # Step 5: Clean dist folder
    # ============================================================
    Write-StepHeader -Step 5 -Total $totalSteps -Name "Clean dist folder"
    $s5Start = Get-Date

    $distPath = "./kermes-electron/dist"
    if (Test-Path $distPath) {
        Remove-Item -Recurse -Force $distPath
        Write-Success "Deleted old dist folder" (Measure-StepTime $s5Start)
    } else {
        Write-Skipped "No dist folder to delete."
    }

    # ============================================================
    # Step 6: Build kermes-electron
    # ============================================================
    Write-StepHeader -Step 6 -Total $totalSteps -Name "Build kermes-electron"
    $s6Start = Get-Date

    Push-Location ./kermes-electron
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Pop-Location
            Write-FatalError "Build kermes-electron" "npm run build exited with code $LASTEXITCODE"
            exit 1
        }
    } finally {
        Pop-Location
    }

    Write-Success "Built kermes-electron successfully" (Measure-StepTime $s6Start)

    # ============================================================
    # Step 7: Prepare release files
    # ============================================================
    Write-StepHeader -Step 7 -Total $totalSteps -Name "Prepare release files"
    $s7Start = Get-Date

    $distPath = "./kermes-electron/dist"
    $exeFile = Get-ChildItem $distPath -Filter *.exe | Select-Object -First 1
    $ymlFile = Get-ChildItem $distPath -Filter latest.yml | Select-Object -First 1

    if ($null -eq $exeFile -or $null -eq $ymlFile) {
        Write-FatalError "Prepare release files" "Missing .exe or latest.yml in dist folder!"
        exit 1
    }

    $blockmapFile = Get-ChildItem $distPath -Filter *.blockmap | Select-Object -First 1
    if ($null -eq $blockmapFile) {
        Write-Warn "Missing .blockmap file in dist folder!"
    } else {
        Write-Info "Blockmap found: $($blockmapFile.Name)"
    }

    # Rename .exe if it doesn't match the name in latest.yml
    $ymlContent = Get-Content $ymlFile.FullName -Raw
    $exeNameInYml = ($ymlContent | Select-String -Pattern 'url: (.+\.exe)' | ForEach-Object { $_.Matches[0].Groups[1].Value })
    if ($exeFile.Name -ne $exeNameInYml) {
        Write-Info "Renaming '$($exeFile.Name)' -> '$exeNameInYml' for update compatibility..."
        $targetPath = Join-Path $distPath $exeNameInYml
        if (Test-Path $targetPath) {
            Write-FatalError "Prepare release files" "Cannot rename: '$exeNameInYml' already exists in dist folder!"
            exit 1
        }
        Rename-Item $exeFile.FullName -NewName $exeNameInYml -Force
        $exeFile = Get-ChildItem $distPath -Filter $exeNameInYml | Select-Object -First 1
    }

    # Hot-update: compress frontend and annotate latest.yml
    $zipFile = $null
    if ($isHotUpdate) {
        Write-Info "Hot-update: compressing frontend with node util/zip.js..."
        $zipFile = Join-Path $distPath "frontend-update.zip"
        if (Test-Path $zipFile) { Remove-Item $zipFile }
        node ./kermes-electron/util/zip.js
        if (-not (Test-Path $zipFile)) {
            Write-FatalError "Prepare release files" "Failed to generate frontend-update.zip using node script!"
            exit 1
        }
        Add-Content -Path $ymlFile.FullName -Value "`nfrontendOnly: true" -Encoding UTF8
        Write-Info "Appended 'frontendOnly: true' to latest.yml"
    }

    Write-Success "Release files ready" (Measure-StepTime $s7Start)

    # ============================================================
    # Step 8: Generate changelog from commit messages
    # ============================================================
    Write-StepHeader -Step 8 -Total $totalSteps -Name "Generate changelog"
    $s8Start = Get-Date

    # Re-resolve lastTag (may have been set earlier; HEAD^ is intentional per original logic)
    $lastTag = git describe --tags --abbrev=0 HEAD^
    $changelogPath = "./CHANGELOG.md"
    $commitBodies = git log "$lastTag..HEAD" --pretty=format:"%B" | Out-String
    $commitLines = $commitBodies -split "`r?`n" | Where-Object { $_.Trim() -ne "" }
    $newDate = Get-Date -Format "dd-MM-yyyy"
    $changelogSection = "## [$newVersion] - $newDate`n"

    $dirMap = @{
        "electron" = "Kermes Electron"
        "pos"      = "Kermes POS"
        "web"      = "Kermes Web"
        "admin"    = "Kermes Admin"
        "menu"     = "Kermes Menu"
    }
    $typeMap = @{
        "feat"   = "Added"
        "bug"    = "Fixed"
        "change" = "Changed"
        "chore"  = "Changed"
        "fix"    = "Fixed"
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
            $typeTags = [regex]::Matches($line, "--(feat|fix|bug|change|chore)") | ForEach-Object { $_.Groups[1].Value }
            $dirTags  = [regex]::Matches($line, "--(electron|pos|web|admin|menu)") | ForEach-Object { $_.Groups[1].Value }

            if ($typeTags.Count -gt 0 -and $dirTags.Count -gt 0) {
                $desc = $line -replace "--(feat|bug|change|chore|fix)", "" -replace "--(electron|pos|web|admin|menu)", "" -replace "^\s*-*\s*", "" -replace "\s+$", ""
                if ($desc) {
                    $desc = $desc.Substring(0,1).ToUpper() + $desc.Substring(1)
                    foreach ($type in $typeTags) {
                        foreach ($dir in $dirTags) {
                            $dirKey  = $dirMap[$dir]
                            $typeKey = $typeMap[$type]
                            if (-not $grouped.ContainsKey($dirKey)) { $grouped[$dirKey] = @{} }
                            if (-not $grouped[$dirKey].ContainsKey($typeKey)) { $grouped[$dirKey][$typeKey] = @() }
                            $grouped[$dirKey][$typeKey] += "- $desc"
                        }
                    }
                }
            } elseif ($typeTags.Count -gt 0 -and $dirTags.Count -eq 0) {
                # Type tag but no dir tag -> treat as global
                $desc = $line -replace "--(feat|fix|bug|change|chore)", "" -replace "^\s*-*\s*", "" -replace "\s+$", ""
                if ($desc) {
                    $desc = $desc.Substring(0,1).ToUpper() + $desc.Substring(1)
                    foreach ($type in $typeTags) {
                        $globalNotes += "- $desc"
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

    # Capitalize first letter of every bullet point in the changelog section
    $changelogSection = ($changelogSection -split "`n") | ForEach-Object {
        if ($_ -match '^\s*- ') {
            $bullet      = $_.Substring(0, $_.IndexOf('-') + 2)
            $rest        = $_.Substring($_.IndexOf('-') + 2).TrimStart()
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
    $after  = $changelogLines[7..($changelogLines.Count - 1)]
    $finalChangelog = $before + $newSection + $after
    Set-Content $changelogPath -Value $finalChangelog -Encoding UTF8

    # Custom header for GitHub release notes
    $releaseNotesHeader = "### Kermes POS $newVersion Release Notes ($newDate)`n"
    $releaseNotes = $releaseNotesHeader + $changelogSection

    Write-Success "Changelog updated" (Measure-StepTime $s8Start)

    # ============================================================
    # Step 9: Commit and push
    # ============================================================
    Write-StepHeader -Step 9 -Total $totalSteps -Name "Push release commit"
    $s9Start = Get-Date

    git add .
    git commit -m "chore: prepare release $newVersion"
    git push
    if ($LASTEXITCODE -ne 0) {
        Write-FatalError "Push release commit" "Git push failed (exit code $LASTEXITCODE)."
        exit 1
    }

    Write-Success "Committed and pushed 'chore: prepare release $newVersion'" (Measure-StepTime $s9Start)

    # ============================================================
    # Step 10: Create GitHub release and upload assets
    # ============================================================
    Write-StepHeader -Step 10 -Total $totalSteps -Name "Create GitHub Release"
    $s10Start = Get-Date

    $tag          = "v$newVersion"
    $releaseTitle = "Kermes POS $newVersion"

    # Build the assets list
    $assetsToUpload = @($exeFile.FullName, $ymlFile.FullName)
    if ($null -ne $blockmapFile) { $assetsToUpload += $blockmapFile.FullName }
    if ($isHotUpdate -and $zipFile)  { $assetsToUpload += $zipFile }

    # Build display list for the file summary panel
    $assetDisplay = @()
    $assetDisplay += @{ Name = $exeFile.Name;    Path = $exeFile.FullName;    Badge = "INSTALLER" }
    $assetDisplay += @{ Name = $ymlFile.Name;    Path = $ymlFile.FullName;    Badge = "MANIFEST"  }
    if ($null -ne $blockmapFile) {
        $assetDisplay += @{ Name = $blockmapFile.Name; Path = $blockmapFile.FullName; Badge = "DELTA" }
    }
    if ($isHotUpdate -and $zipFile) {
        $assetDisplay += @{ Name = "frontend-update.zip"; Path = $zipFile; Badge = "HOT-UPDATE" }
    }

    Write-FileSummary -Files $assetDisplay

    $confirmed = Prompt-Confirm -Label "Upload $($assetsToUpload.Count) assets and create release $tag?" -DefaultYes $true
    if (-not $confirmed) {
        Write-Warn "GitHub release creation cancelled by user."
        exit 0
    }

    gh release create $tag $assetsToUpload --title "$releaseTitle" --notes "$releaseNotes"
    if ($LASTEXITCODE -ne 0) {
        Write-FatalError "Create GitHub Release" "gh release create exited with code $LASTEXITCODE"
        exit 1
    }

    # Try to get the release URL for the summary panel
    $releaseUrl = ""
    try { $releaseUrl = (gh release view $tag --json url --jq '.url' 2>$null).Trim() } catch {}

    Write-Success "Release $tag created and $($assetsToUpload.Count) assets uploaded" (Measure-StepTime $s10Start)

    # ============================================================
    # Post: Firebase Hosting deploy (optional)
    # ============================================================
    if ($deployToHosting) {
        Write-Info "Deploying to Firebase Hosting..."
        Push-Location ./kermes-pos
        try {
            firebase deploy --only hosting
        } finally {
            Pop-Location
        }
    }

    # ============================================================
    # Post: Offer deploy.ps1 for web-app commits
    # ============================================================
    $webScopes  = @("--menu", "--admin", "--web")
    $webCommits = git log "$lastTag..HEAD" --pretty=format:"%s" | Where-Object {
        $msg = $_
        $webScopes | Where-Object { $msg -match [regex]::Escape($_) }
    }
    if ($webCommits) {
        Write-Host ""
        Write-Info "Web-app commits detected in this release range:"
        $webCommits | Select-Object -First 6 | ForEach-Object {
            Write-Host "    $_" -ForegroundColor DarkGray
        }
        $webDeploy = Prompt-Confirm -Label "Deploy web apps now via deploy.ps1?" -DefaultYes $false
        if ($webDeploy) {
            & "$PSScriptRoot\deploy.ps1" -Since $lastTag
        }
    }

    # ============================================================
    # Final Summary
    # ============================================================
    $endTime = Get-Date
    $totalDuration = $endTime - $startTime
    Write-DurationSummary `
        -Duration $totalDuration `
        -Version $newVersion `
        -AssetCount $assetsToUpload.Count `
        -ReleaseUrl $releaseUrl

}
catch {
    Write-FatalError "Unexpected error" "$_"
    exit 1
}
