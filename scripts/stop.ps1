$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot
$file=Join-Path $projectRoot '.run/processes.json'
if(!(Test-Path -LiteralPath $file)){Write-Output 'No recorded processes.';exit 0}
foreach($entry in (Get-Content -LiteralPath $file -Raw | ConvertFrom-Json)){
 $p=Get-Process -Id $entry.pid -ErrorAction SilentlyContinue
 if($p -and $p.StartTime.ToUniversalTime().ToString('o') -eq $entry.startedAt){Stop-Process -Id $p.Id;Write-Output "Stopped $($entry.name)"}
}
Remove-Item -LiteralPath $file
