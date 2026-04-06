"""Application configuration via environment variables."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgrespassword@localhost:5432/badminton_scorer"
    app_version: str = "0.1.0"

    class Config:
        env_file = ".env"


settings = Settings()
