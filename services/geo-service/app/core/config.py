from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Geo Service"
    NOMINATIM_USER_AGENT: str = "TutoringPlatform/1.0"
    JWT_SECRET: str = "supersecret_jwt_key_that_should_be_changed_in_prod" # Need secret to test auth guard
    JWT_ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"

settings = Settings()