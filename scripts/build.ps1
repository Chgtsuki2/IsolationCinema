param([string]$Maven='mvn.cmd')
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot
$modules=@('discovery-server','api-gateway','auth-service','movie-service','cinema-service','showtime-service','booking-service','payment-service','notification-service')
New-Item -ItemType Directory -Force "$projectRoot/verification" | Out-Null
foreach($module in $modules){
 Push-Location "$projectRoot/$module"
 try {
  & $Maven -B -ntp clean test 2>&1 | Tee-Object "$projectRoot/verification/$module-test.log"
  if($LASTEXITCODE -ne 0){throw "Test failed: $module"}
  & $Maven -B -ntp clean package 2>&1 | Tee-Object "$projectRoot/verification/$module-package.log"
  if($LASTEXITCODE -ne 0){throw "Package failed: $module"}
 } finally {Pop-Location}
}
Push-Location "$projectRoot/cinema-client"
try {
 & npm.cmd ci --no-audit --no-fund
 if($LASTEXITCODE -ne 0){throw 'npm ci failed'}
 & npm.cmd run build 2>&1 | Tee-Object "$projectRoot/verification/frontend-build.log"
 if($LASTEXITCODE -ne 0){throw 'Frontend build failed'}
} finally {Pop-Location}
Write-Output 'All backend modules and frontend built successfully.'
