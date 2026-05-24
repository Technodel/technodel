<#
.SYNOPSIS
  Install 12-hour scheduled task for ALL-MALL sync on Windows
.DESCRIPTION
  Run as Administrator. Creates a Scheduled Task that runs sync-engine.js every 12 hours.
.EXAMPLE
  .\setup\cron-sync.ps1              # install
  .\setup\cron-sync.ps1 -Remove      # remove
#>

param([switch]$Remove)

$TaskName = "TechnodelSync"
$ProjectDir = "D:\Projects\techndodel"
$NodePath = "node"
$LogFile = "$ProjectDir\logs\sync.log"

if ($Remove) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Removed" -ForegroundColor Green
  exit
}

New-Item -ItemType Directory -Force -Path "$ProjectDir\logs" | Out-Null

$Action = New-ScheduledTaskAction -Execute "$NodePath" -Argument "scripts\sync-engine.js" -WorkingDirectory $ProjectDir
$Trigger = New-ScheduledTaskTrigger -Daily -At 12:00AM -RepetitionInterval (New-TimeSpan -Hours 12) -RepetitionDuration (New-TimeSpan -Days 365)
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Description "ALL-MALL -> Technodel sync every 12 hours" -Force

Write-Host "Done. Runs every 12 hours."
Write-Host "Remove: .\setup\cron-sync.ps1 -Remove"
