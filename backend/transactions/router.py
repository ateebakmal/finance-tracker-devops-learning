
from datetime import datetime, timezone, date
import profile
from types import new_class
from typing import Annotated
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status

from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from schemas import TransactionCreate, TransactionResponse, TransactionSummaryResponse, TransactionUpdate
import models
from database import get_db


router = APIRouter(tags=["transactions"])

# TODO: Maybe add a limit to transactions + pagination
#TODO: We reuse checking category and tags in post and patch. Might refactor later
@router.get("",response_model=list[TransactionResponse])
async def get_transactions(
    profile_id: int, 
    db:Annotated[AsyncSession, Depends(get_db)],
    date_from : Annotated[date | None, Query()] = None,
    date_to : Annotated[date | None, Query()] = None, 
    limit : Annotated[int | None, Query()] = None
    ):
    # Validation of date filters
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "'from' must be on or before 'to'")

    today = datetime.now(ZoneInfo("Asia/Karachi")).date()
    month_start = today.replace(day=1)

    
    stmt = select(models.Transaction).where(
        models.Transaction.profile_id == profile_id
    ).options(
        selectinload(models.Transaction.category),
        selectinload(models.Transaction.tags),
        )

    if limit:
        stmt = stmt.limit(limit)
    #Default range: This month, only when client doesnt specify both from and to
    # This only runs when both are None so we default to current month.
    # If any one is specified that means the other bound doesnt exist so only one conditional
    if date_from is None and date_to is None:
        date_from = month_start
        date_to = today
    

    if date_from is not None:
        stmt = stmt.where(models.Transaction.transaction_date >= date_from)

    if date_to is not None:
        stmt = stmt.where(models.Transaction.transaction_date <= date_to)

    # Order by date
    stmt = stmt.order_by(models.Transaction.transaction_date.desc(), models.Transaction.created_at.desc())

    result = await db.execute(stmt)
    return result.scalars().all()


    

@router.post("",response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    profile_id:int,
    transaction: TransactionCreate,
    db:Annotated[AsyncSession, Depends(get_db)]
    ):
    #We get category_id that we have to validate that it belongs to this user
    #We get tag_ids list that we have to validate that all tag belonds to this user
    # Then we insert the transaction
    
    # 1. Check weather this category_id exists and belong to the user
    category = await db.get(models.Category, transaction.category_id)
    if category is None or category.profile_id != profile_id or category.type != transaction.transaction_type:
        print([category.profile_id, category.type] if category else "Category doesnt exist" )
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid Category for this profile")
    
    tags = []

    if transaction.tag_ids:
        # 2. Check all tags belong to this user
        tags =  (
                await (db.scalars(
                                select(models.Tag)
                                .where(
                                    models.Tag.id.in_(transaction.tag_ids),
                                    models.Tag.profile_id == profile_id,
                                    models.Tag.type == transaction.transaction_type
                                )
                                ))
                ).all()

        
        valid_tag_ids = {tag.id for tag in tags}

        if valid_tag_ids != set(transaction.tag_ids):
            raise HTTPException(status.HTTP_400_BAD_REQUEST,"Invalid tag_ids for this profile")
        
    # Insert transaction without tags into Transaction

    new_transaction = models.Transaction(
        profile_id=profile_id,
        category_id = transaction.category_id,
        amount= transaction.amount,
        transaction_date= transaction.transaction_date,
        transaction_type = transaction.transaction_type,
        notes = transaction.notes,
        tags = tags,
        description=transaction.description
    )

    db.add(new_transaction)
    await db.commit()
    await db.refresh(new_transaction, attribute_names=["tags", "category"])
    return new_transaction
    
@router.get("/summary", response_model=TransactionSummaryResponse)
async def get_summary(profile_id : int, db: Annotated[AsyncSession, Depends(get_db)]):

    today = datetime.now(ZoneInfo("Asia/Karachi")).date()
    month_start = today.replace(day=1)

    row = (await db.execute(
        select(
            func.coalesce(
                func.sum(models.Transaction.amount)
                    .filter(models.Transaction.transaction_type == "income"), 0
            ).label("income"),
            func.coalesce(
                func.sum(models.Transaction.amount)
                    .filter(models.Transaction.transaction_type == "expense"), 0
            ).label("expense"),
        ).where(
            models.Transaction.profile_id == profile_id,
            models.Transaction.transaction_date >= month_start,
            models.Transaction.transaction_date <= today,
        )
    )).one()

    return {
        "income": row.income,
        "expense": row.expense,
        "balance": row.income - row.expense
    }

@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(profile_id: int, transaction_id : int, db: Annotated[AsyncSession, Depends(get_db)]):
    transaction = await db.scalar(
        select(models.Transaction)
        .where(models.Transaction.id == transaction_id)
        .options(
            selectinload(models.Transaction.category), 
            selectinload(models.Transaction.tags)
        )
    )

    if transaction is None or transaction.profile_id != profile_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    return transaction

@router.patch("/{transaction_id}", response_model=TransactionResponse, status_code=status.HTTP_200_OK)
async def update_transaction(transaction_id : int, profile_id : int,transaction_update: TransactionUpdate, db:Annotated[AsyncSession, Depends(get_db)]):
    # Check transaction exists and belong to the user.
    print(transaction_update)
    transaction = await db.get(
    models.Transaction,
    transaction_id,
    options=[
        selectinload(models.Transaction.tags),      # so `transaction.tags = ...` won't lazy-load
        selectinload(models.Transaction.category),  # (also nice for the response)
    ],
)

    if  transaction is None or transaction.profile_id != profile_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Transaction not found")

    update_data = transaction_update.model_dump(exclude_unset=True)

    # type after this patch (may be changing)
    new_type = update_data.get("transaction_type", transaction.transaction_type)
    
    # Need to check tags and categories belong to this user
    if "category_id" in update_data:
        category = await db.get(models.Category, update_data["category_id"])
        if category is None or category.profile_id != profile_id or category.type != new_type:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid Category for this profile")

    
    if "tag_ids" in update_data:
        # 2. Check all tags belong to this user
        tag_ids = update_data.pop("tag_ids")
        tags =  (
                await (db.scalars(
                                select(models.Tag)
                                .where(
                                    models.Tag.id.in_(tag_ids),
                                    models.Tag.profile_id == profile_id,
                                    models.Tag.type == new_type
                                )
                                ))
                ).all()

        
        valid_tag_ids = {tag.id for tag in tags}

        if valid_tag_ids != set(tag_ids):
            raise HTTPException(status.HTTP_400_BAD_REQUEST,"Invalid tag_ids for this profile")

        transaction.tags = list(tags)

    for field, value in update_data.items():
        setattr(transaction, field,value)

    await db.commit()
    await db.refresh(transaction, attribute_names=["category", "tags"])

    return transaction
    

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(transaction_id :int, profile_id : int, db: Annotated[AsyncSession, Depends(get_db)]):
    # Check transaction exists and belong to the user.
    transaction = await db.get(models.Transaction, transaction_id)

    if  transaction is None or transaction.profile_id != profile_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Transaction not found")

    await db.delete(transaction)
    await db.commit()


