import select
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException,status, Response

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError


from auth.deps import get_current_user
from schemas import TagCreate, TagResponse, TagUpdate
import models
from database import get_db


router = APIRouter(tags=["tags"])

@router.get("", response_model=list[TagResponse])
async def get_tags(
    profile_id:int,
    db: Annotated[AsyncSession, Depends(get_db)]
    ):
    tags = await db.scalars(select(models.Tag).where(models.Tag.profile_id == profile_id))
    return tags 

@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    profile_id: int, 
    tag: TagCreate, 
    db: Annotated[AsyncSession, Depends(get_db)]):
    new_tag = models.Tag(name= tag.name,profile_id= profile_id, type = tag.type)

    try:
        db.add(new_tag)
        await db.commit()
        await db.refresh(new_tag)

    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, f"You already have tag with this name for {tag.type}")

    return new_tag

@router.patch("/{tag_id}", response_model= TagResponse)
async def edit_tag(
    tag_id:int, 
    profile_id: int,
    tag_update: TagUpdate, 
    db:Annotated[AsyncSession, Depends(get_db)]):
    """We are just allowing a rename function, take a look at schemas for more detail about other operations"""

    tag = await db.get(models.Tag, tag_id)
    if tag is None or tag.profile_id != profile_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "Tag not found")

    tag.name = tag_update.name

    await db.commit()
    await db.refresh(tag)
    return tag

@router.delete("/{tag_id}")
async def delete_tag(
    profile_id:int, 
    tag_id: int, 
    db: Annotated[AsyncSession, Depends(get_db)]):
    
    # Check if this tag belongs to the user

    result = await db.scalar(
            select(models.Tag)
            .where(models.Tag.id == tag_id , models.Category.profile_id == profile_id)
        )

    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tag not found")

    # This belongs to the user so delete it.

    try:
        await db.delete(result)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Cannot delete category that still has transactions")

    return Response(status_code=status.HTTP_204_NO_CONTENT)