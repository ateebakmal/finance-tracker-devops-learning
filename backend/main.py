
# TODO: All api endpoints should have similar type of response
# Uniform error envelope. Make validation errors, HTTPExceptions, and DB errors all return the same JSON shape ({"detail": ...} or {"error": {"code", "message"}}). Add a handler for RequestValidationError too so a 422 looks like your 409s.
# Log the real error, return a safe one. The global handler should log SQLSTATE + constraint + a request/correlation id server-side, and return only the friendly message. Don't leak raw SQL to clients.
# Correct status codes. 409 conflict/unique, 404 not-found/ownership, 400 bad input, 422 schema validation.
# Rollback discipline (already covered): global handler relies on get_db's async with to roll back; explicit try/except must call rollback() itself.

from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import APIRouter, Depends, FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.cors import CORSMiddleware

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from auth.deps import get_current_profile
from db_errors import classify_integrity_error
from database import engine, get_db

from auth.router import router as auth_router
from profiles.router import router as profiles_router
from categories.router import router as categories_router
from tags.router import router as tags_router
from transactions.router import router as transactions_router
from config import settings

@asynccontextmanager
async def lifespan(_app : FastAPI):
    # Startup: Do nothing - alembic already build the schema
    yield
    # Shutdown: close all pooled connections cleanly
    await engine.dispose()

app = FastAPI(title="Finance Tracker API", lifespan=lifespan)

app.add_middleware(
    SessionMiddleware, 
    secret_key = settings.session_secret,
    https_only = settings.cookie_secure,
    same_site = settings.cookie_samesite,
    max_age=300)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
    )

app.include_router(auth_router, prefix = "/api/auth")
app.include_router(profiles_router, prefix= "/api/profiles", tags=["profile"])

profile_prefixed_routes = APIRouter(prefix="/api/profiles/{profile_id}",dependencies=[Depends(get_current_profile)], tags=["profile_prefixed"])

profile_prefixed_routes.include_router(router= categories_router, prefix="/categories")
profile_prefixed_routes.include_router(router=tags_router, prefix="/tags")
profile_prefixed_routes.include_router(router=transactions_router, prefix="/transactions")

app.include_router(profile_prefixed_routes)
@app.get("/")
async def home():
    return "<h1>Finance Trackker</h1>"

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/db-health")
async def db_check(db:Annotated[AsyncSession, Depends(get_db)] ) -> dict[str, int | None]:
    """Proves the async engine can actually reach Neon and run a query."""
    result = await db.execute(text("SELECT 1"))
    return {"db": result.scalar()}

# Exception handler
@app.exception_handler(IntegrityError)
async def integrity_handler(request: Request, exc: IntegrityError):
    status_code, detail = classify_integrity_error(exc)
    return JSONResponse(status_code=status_code, content= {"detail": detail})

