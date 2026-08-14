import os

from passlib.context import CryptContext
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/ttp")
engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


PEOPLE = [
    {"id": "11111111-1111-4111-8111-111111111111", "email": "camila.rios@example.com", "password": "UserPass1!", "role": "student"},
    {"id": "22222222-2222-4222-8222-222222222222", "email": "andres.gomez@example.com", "password": "UserPass2!", "role": "student"},
    {"id": "33333333-3333-4333-8333-333333333333", "email": "laura.martinez@example.com", "password": "UserPass3!", "role": "student"},
    {"id": "44444444-4444-4444-8444-444444444444", "email": "felipe.uribe@example.com", "password": "UserPass4!", "role": "student"},
    {"id": "55555555-5555-4555-8555-555555555555", "email": "sofia.herrera@example.com", "password": "UserPass5!", "role": "student"},
    {"id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "email": "daniel.rojas@example.com", "password": "TutorPass1!", "role": "tutor"},
    {"id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "email": "mariana.torres@example.com", "password": "TutorPass2!", "role": "tutor"},
    {"id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc", "email": "julian.castano@example.com", "password": "TutorPass3!", "role": "tutor"},
    {"id": "dddddddd-dddd-4ddd-8ddd-dddddddddddd", "email": "valentina.pineda@example.com", "password": "TutorPass4!", "role": "tutor"},
    {"id": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", "email": "santiago.mejia@example.com", "password": "TutorPass5!", "role": "tutor"},
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
    async with SessionLocal() as session:
        for person in PEOPLE:
            await session.execute(
                SQL,
                {
                    "id": person["id"],
                    "email": person["email"],
                    "password_hash": get_password_hash(person["password"]),
                    "role": person["role"],
                },
            )
        await session.commit()

    print("Created/updated 10 auth accounts")
    for person in PEOPLE:
        print(f"{person['email']} | {person['password']} | {person['role']}")


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
