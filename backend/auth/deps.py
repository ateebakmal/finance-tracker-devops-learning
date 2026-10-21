from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from sqlalchemy.ext.asyncio import AsyncSession

import jwt

from auth.utils import decode_access_token
from database import get_db
import models

bearer = HTTPBearer(auto_error=False)

async def get_current_user(
            creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
            db: Annotated[AsyncSession, Depends(get_db)]
        )-> models.User:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not Authenticated")
    
    try:
        payload = decode_access_token(creds.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token Expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED,"Token Invalid")
    
    user = await db.get(models.User, int(payload["sub"]))

    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    
    return user



async def get_current_profile(
        profile_id:int,
        user: Annotated[models.User, Depends(get_current_user)],
        db: Annotated[AsyncSession, Depends(get_db)]
        ):
    """
    This is a dependency function.
    This function should run only on api/profile/{profile_id} path requests
    
    Args:
        profile_id: Profile ID extracted from the url
        {'profiles/{profile_id}}

        user: Returned from dependency function
        
    Returns:
        The profile instance
    """

    # Check profile exists for that user.
    profile = await db.get(models.Profile, profile_id)

    if  profile is None or profile.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not found for user")
    
    return profile