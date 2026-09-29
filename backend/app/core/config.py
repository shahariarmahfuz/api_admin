import json
from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    PROJECT_NAME: str = "Orvia API Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://neondb_owner:npg_3NipAYdnRVK7@ep-floral-morning-b3928gk2-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
    )
    DB_POOL_SIZE: int = 15
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str):
            # Convert postgresql:// to postgresql+psycopg:// for SQLAlchemy 2.x async psycopg3
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql+psycopg://", 1)
            elif v.startswith("postgresql://") and not v.startswith("postgresql+"):
                v = v.replace("postgresql://", "postgresql+psycopg://", 1)
            # Remove channel_binding parameter if psycopg complains or keep sslmode=require
            if "channel_binding=" in v:
                # remove channel_binding for clean pooler compatibility
                parts = v.split("?")
                base = parts[0]
                params = [p for p in parts[1].split("&") if not p.startswith("channel_binding=")]
                v = f"{base}?{'&'.join(params)}" if params else base
        return v

    # Redis (Optional)
    REDIS_URL: str = ""
    REDIS_MAX_CONNECTIONS: int = 20

    # Security & JWT
    JWT_SECRET: str = "orvia_jwt_secure_secret_prod_grade_9f83acb14e27da6c88e"
    API_SECRET: str = "orvia_internal_api_secret_key_production_39a8c17b5f"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Rate Limiting Defaults
    DEFAULT_RATE_LIMIT_PER_MINUTE: int = 60
    DEFAULT_RATE_LIMIT_BURST: int = 100

    # Initial Admin Bootstrap
    ADMIN_DEFAULT_EMAIL: str = "admin@orvia.dev"
    ADMIN_DEFAULT_PASSWORD: str = "OrviaAdmin2026!"
    ADMIN_DEFAULT_NAME: str = "Orvia Administrator"

    PORT: int = 8000


settings = Settings()
