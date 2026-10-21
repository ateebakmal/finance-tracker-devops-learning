from typing import Annotated

from fastapi import APIRouter, Depends

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import get_current_user
from database import get_db
import models
from schemas import ProfileCreate

router = APIRouter()

@router.post("")
async def post_profile(
    profile: ProfileCreate,
    user: Annotated[models.User, Depends(get_current_user)],
    db : Annotated[AsyncSession, Depends(get_db)]
    ):
    new_profile = models.Profile(name=profile.name, user_id = user.id)

    db.add(new_profile)
    await db.commit()
    await db.refresh(new_profile)

    return {
        "id": new_profile.id,
        "name": new_profile.name
    }

    