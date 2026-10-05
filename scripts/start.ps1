param([string]$Java='java.exe')
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot
$envFile=Join-Path $projectRoot '.env.local'
if(!(Test-Path -LiteralPath $envFile)){throw 'Run scripts/setup-local.ps1 first.'}
foreach($line in Get-Content -LiteralPath $envFile){if($line -match '^([A-Z_]+)=(.*)$'){[Environment]::SetEnvironmentVariable($Matches[1],$Matches[2],'Process')}}
$modules=@('discovery-server','auth-service','movie-service','cinema-service','showtime-service','booking-service','payment-service','notification-service','api-gateway')
foreach($module in $modules){if(!(Test-Path -LiteralPath "$projectRoot/$module/target/$module-1.0.0.jar")){throw "Missing executable JAR: $module. Run scripts/build.ps1 first."}}
$runDir=Join-Path $projectRoot '.run'
New-Item -ItemType Directory -Force $runDir | Out-Null
if(Test-Path -LiteralPath "$runDir/processes.json"){
 $previous=Get-Content -LiteralPath "$runDir/processes.json" -Raw | ConvertFrom-Json
 foreach($entry in $previous){$p=Get-Process -Id $entry.pid -ErrorAction SilentlyContinue;if($p -and $p.StartTime.ToUniversalTime().ToString('o') -eq $entry.startedAt){throw 'A project process is still running. Run scripts/stop.ps1 first.'}}
}
$records=@()
foreach($module in $modules){
 if($module.EndsWith('-service')){
  $service=$module.Replace('-service','')
  $env:DB_USERNAME="cinema_$service"
  $env:DB_URL="jdbc:mysql://localhost:$($env:DB_PORT)/cinema_$($service)_db?connectionTimeZone=UTC"
 }
 $env:UPLOAD_DIR=Join-Path $projectRoot 'uploads'
 $jar=Join-Path $projectRoot "$module/target/$module-1.0.0.jar"
 $p=Start-Process -FilePath $Java -ArgumentList @('-Xms64m','-Xmx256m','-jar',('"'+$jar+'"')) -WorkingDirectory "$projectRoot/$module" -WindowStyle Hidden -RedirectStandardOutput "$runDir/$module.log" -RedirectStandardError "$runDir/$module.err.log" -PassThru
 $records+=@{name=$module;pid=$p.Id;startedAt=$p.StartTime.ToUniversalTime().ToString('o')}
 $records | ConvertTo-Json | Set-Content -LiteralPath "$runDir/processes.json"
}
Write-Output 'Backend processes started. Wait for Eureka registration; logs are in .run/.'
Write-Output 'Start frontend in another terminal: cd cinema-client; npm run dev'
