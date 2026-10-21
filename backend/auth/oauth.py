from authlib.integrations.starlette_client import OAuth
from config import settings

oauth = OAuth()

# Only registered when the credentials exist. Without this guard Authlib would
# happily register a client with client_id=None and fail later, mid-redirect,
# with something unreadable.
if settings.google_oauth_available:
    oauth.register(
        name="google",
        client_id = settings.google_client_id,
        client_secret = settings.google_client_secret,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"}
        )