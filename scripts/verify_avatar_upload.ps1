$ErrorActionPreference = 'Stop'

Set-Location (Split-Path -Parent $PSScriptRoot)

$loginBody = @{
  email = 'david.ramirez.lopez@gmail.com'
  password = 'TutorPass1!'
} | ConvertTo-Json

$login = Invoke-RestMethod -Method Post -Uri 'http://localhost:8001/auth/login' -ContentType 'application/json' -Body $loginBody
if (-not $login.access_token) {
  throw 'Login did not return an access token'
}

$pngBytes = [Convert]::FromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO9X3TQAAAAASUVORK5CYII=')
$tempFile = Join-Path $env:TEMP 'ttp-avatar-test.png'
[System.IO.File]::WriteAllBytes($tempFile, $pngBytes)

$response = & curl.exe -s -X POST 'http://localhost:8000/media/upload' -H "Authorization: Bearer $($login.access_token)" -F "type=avatar" -F "file=@$tempFile;type=image/png"
if (-not $response) {
  throw 'Upload response was empty'
}

Write-Host $response
