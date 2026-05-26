#Requires -Version 5.1
<#
.SYNOPSIS
    Kermes Deploy — Smart multi-app web deployment orchestrator.
.DESCRIPTION
    Scans recent git commits for --menu / --admin / --web scope tags and
    recommends which Next.js apps need to be deployed to Firebase Hosting.
    Supports interactive multi-select, per-app build + deploy, timing, and
    a final status summary. POS/Electron releases use release.ps1 instead.
.PARAMETER Force
    Skip the uncommitted-changes guard.
.PARAMETER NoBuild
    Skip the npm build step (re-deploy the last build artifact as-is).
.PARAMETER Since
    Git ref or tag to scan commits from. Defaults to the last git tag.
    Use 'HEAD~20' to look at the last 20 commits, etc.
.EXAMPLE
    .\deploy.ps1
    .\deploy.ps1 -Force -NoBuild
    .\deploy.ps1 -Since HEAD~30
#>
param(
    [switch]$Force,
    [switch]$NoBuild,
    [string]$Since = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─────────────────────────────────────────────────────────────────────────────
# ANSI / color helpers (Windows Terminal, PowerShell 5.1+ with ANSI support)
# ─────────────────────────────────────────────────────────────────────────────
$E = [char]27
function c($n) { "$E[$($n)m" }

$R  = c 0     # reset
$B  = c 1     # bold
$DM = c 2     # dim
$CY = c 36    # cyan
$GN = c 32    # green
$YL = c 33    # yellow
$RD = c 31    # red
$MG = c 35    # magenta
$BL = c 34    # blue
$GR = c 90    # dark gray

# Enable ANSI on older Windows hosts
if ([System.Console]::OutputEncoding.CodePage -ne 65001) {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
}
$null = [System.Runtime.InteropServices.RuntimeInformation] # silence unused-var

# ─────────────────────────────────────────────────────────────────────────────
# App registry — scope tag → subrepo metadata
# ─────────────────────────────────────────────────────────────────────────────
$APPS = [ordered]@{
    menu  = [pscustomobject]@{
        Key       = "menu"
        Name      = "kermes-menu"
        Dir       = "kermes-menu"
        ScopeTag  = "--menu"
        Color     = $CY
        ShortKey  = "M"
    }
    admin = [pscustomobject]@{
        Key       = "admin"
        Name      = "kermes-admin"
        Dir       = "kermes-admin"
        ScopeTag  = "--admin"
        Color     = $MG
        ShortKey  = "A"
    }
    web   = [pscustomobject]@{
        Key       = "web"
        Name      = "kermes-web"
        Dir       = "kermes-web"
        ScopeTag  = "--web"
        Color     = $BL
        ShortKey  = "W"
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# UI primitives
# ─────────────────────────────────────────────────────────────────────────────
function Get-Width { [Math]::Min($Host.UI.RawUI.WindowSize.Width, 70) }

function Write-Rule {
    param([string]$Char = "─", [string]$Col = $CY)
    $w = (Get-Width) - 4
    Write-Host "  $Col$($Char * $w)$R"
}

function Write-Box {
    param([string[]]$Lines, [string]$Col = $CY)
    $w = (Get-Width) - 4
    $inner = $w - 2
    Write-Host "  $Col┌$("─" * $inner)┐$R"
    foreach ($line in $Lines) {
        $visible = $line -replace "$E\[\d+m", ""
        $pad = [Math]::Max(0, $inner - $visible.Length - 1)
        Write-Host "  $Col│$R $line$(" " * $pad)$Col│$R"
    }
    Write-Host "  $Col└$("─" * $inner)┘$R"
}

function Write-Header {
    Write-Host ""
    Write-Box @(
        "$B$CY⬡  KERMES DEPLOY$R$DM  ·  Web App Deployment Orchestrator$R",
        "$DM$(Get-Date -Format 'yyyy-MM-dd  HH:mm')   Monorepo: KermesProgram$R"
    )
    Write-Host ""
}

function Write-SectionTitle {
    param([string]$Icon, [string]$Text)
    Write-Host "  $CY$Icon$R $B$Text$R"
}

function Write-StatusLine {
    param([string]$Icon, [string]$Col, [string]$Label, [string]$Text = "")
    Write-Host "  $Col$Icon$R  $B$Label$R  $DM$Text$R"
}

function Write-Ok   { param([string]$t) Write-Host "  $GN✓$R $t" }
function Write-Warn { param([string]$t) Write-Host "  $YL⚠$R $t" }
function Write-Err  { param([string]$t) Write-Host "  $RD✗$R $t" }
function Write-Info { param([string]$t) Write-Host "  $CY→$R $t" }

# Elapsed time helper
$_scriptStart = Get-Date
function Elapsed {
    $s = ((Get-Date) - $_scriptStart).TotalSeconds
    "{0:mm\:ss}" -f [TimeSpan]::FromSeconds($s)
}

# ─────────────────────────────────────────────────────────────────────────────
# Git helpers
# ─────────────────────────────────────────────────────────────────────────────
function Get-LastTag {
    try {
        $t = git describe --tags --abbrev=0 2>$null
        if ($LASTEXITCODE -eq 0 -and $t) { return $t.Trim() }
    } catch {}
    return $null
}

function Get-CommitsSince {
    param([string]$Ref)
    try {
        $msgs = git log "$Ref..HEAD" --pretty=format:"%s" 2>$null
        if ($LASTEXITCODE -eq 0) { return @($msgs) | Where-Object { $_ } }
    } catch {}
    return @()
}

# ─────────────────────────────────────────────────────────────────────────────
# Detection: which apps have commits since $ref?
# ─────────────────────────────────────────────────────────────────────────────
function Get-AppCommitCounts {
    param([string[]]$Commits)
    $counts = @{}
    $samples = @{}
    foreach ($key in $APPS.Keys) { $counts[$key] = 0; $samples[$key] = "" }

    foreach ($msg in $Commits) {
        foreach ($key in $APPS.Keys) {
            $app = $APPS[$key]
            if ($msg -match [regex]::Escape($app.ScopeTag)) {
                $counts[$key]++
                if (-not $samples[$key]) {
                    # Strip type/scope tags for display
                    $clean = $msg -replace " --\w+", "" -replace "^\s+|\s+$", ""
                    $samples[$key] = if ($clean.Length -gt 36) { $clean.Substring(0,33) + "…" } else { $clean }
                }
            }
        }
    }
    return $counts, $samples
}

# ─────────────────────────────────────────────────────────────────────────────
# Interactive multi-select
# ─────────────────────────────────────────────────────────────────────────────
function Show-AppTable {
    param(
        [hashtable]$Counts,
        [hashtable]$Samples,
        [hashtable]$Selected
    )
    $w = (Get-Width) - 4
    $inner = $w - 2
    Write-Host "  $CY┌$("─" * $inner)┐$R"
    Write-Host "  $CY│$R  $B$("App".PadRight(16))$("Commits".PadRight(9))$("Sel".PadRight(5))Last commit$(" " * [Math]::Max(0,$inner-43))$CY│$R"
    Write-Host "  $CY├$("─" * $inner)┤$R"
    $i = 1
    foreach ($key in $APPS.Keys) {
        $app     = $APPS[$key]
        $cnt     = $Counts[$key]
        $sel     = $Selected[$key]
        $sample  = $Samples[$key]
        $dot     = if ($cnt -gt 0) { "$($app.Color)●$R" } else { "$GR○$R" }
        $tick    = if ($sel) { "$GN✓$R" } else { "$GR○$R" }
        $cntStr  = if ($cnt -gt 0) { "$($app.Color)$cnt commit$(if($cnt -ne 1){'s'})$R" } else { "$GR none$R" }
        $sampleD = if ($sample) { "$DM$sample$R" } else { "$GR(no tagged commits found)$R" }
        $visible = "[$i] $dot  $($app.Name.PadRight(14)) $cntStr"
        # Just write as a normal line with padding
        $padded  = $app.Name.PadRight(14)
        $cntPad  = $(if($cnt -gt 0){"$cnt commit$(if($cnt-ne 1){'s'})"} else {"none"}).PadRight(10)
        $selDisp = $(if($sel){"[✓]"}else{"[ ]"}).PadRight(5)
        $sampleT = if ($sample.Length -gt 28) {$sample.Substring(0,25)+"…"} else {$sample}
        $line    = " [$i]  $dot  $($app.Color)$padded$R  $cntPad  $tick  $DM$sampleT$R"
        $lineVis = $line -replace "$E\[\d+m", ""
        $lineLen = $lineVis.Length
        $padAmt  = [Math]::Max(0, $inner - $lineLen - 1)
        Write-Host "  $CY│$R$line$(" " * $padAmt)$CY│$R"
        $i++
    }
    Write-Host "  $CY└$("─" * $inner)┘$R"
}

function Invoke-AppSelect {
    param(
        [hashtable]$Counts,
        [hashtable]$Samples,
        [hashtable]$InitialSelected
    )
    $selected = @{} + $InitialSelected

    while ($true) {
        # Clear previous table (6 lines: border-top + header + divider + 3 apps + border-bottom)
        Show-AppTable -Counts $Counts -Samples $Samples -Selected $selected
        Write-Host ""
        Write-Host "  $DM Toggle: $YL[1]$R$DM kermes-menu  $MG[2]$R$DM kermes-admin  $BL[3]$R$DM kermes-web$R"
        Write-Host "  $DM   Also: $GN[A]$R$DM select all   $RD[N]$R$DM select none   $GN[ENTER]$R$DM start deploy$R"
        Write-Host ""
        Write-Host -NoNewline "  $CY›$R Choice: "

        $key = [Console]::ReadKey($true)
        $ch  = $key.KeyChar.ToString().ToUpper()

        switch ($ch) {
            "1" { $selected["menu"]  = -not $selected["menu"]  }
            "2" { $selected["admin"] = -not $selected["admin"] }
            "3" { $selected["web"]   = -not $selected["web"]   }
            "A" { foreach ($k in $APPS.Keys) { $selected[$k] = $true  } }
            "N" { foreach ($k in $APPS.Keys) { $selected[$k] = $false } }
            default {
                if ($key.Key -eq [ConsoleKey]::Enter) {
                    Write-Host ""
                    return $selected
                }
                if ($key.Key -eq [ConsoleKey]::Escape) {
                    Write-Host ""
                    Write-Info "Cancelled by user."
                    exit 0
                }
            }
        }
        # Move cursor up to overwrite table
        $linesToClear = 9   # table(7) + blank + hint-lines(2) + blank + prompt = adjust if needed
        for ($l = 0; $l -lt $linesToClear; $l++) {
            [Console]::SetCursorPosition(0, [Console]::CursorTop - 1)
            Write-Host (" " * (Get-Width))
            [Console]::SetCursorPosition(0, [Console]::CursorTop - 1)
        }
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# Build + Deploy an app
# ─────────────────────────────────────────────────────────────────────────────
function Invoke-AppDeploy {
    param(
        [pscustomobject]$App,
        [bool]$SkipBuild
    )
    $appDir  = Join-Path $PSScriptRoot $App.Dir
    $result  = [pscustomobject]@{ App=$App.Name; Build=""; Deploy=""; Duration=""; OK=$false }
    $t0      = Get-Date

    if (-not (Test-Path $appDir)) {
        Write-Err "$($App.Name): directory not found at $appDir"
        $result.Build = "directory-missing"
        return $result
    }

    Push-Location $appDir
    try {
        # ── Build ────────────────────────────────────────────────────────────
        if (-not $SkipBuild) {
            Write-Info "$($App.Name): running $B`npm run build$R ..."
            npm run build
            if ($LASTEXITCODE -ne 0) {
                $result.Build = "FAILED"
                Write-Err "$($App.Name): build failed (exit $LASTEXITCODE)"
                return $result
            }
            $result.Build = "OK"
            Write-Ok "$($App.Name): build succeeded"
        } else {
            $result.Build = "skipped"
            Write-Warn "$($App.Name): build skipped (--NoBuild)"
        }

        # ── Deploy ───────────────────────────────────────────────────────────
        Write-Info "$($App.Name): running $B`firebase deploy --only hosting$R ..."
        firebase deploy --only hosting
        if ($LASTEXITCODE -ne 0) {
            $result.Deploy = "FAILED"
            Write-Err "$($App.Name): Firebase deploy failed (exit $LASTEXITCODE)"
            return $result
        }
        $result.Deploy = "OK"
        $result.OK     = $true
        Write-Ok "$($App.Name): deployed successfully"
    }
    finally {
        Pop-Location
        $result.Duration = "{0:mm\:ss}" -f ([TimeSpan]::FromSeconds(((Get-Date) - $t0).TotalSeconds))
    }
    return $result
}

# ─────────────────────────────────────────────────────────────────────────────
# Final summary table
# ─────────────────────────────────────────────────────────────────────────────
function Write-Summary {
    param([object[]]$Results)
    Write-Host ""
    Write-Rule
    Write-SectionTitle "◈" "Deployment Summary"
    Write-Host ""
    $w = (Get-Width) - 4
    $inner = $w - 2
    Write-Host "  $CY┌$("─" * $inner)┐$R"
    Write-Host "  $CY│$R  $B$("App".PadRight(16))$("Build".PadRight(9))$("Deploy".PadRight(9))$("Time".PadRight(8))Status$(" " * [Math]::Max(0,$inner-47))$CY│$R"
    Write-Host "  $CY├$("─" * $inner)┤$R"
    foreach ($r in $Results) {
        $buildC  = if ($r.Build -eq "OK" -or $r.Build -eq "skipped") { $GN } elseif ($r.Build -eq "FAILED") { $RD } else { $YL }
        $depC    = if ($r.Deploy -eq "OK") { $GN } elseif ($r.Deploy -eq "FAILED") { $RD } else { $YL }
        $statC   = if ($r.OK) { $GN } else { $RD }
        $statT   = if ($r.OK) { "${GN}✓ OK${R}" } else { "${RD}✗ FAILED${R}" }
        $name    = $r.App.PadRight(16)
        $build   = $r.Build.PadRight(9)
        $deploy  = $r.Deploy.PadRight(9)
        $dur     = $r.Duration.PadRight(8)
        $line    = "  $name$buildC$build$R$depC$deploy$R$DM$dur$R$statT"
        $lineVis = $line -replace "$E\[\d+m", ""
        $padAmt  = [Math]::Max(0, $inner - $lineVis.Length - 1)
        Write-Host "  $CY│$R $line$(" " * $padAmt)$CY│$R"
    }
    Write-Host "  $CY└$("─" * $inner)┘$R"
}

# ═════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═════════════════════════════════════════════════════════════════════════════
Write-Header

# ── 0. Pre-checks ─────────────────────────────────────────────────────────────
Write-SectionTitle "⟳" "Pre-flight checks"
Write-Host ""

# Check firebase CLI
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Warn "firebase-tools not found — installing globally..."
    npm install -g firebase-tools
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Could not install firebase-tools. Please install manually: npm i -g firebase-tools"
        exit 1
    }
}
Write-Ok "firebase CLI found"

# Check git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Err "git not found in PATH."
    exit 1
}
Write-Ok "git found"

# Uncommitted changes guard
if (-not $Force) {
    $dirty = git status --porcelain
    if ($dirty) {
        Write-Host ""
        Write-Err "Uncommitted changes detected. Commit or stash first, or run with -Force."
        Write-Host ""
        Write-Host $dirty -ForegroundColor DarkGray
        exit 1
    }
    Write-Ok "Working tree clean"
} else {
    Write-Warn "Uncommitted-changes check skipped (-Force)"
}

Write-Host ""
Write-Rule

# ── 1. Commit scan ────────────────────────────────────────────────────────────
Write-Host ""
Write-SectionTitle "⊙" "Commit scan — detecting affected apps"
Write-Host ""

$sinceRef = $Since
if (-not $sinceRef) {
    $lastTag = Get-LastTag
    if ($lastTag) {
        $sinceRef = $lastTag
        Write-Info "Scanning commits since last tag: $B$lastTag$R"
    } else {
        $sinceRef = "HEAD~40"
        Write-Warn "No tags found — scanning last 40 commits ($B$sinceRef$R)"
    }
} else {
    Write-Info "Scanning commits since: $B$sinceRef$R"
}

$commits = Get-CommitsSince -Ref $sinceRef
Write-Ok "$($commits.Count) commit$(if($commits.Count -ne 1){'s'}) found in range"

# Check for POS/Electron commits (inform user to use release.ps1)
$posCommits = @($commits | Where-Object { $_ -match "--pos|--electron" })
if ($posCommits.Count -gt 0) {
    Write-Host ""
    Write-Warn "$($posCommits.Count) POS/Electron commit$(if($posCommits.Count-ne 1){'s'}) detected — use $B.\release.ps1$R to cut a new desktop release."
}

$counts, $samples = Get-AppCommitCounts -Commits $commits

# Build initial selection: recommend apps that have commits
$initialSelected = @{}
foreach ($key in $APPS.Keys) {
    $initialSelected[$key] = ($counts[$key] -gt 0)
}

Write-Host ""
Write-Rule

# ── 2. Interactive selection ───────────────────────────────────────────────────
Write-Host ""
Write-SectionTitle "◉" "Select apps to deploy"
Write-Host ""

$selected = Invoke-AppSelect -Counts $counts -Samples $samples -InitialSelected $initialSelected

$deployList = @($APPS.Values | Where-Object { $selected[$_.Key] })

if ($deployList.Count -eq 0) {
    Write-Host ""
    Write-Warn "No apps selected. Nothing to deploy."
    exit 0
}

Write-Host ""
Write-Info "Deploying: $($deployList | ForEach-Object { "$($_.Color)$($_.Name)$R" } | Out-String -NoNewline)"
if ($NoBuild) {
    Write-Warn "Build step will be skipped (--NoBuild)"
}
Write-Host ""
Write-Rule

# ── 3. Deploy selected apps ────────────────────────────────────────────────────
$results = @()
$appNum  = 0

foreach ($app in $deployList) {
    $appNum++
    Write-Host ""
    Write-SectionTitle "$($app.Color)▸$R" "[$appNum/$($deployList.Count)]  $($app.Color)$($app.Name)$R"
    Write-Rule "·" $app.Color
    Write-Host ""

    $r = Invoke-AppDeploy -App $app -SkipBuild:$NoBuild.IsPresent
    $results += $r

    Write-Host ""
    Write-Rule "·" $app.Color

    # Stop early on failure? Ask.
    if (-not $r.OK -and $appNum -lt $deployList.Count) {
        Write-Host ""
        Write-Host -NoNewline "  $YL?$R  $($app.Name) failed. Continue with remaining apps? $DM[Y/n]$R "
        $cont = [Console]::ReadKey($true)
        Write-Host ""
        if ($cont.KeyChar.ToString().ToUpper() -eq "N") {
            Write-Warn "Aborted after failure."
            break
        }
    }
}

# ── 4. Summary ─────────────────────────────────────────────────────────────────
Write-Summary -Results $results

$okCount   = @($results | Where-Object { $_.OK }).Count
$failCount = $results.Count - $okCount
$elapsed   = "{0:mm\:ss}" -f ([TimeSpan]::FromSeconds(((Get-Date) - $_scriptStart).TotalSeconds))

Write-Host ""
if ($failCount -eq 0) {
    Write-Ok "$B$okCount app$(if($okCount-ne 1){'s'}) deployed successfully$R  $DM(total time: $elapsed)$R"
} else {
    Write-Err "$failCount app$(if($failCount-ne 1){'s'}) FAILED  |  $okCount succeeded  $DM(total: $elapsed)$R"
}
Write-Host ""