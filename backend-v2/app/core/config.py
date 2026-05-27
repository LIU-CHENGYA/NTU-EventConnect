from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_SECRET = "change-me-in-prod"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENV: str = "dev"  # "dev" | "prod"
    DATABASE_URL: str = "sqlite:///./dev.db"
    JWT_SECRET: str = _DEFAULT_SECRET
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177"
    GOOGLE_CLIENT_ID: str = ""
    # Gmail SMTP — set these in .env to enable password-reset emails.
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""        # your Gmail address
    SMTP_PASSWORD: str = ""    # Gmail App Password (not your login password)
    SMTP_FROM: str = ""        # defaults to SMTP_USER when blank
    FRONTEND_URL: str = "http://localhost:5173"
    # Admin whitelist: emails listed here are admins (the only users allowed to
    # create events). Source of truth is a committed file, not the DB column.
    # See app/core/admin.py.
    ADMIN_WHITELIST_FILE: str = "admin_whitelist.txt"
    ADMIN_WHITELIST: str = ""  # optional inline comma/newline list (extends the file)

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()

# Refuse to boot with a default/empty JWT secret outside of dev — prevents
# accidentally shipping a guessable (or unset `${JWT_SECRET}` → empty) signing
# key to staging/prod.
if settings.ENV != "dev" and (
    settings.JWT_SECRET == _DEFAULT_SECRET or not settings.JWT_SECRET.strip()
):
    raise RuntimeError(
        "JWT_SECRET is unset or using the default placeholder; set a strong "
        "secret via environment variable before running outside ENV=dev."
    )
