param([ValidateSet('start','stop','status')][string]$Action = 'start')
$ErrorActionPreference = 'Stop'
$backendRoot = Split-Path $PSScriptRoot -Parent
$pgControl = Join-Path $backendRoot '.local/pgsql/bin/pg_ctl.exe'
$pgData = Join-Path $backendRoot '.local/pgdata'
$pgLog = Join-Path $backendRoot '.local/postgres.log'
if (!(Test-Path -LiteralPath $pgControl) -or !(Test-Path -LiteralPath (Join-Path $pgData 'PG_VERSION'))) {
  throw 'Portable PostgreSQL is not initialized. See DATABASE.md for Docker alternative.'
}
if ($Action -eq 'status') { & $pgControl -D $pgData status; exit $LASTEXITCODE }
if ($Action -eq 'start') {
  & $pgControl -D $pgData status *> $null
  if ($LASTEXITCODE -eq 0) { Write-Output 'PostgreSQL already running'; exit 0 }
  $pgArgs = @('-D', ('"' + $pgData + '"'), '-l', ('"' + $pgLog + '"'), '-w', 'start')
} else { $pgArgs = @('-D', ('"' + $pgData + '"'), '-m', 'fast', '-w', 'stop') }
$pgProcess = Start-Process -FilePath $pgControl -ArgumentList $pgArgs -WindowStyle Hidden -Wait -PassThru
if ($pgProcess.ExitCode -ne 0) { throw "PostgreSQL $Action failed; inspect .local/postgres.log" }
Write-Output "PostgreSQL $Action complete"
