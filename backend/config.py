"""Application settings, loaded from environment variables / the .env file.

Using pydantic-settings means: never hard-code secrets, and every value is
type-validated at startup (a missing DATABASE_URL fails loudly, immediately).
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
# TODO: Do i need to change str with SecretStr for import things
from pydantic import SecretStr


class Settings(BaseSettings):
    # Reads from a local .env file; ignores any env vars we don't declare here.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str          # postgresql+asyncpg://user:pass@host/dbname
    db_ssl: str | None = None   # "require" for Neon; None/blank for local Postgres
    db_echo: bool = False       # if True, SQLAlchemy prints every SQL statement

    # Optional on purpose. The assignment deployment runs with no Google
    # credentials at all -- the production app's credentials must not leave
    # production. Leave these unset and the Google routes switch themselves
    # off; see `google_oauth_available` below.
    google_client_id: str | None = None
    google_client_secret: str | None = None
    google_redirect_uri: str | None = None

    # The canonical frontend address. Used for the post-OAuth redirect, and
    # always allowed as a CORS origin.
    frontend_url: str

    # Additional browser origins allowed to call this API, comma-separated.
    # CORS compares origins as exact strings, so "localhost" and "127.0.0.1"
    # and each port are all distinct. Listing extras here lets `npm run dev`
    # (127.0.0.1:5173) and a containerised frontend (localhost:3000) both work
    # without restarting the backend between them.
    cors_extra_origins: str = ""

    
    session_secret:str
    jwt_secret:str
    algorithm: str = "HS256"

    refresh_token_expire_days:int
    access_token_expire_minutes:int

    cookie_secure:bool = False
    cookie_samesite:str = "lax"

    # Which sign-in methods this deployment offers. Served to the frontend at
    # runtime by GET /api/auth/config, so one frontend build works everywhere:
    # EC2 can switch Google off (Google rejects http:// and bare-IP redirect
    # URIs) without rebuilding the image.
    auth_google_enabled: bool = True
    auth_password_enabled: bool = True

    @property
    def cors_origins(self) -> list[str]:
        extra = [o.strip() for o in self.cors_extra_origins.split(",") if o.strip()]
        # dict.fromkeys de-duplicates while preserving order.
        return list(dict.fromkeys([self.frontend_url, *extra]))

    @property
    def google_oauth_available(self) -> bool:
        """Google sign-in is only offered when it could actually work.

        Derived rather than configured, so there is no way to end up with the
        button showing and the credentials missing. Omitting the three GOOGLE_*
        vars is all it takes to turn the feature off.
        """
        return bool(
            self.auth_google_enabled
            and self.google_client_id
            and self.google_client_secret
            and self.google_redirect_uri
        )

# One shared instance imported everywhere: `from config import settings`
# NOTE the () — you must *instantiate* the class, not just reference it.
settings = Settings() #type: ignore[] #Loaded from .env files
