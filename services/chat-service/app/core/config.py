from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Chat Service"
    DATABASE_URL: str
    REDIS_URL: str = "redis://ttp-redis:6379/1"  # Database 1 for chat pub/sub
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"

settings = Settings()