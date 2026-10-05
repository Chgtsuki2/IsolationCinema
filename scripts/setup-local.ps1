param([int]$DatabasePort=3306)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot
$envFile=Join-Path $projectRoot '.env.local'
if(Test-Path -LiteralPath $envFile){Write-Output '.env.local already exists; preserved.';exit 0}
function New-Key {
 $bytes=New-Object byte[] 32
 $rng=[Security.Cryptography.RandomNumberGenerator]::Create()
 try{$rng.GetBytes($bytes)}finally{$rng.Dispose()}
 return ([BitConverter]::ToString($bytes)).Replace('-','').ToLowerInvariant()
}
$lines=@("JWT_SECRET=$(New-Key)","INTERNAL_KEY=$(New-Key)",'DB_PASSWORD=CinemaLocal_2026!',"DB_PORT=$DatabasePort")
Set-Content -LiteralPath $envFile -Value $lines -Encoding utf8
Write-Output 'Created .env.local with local-only settings. Keep it private.'
