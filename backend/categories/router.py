
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response,status

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select

from auth.deps import get_current_user
from database import get_db
import models
from schemas import CategoryCreate, CategoryResponse, CategoryUpdate

# Note that: All these routes here are prefixed with "/api/profiles/{profile_id}"
# So all routes will have access to profile_id

router = APIRouter(tags=["Categories"])

@router.get("", response_model=list[CategoryResponse])
async def get_all_categories(
    profile_id: int,
    user: Annotated[models.User, Depends(get_current_user)],
    db : Annotated[AsyncSession, Depends(get_db)]
    ):

    result = await db.execute(
        select(models.Category)
        .where(models.Category.profile_id == profile_id)
        )
    
    categories = result.scalars().all()

    return categories

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    profile_id: int,
    category: CategoryCreate,
    db: Annotated[AsyncSession, Depends(get_db)]
    ):

    # Check parent category belongs to this user.
    if category.parent_id:
        existing = await db.scalar(
                        select(models.Category)
                        .where(models.Category.id == category.parent_id,models.Category.profile_id == profile_id)
                        )
        if existing is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid parent id")
            
    new_category = models.Category(
        profile_id = profile_id,
        category_name = category.category_name, 
        parent_id = category.parent_id,
        type = category.type
        )

    try:
        db.add(new_category)
        await db.commit()

        await db.refresh(new_category)
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "You already have a category with this name")
    
    return new_category

@router.patch("/{category_id}", response_model= CategoryResponse)
async def edit_category(
    category_id:int, 
    profile_id,
    category_update: CategoryUpdate, 
    db:Annotated[AsyncSession, Depends(get_db)]):
    """We are just allowing a rename function, take a look at schemas for more detail about other operations"""

    category = await db.get(models.Category, category_id)

    if category is None or category.profile_id != profile_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail = "Category not found")

    category.category_name = category_update.category_name

    await db.commit()
    await db.refresh(category)
    return category



@router.delete("/{category_id}")
async def delete_category(
    profile_id:int, 
    category_id: int, 
    db: Annotated[AsyncSession, Depends(get_db)]):
    
    # Check if this category belongs to the user

    result = await db.scalar(
            select(models.Category)
            .where(models.Category.id == category_id , models.Category.profile_id == profile_id)
        )

    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")

    # This belongs to the user so delete it.

    try:
        await db.delete(result)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Cannot delete category that still has transactions")

    return Response(status_code=status.HTTP_204_NO_CONTENT)

    
