from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response,status
from fastapi.responses import RedirectResponse

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, func, select, inspect

# From auth module import oauth
from auth.oauth import oauth
from auth.password import hash_password, verify_password
from auth.utils import create_access_token, generate_refresh_token, hash_refresh_token
from auth.deps import get_current_user

from schemas import (
    AuthConfigResponse,
    AuthLoginRequest,
    AuthMeResponse,
    AuthRefreshAccessTokenResponse,
    AuthRegisterRequest,
)
from database import get_db
from config import settings
import models

import traceback
router = APIRouter()
REFRESH_COOKIE = "refresh_cookie"
# Helper functions might move into a new file
def set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        key = REFRESH_COOKIE,
        value = refresh_token,
        httponly=True,
        secure = settings.cookie_secure,
        samesite=settings.cookie_samesite,        
        max_age = settings.refresh_token_expire_days * 24 * 3600,
        path = "/api/auth"
    )

def issue_refresh_session(db: AsyncSession, user_id: int, request: Request) -> str:
    """Add a refresh session row and hand back the RAW token for the cookie.

    Only the sha256 hash is stored, so a database dump does not yield usable
    refresh tokens. Caller is responsible for the commit.

    NOTE: /google/callback still has its own inline copy of these lines. Left
    alone on purpose -- it is working OAuth code and this change was not worth
    touching it for. Worth folding in later.
    """
    refresh_token = generate_refresh_token()
    db.add(
        models.Session(
            user_id=user_id,
            token_hash=hash_refresh_token(refresh_token),
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.refresh_token_expire_days),
            device_info=request.headers.get("user-agent"),
        )
    )
    return refresh_token


@router.get("/config", response_model=AuthConfigResponse)
async def auth_config():
    """Which sign-in methods are available here.

    Fetched at runtime so the frontend can hide a button it cannot use,
    without needing a separate build per environment.
    """
    return {
        "google_enabled": settings.google_oauth_available,
        "password_enabled": settings.auth_password_enabled,
    }


@router.post(
    "/register",
    response_model=AuthRefreshAccessTokenResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
        payload: AuthRegisterRequest,
        request: Request,
        response: Response,
        db: Annotated[AsyncSession, Depends(get_db)]
    ):
    if not settings.auth_password_enabled:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Password sign-up is disabled")

    email = payload.email.lower()

    # Case-insensitive, matching the uq__users__email_lower index. Without that
    # index this lookup could find two rows and scalar_one_or_none() would blow
    # up with MultipleResultsFound.
    result = await db.execute(
        select(models.User).where(func.lower(models.User.email) == email)
    )
    existing = result.scalar_one_or_none()

    if existing is not None:
        if existing.password_hash is None:
            # Point them at the door they actually came through. We deliberately
            # do NOT attach a password to the existing account here: anyone who
            # knew the email could otherwise take over a Google account.
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "This email is registered with Google. Continue with Google instead.",
            )
        raise HTTPException(
            status.HTTP_409_CONFLICT, "An account with this email already exists"
        )

    user = models.User(email=email, password_hash=await hash_password(payload.password))
    db.add(user)
    await db.flush()   # assigns user.id, needed for the session row below

    refresh_token = issue_refresh_session(db, user.id, request)
    await db.commit()

    set_refresh_cookie(response, refresh_token)
    return {"access_token": create_access_token(user.id), "token_type": "bearer"}


@router.post("/login", response_model=AuthRefreshAccessTokenResponse)
async def login(
        payload: AuthLoginRequest,
        request: Request,
        response: Response,
        db: Annotated[AsyncSession, Depends(get_db)]
    ):
    if not settings.auth_password_enabled:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Password sign-in is disabled")

    result = await db.execute(
        select(models.User).where(func.lower(models.User.email) == payload.email.lower())
    )
    user = result.scalar_one_or_none()

    # Run the verify even when there is no user: verify_password falls back to a
    # dummy hash, so "no such account" and "wrong password" take the same time.
    password_ok = await verify_password(
        user.password_hash if user else None, payload.password
    )

    if user is None or not password_ok:
        # One message for every failure. Never reveal which half was wrong, or
        # whether the address has an account at all.
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    refresh_token = issue_refresh_session(db, user.id, request)
    await db.commit()

    set_refresh_cookie(response, refresh_token)
    return {"access_token": create_access_token(user.id), "token_type": "bearer"}


@router.get("/google/login")
async def google_login(request: Request):
    """Step 1: bounce the browser to Google. Authlib generates & stores `state`."""
    if not settings.google_oauth_available:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Google sign-in is disabled")
    return await oauth.google.authorize_redirect(request, settings.google_redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db : Annotated[AsyncSession, Depends(get_db)]):
    if not settings.google_oauth_available:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Google sign-in is disabled")

    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Google authentication failed")
    
    claims = token["userinfo"]

    google_sub,email = claims["sub"], claims["email"]

    
    # TODO: Might need to move these database functions into seperate functions
    # 1. Get or create user
    result = await db.execute(select(models.User).where(models.User.google_sub == google_sub))
    user = result.scalar_one_or_none()

    # 1.1 If user doesnt exist with this sub create one
    if user is None:
        user = models.User(google_sub = google_sub, email = email)
        db.add(user)
        await db.flush()
    
    # Now either we have user that already existed or newly created user
    # return {c.key: getattr(user, c.key) for c in inspect(user).mapper.column_attrs}

    # 2. Create refresh token in the database
    refresh_token = generate_refresh_token()
    refresh_token_hash = hash_refresh_token(refresh_token)

    session = models.Session(
        user_id = user.id,
        token_hash = refresh_token_hash,
        expires_at = datetime.now(timezone.utc) + timedelta(days = settings.refresh_token_expire_days),
        device_info = request.headers.get("user-agent")
    )
    db.add(session)

    #now session and user are added into db.

    await db.commit()

    response = RedirectResponse(url= f"{settings.frontend_url}/dashboard")
    set_refresh_cookie(response, refresh_token)

    return response

@router.post("/refresh", response_model=AuthRefreshAccessTokenResponse)
async def refresh(
        request : Request,
        response : Response,
        db: Annotated[AsyncSession, Depends(get_db)]
    ):
    print(request.cookies)
    refresh_token = request.cookies.get(REFRESH_COOKIE)
    

    # If there is no refresh cookie we reject the request
    if not refresh_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED,"No refresh token")
    
    # If there is refresh token
    # Validate it. If it is valid create access_token and return it

    result = await db.execute(
                    select(models.Session)
                    .where(models.Session.token_hash == hash_refresh_token(refresh_token))    
                )
    
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED,"No Refresh Found")
    
    if session.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token expired")
    
    # We now session is valid.
    # We create new refresh token

    new_refresh_token = generate_refresh_token()
    # Update refresh token since old one is used
    session.token_hash = hash_refresh_token(new_refresh_token)
    session.expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)

    await db.commit()
    # Set new refresh token to the cookie
    set_refresh_cookie(response, new_refresh_token)

    
    # Return new access token
    return {
        "access_token" : create_access_token(session.user_id),
        "token_type" : "bearer"
    }
    
@router.get("/me", response_model=AuthMeResponse)
async def get_me(
        current_user : Annotated[models.User, Depends(get_current_user)],
        db: Annotated[AsyncSession, Depends(get_db)]
    ):
    # Get profiles for this user
    result = await db.execute(
        select(models.Profile)
        .where(models.Profile.user_id == current_user.id)
        )
    profiles = result.scalars().all()
    return {
        "id" : current_user.id,
        "email" : current_user.email,
        "setup_completed": current_user.setup_completed,
        "profiles" : profiles
    }


@router.post("/logout")
async def logout(request: Request, db:Annotated[AsyncSession, Depends(get_db)]):
    refresh_token = request.cookies.get(REFRESH_COOKIE)

    if refresh_token:
        await db.execute(
            delete(models.Session).where(models.Session.token_hash == hash_refresh_token(refresh_token))
            )
        
        await db.commit()

    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    response.delete_cookie(REFRESH_COOKIE,path="/api/auth")
    return response
    