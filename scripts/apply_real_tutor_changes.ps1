$ErrorActionPreference = 'Stop'

Set-Location (Split-Path -Parent $PSScriptRoot)

$py = @'
from sqlalchemy import text
from app.database import AsyncSessionLocal
from app.security import get_password_hash

TUTORS = [
    {"id": "c1b7f33a-2b9c-4c9e-8f70-111111111111", "email": "david.ramirez.lopez@gmail.com", "password": "TutorPass1!", "role": "tutor"},
    {"id": "c1b7f33a-2b9c-4c9e-8f70-222222222222", "email": "isabella.garcia.martinez@gmail.com", "password": "TutorPass2!", "role": "tutor"},
    {"id": "c1b7f33a-2b9c-4c9e-8f70-333333333333", "email": "carlos.vega.med@gmail.com", "password": "TutorPass3!", "role": "tutor"},
    {"id": "c1b7f33a-2b9c-4c9e-8f70-444444444444", "email": "martina.rodriguez.acevedo@gmail.com", "password": "TutorPass4!", "role": "tutor"},
    {"id": "550e8400-e29b-41d4-a716-446655440005", "email": "sebastian.morales.londono@gmail.com", "password": "TutorPass5!", "role": "tutor"},
]

UPDATE_SQL = text("""
UPDATE auth.users
SET email = :email,
    password_hash = :password_hash,
    role = :role,
    is_active = TRUE
WHERE id = :id
""")

INSERT_SQL = text("""
INSERT INTO auth.users (id, email, password_hash, role, is_active)
VALUES (:id, :email, :password_hash, :role, TRUE)
""")

async def main() -> None:
    async with AsyncSessionLocal() as session:
        for tutor in TUTORS:
            params = {
                "id": tutor["id"],
                "email": tutor["email"],
                "password_hash": get_password_hash(tutor["password"]),
                "role": tutor["role"],
            }
            result = await session.execute(UPDATE_SQL, params)
            if result.rowcount == 0:
                await session.execute(INSERT_SQL, params)
        await session.commit()

    print("Created/updated 5 real tutor auth accounts")
    for tutor in TUTORS:
        print(f"{tutor['email']} | {tutor['password']}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
'@

$sql = @'
UPDATE "users".profiles
SET location_name = CASE user_id
  WHEN 'c1b7f33a-2b9c-4c9e-8f70-111111111111' THEN 'El Poblado, Medellín'
  WHEN 'c1b7f33a-2b9c-4c9e-8f70-222222222222' THEN 'Laureles, Medellín'
  WHEN 'c1b7f33a-2b9c-4c9e-8f70-333333333333' THEN 'Belén Los Alpes, Medellín'
  WHEN 'c1b7f33a-2b9c-4c9e-8f70-444444444444' THEN 'Envigado, Área Metropolitana'
  WHEN '550e8400-e29b-41d4-a716-446655440005' THEN 'Robledo, Medellín'
  ELSE location_name
END,
updated_at = NOW()
WHERE user_id IN (
  'c1b7f33a-2b9c-4c9e-8f70-111111111111',
  'c1b7f33a-2b9c-4c9e-8f70-222222222222',
  'c1b7f33a-2b9c-4c9e-8f70-333333333333',
  'c1b7f33a-2b9c-4c9e-8f70-444444444444',
  '550e8400-e29b-41d4-a716-446655440005'
);

UPDATE "tutors".profiles
SET coordinates = CASE user_id
  WHEN 'c1b7f33a-2b9c-4c9e-8f70-111111111111' THEN ST_SetSRID(ST_MakePoint(-75.5715, 6.2060), 4326)
  WHEN 'c1b7f33a-2b9c-4c9e-8f70-222222222222' THEN ST_SetSRID(ST_MakePoint(-75.5965, 6.2430), 4326)
  WHEN 'c1b7f33a-2b9c-4c9e-8f70-333333333333' THEN ST_SetSRID(ST_MakePoint(-75.5998, 6.2145), 4326)
  WHEN 'c1b7f33a-2b9c-4c9e-8f70-444444444444' THEN ST_SetSRID(ST_MakePoint(-75.5842, 6.1838), 4326)
  WHEN '550e8400-e29b-41d4-a716-446655440005' THEN ST_SetSRID(ST_MakePoint(-75.5568, 6.2672), 4326)
  ELSE coordinates
END,
updated_at = NOW()
WHERE user_id IN (
  'c1b7f33a-2b9c-4c9e-8f70-111111111111',
  'c1b7f33a-2b9c-4c9e-8f70-222222222222',
  'c1b7f33a-2b9c-4c9e-8f70-333333333333',
  'c1b7f33a-2b9c-4c9e-8f70-444444444444',
  '550e8400-e29b-41d4-a716-446655440005'
);
'@

$py | docker compose exec -T auth-service python -
if ($LASTEXITCODE -ne 0) {
  throw "Failed to apply auth tutor accounts. Ensure Docker Desktop is running and auth-service is up."
}

$sql | docker compose exec -T -u postgres postgres psql -d ttp
if ($LASTEXITCODE -ne 0) {
  throw "Failed to apply tutor profile/location SQL changes. Ensure postgres service is up."
}

Write-Host "Applied real tutor auth accounts and Medellin coordinates."