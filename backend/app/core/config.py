from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_SECRET = "change-me-in-prod"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENV: str = "dev"  # "dev" | "prod"
    DATABASE_URL: str = "sqlite:///./dev.db"
    JWT_SECRET: str = _DEFAULT_SECRET
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7
    CORS_ORIGINS: str = "http://localhost:5173"
    GOOGLE_CLIENT_ID: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()

# Refuse to boot with the default JWT secret outside of dev — prevents
# accidentally shipping a guessable signing key to staging/prod.
if settings.ENV != "dev" and settings.JWT_SECRET == _DEFAULT_SECRET:
    raise RuntimeError(
        "JWT_SECRET is using the default placeholder; set a strong secret "
        "via environment variable before running outside ENV=dev."
    )
