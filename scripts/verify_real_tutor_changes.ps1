$ErrorActionPreference = 'Stop'

Set-Location (Split-Path -Parent $PSScriptRoot)

$logins = @(
  @{ email = 'david.ramirez.lopez@gmail.com'; password = 'TutorPass1!' },
  @{ email = 'isabella.garcia.martinez@gmail.com'; password = 'TutorPass2!' },
  @{ email = 'carlos.vega.med@gmail.com'; password = 'TutorPass3!' },
  @{ email = 'martina.rodriguez.acevedo@gmail.com'; password = 'TutorPass4!' },
  @{ email = 'sebastian.morales.londono@gmail.com'; password = 'TutorPass5!' }
)

foreach ($login in $logins) {
  $body = @{
    email = $login.email
    password = $login.password
  } | ConvertTo-Json

  $response = Invoke-RestMethod -Method Post -Uri 'http://localhost:8001/auth/login' -ContentType 'application/json' -Body $body
  if (-not $response.access_token) {
    throw "No access token returned for $($login.email)"
  }
  Write-Host "LOGIN_OK $($login.email)"
}

$summary = docker compose exec -T -u postgres postgres psql -d ttp -Atc @'
SELECT COUNT(*) FROM auth.users WHERE email IN (
  'david.ramirez@local.test',
  'isabella.garcia@local.test',
  'carlos.vega@local.test',
  'martina.rodriguez@local.test',
  'sebastian.morales@local.test'
);
SELECT COUNT(*) FROM tutors.profiles WHERE user_id IN (
  'c1b7f33a-2b9c-4c9e-8f70-111111111111',
  'c1b7f33a-2b9c-4c9e-8f70-222222222222',
  'c1b7f33a-2b9c-4c9e-8f70-333333333333',
  'c1b7f33a-2b9c-4c9e-8f70-444444444444',
  '550e8400-e29b-41d4-a716-446655440005'
);
SELECT location_name FROM users.profiles WHERE user_id = 'c1b7f33a-2b9c-4c9e-8f70-333333333333';
'@

Write-Host $summary
