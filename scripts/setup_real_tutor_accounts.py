from sqlalchemy import text
from app.database import AsyncSessionLocal
from app.security import get_password_hash

TUTORS = [
    {
        "id": "c1b7f33a-2b9c-4c9e-8f70-111111111111",
        "email": "david.ramirez.lopez@gmail.com",
        "password": "TutorPass1!",
        "role": "tutor",
    },
    {
        "id": "c1b7f33a-2b9c-4c9e-8f70-222222222222",
        "email": "isabella.garcia.martinez@gmail.com",
        "password": "TutorPass2!",
        "role": "tutor",
    },
    {
        "id": "c1b7f33a-2b9c-4c9e-8f70-333333333333",
        "email": "carlos.vega.med@gmail.com",
        "password": "TutorPass3!",
        "role": "tutor",
    },
    {
        "id": "c1b7f33a-2b9c-4c9e-8f70-444444444444",
        "email": "martina.rodriguez.acevedo@gmail.com",
        "password": "TutorPass4!",
        "role": "tutor",
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440005",
        "email": "sebastian.morales.londono@gmail.com",
        "password": "TutorPass5!",
        "role": "tutor",
    },
]

SQL = text(
    """
    INSERT INTO auth.users (id, email, password_hash, role, is_active)
    VALUES (:id, :email, :password_hash, :role, TRUE)
    ON CONFLICT (email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      is_active = TRUE
    """
)

async def main() -> None:
    async with AsyncSessionLocal() as session:
        for tutor in TUTORS:
            await session.execute(
                SQL,
                {
                    "id": tutor["id"],
                    "email": tutor["email"],
                    "password_hash": get_password_hash(tutor["password"]),
                    "role": tutor["role"],
                },
            )
        await session.commit()

    print("Created/updated 5 real tutor auth accounts")
    for tutor in TUTORS:
        print(f"{tutor['email']} | {tutor['password']}")


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
