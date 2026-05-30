from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Media Service"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@ttp-postgres:5432/ttp"
    JWT_SECRET: str = "supersecret_jwt_key_that_should_be_changed_in_prod"
    JWT_ALGORITHM: str = "HS256"
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()