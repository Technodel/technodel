# =============================================================================
# Technodel.net — Windows Scheduled Task for 6-Hour Sync
# =============================================================================
# Run this ONCE as Administrator to schedule the sync every 6 hours.
#
# Usage:
#   Right-click PowerShell → Run as Administrator
#   cd D:\Projects\techndodel
#   .\setup\cron-sync.ps1
# =============================================================================

$TaskName = "TechnodelSync"
$ProjectDir = "D:\Projects\techndodel"
$NodePath = "node"
$ScriptPath = "$ProjectDir\scripts\sync-engine.js"
$LogPath = "$ProjectDir\logs\sync.log"

# Ensure logs directory exists
New-Item -Path "$ProjectDir\logs" -ItemType Directory -Force | Out-Null

# Create the scheduled task action
$Action = New-ScheduledTaskAction -Execute "$NodePath" `
  -Argument "$ScriptPath" `
  -WorkingDirectory "$ProjectDir"

# Create trigger for every 6 hours
$Trigger = New-ScheduledTaskTrigger -Daily -At "00:00" -RepetitionInterval (New-TimeSpan -Hours 6) -RepetitionDuration ([TimeSpan]::MaxValue)

# Run as current user
$Principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -RunLevel Limited

# Settings
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host " Technodel Sync Scheduled Task Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project: $ProjectDir"
Write-Host "Node:    $(where.exe node 2>$null | Select-Object -First 1)"
Write-Host "Log:     $LogPath"
Write-Host ""

# Skip if already exists
$Existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($Existing) {
  Write-Host "⚠️  Task '$TaskName' already exists. Updating..."
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Register the task
try {
  Register-ScheduledTask -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Principal $Principal `
    -Settings $Settings `
    -Description "Technodel.net bidirectional sync with ALL-MALL (every 6 hours)" | Out-Null

  Write-Host "✅ Scheduled task created!" -ForegroundColor Green
  Write-Host "   Name:     $TaskName"
  Write-Host "   Schedule: Every 6 hours"
  Write-Host "   Command:  $NodePath $ScriptPath"
  Write-Host "   Log:      $LogPath"
  Write-Host ""
  Write-Host "To test immediately:"
  Write-Host "  Start-ScheduledTask -TaskName '$TaskName'"
  Write-Host ""
  Write-Host "To view:"
  Write-Host "  Get-ScheduledTask -TaskName '$TaskName' | fl"
  Write-Host ""
  Write-Host "To remove:"
  Write-Host "  Unregister-ScheduledTask -TaskName '$TaskName' -Confirm"
  Write-Host "======================================" -ForegroundColor Cyan
} catch {
  Write-Host "❌ Failed: $_" -ForegroundColor Red
  Write-Host ""
  Write-Host "Troubleshooting:"
  Write-Host "  1. Run PowerShell as Administrator"
  Write-Host "  2. Check if task already exists: Get-ScheduledTask -TaskName '$TaskName'"
  Write-Host "  3. Remove it first: Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
}
