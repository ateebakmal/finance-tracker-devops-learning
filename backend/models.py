from __future__ import annotations

# sqlalchemy imports
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import CheckConstraint, Column, Date, Index, Integer, String, Boolean, DateTime, ForeignKey, Table, Text, UniqueConstraint,func, text

# python imports
from datetime import date, datetime

# My imports
from constants import BUDGET_TYPE_VALUES, CATEGORY_TYPE_VALUES, FREQUENCY_VALUES, TAGS_TYPE_VALUES, TRANSACTION_TYPE_VALUES, sql_in
from database import Base


# TODO: category has field category_name while profile has name. Make all names across all tables consistent
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Nullable since Google is no longer the only way in: a password account has
    # no Google identity. Postgres counts NULLs as distinct, so any number of
    # password-only users sit happily under this unique index.
    google_sub: Mapped[str | None] = mapped_column(String, unique=True, default=None)

    # 254 is the RFC 5321 maximum. 50 was fine while every address came from
    # Google; now users type them by hand.
    email:Mapped[str] = mapped_column(String(254), unique=True)

    # Argon2 hash, NULL for Google-only accounts. Never the password itself.
    password_hash:Mapped[str | None] = mapped_column(String, default=None)

    setup_completed:Mapped[bool] = mapped_column(Boolean, server_default= "false")
    created_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    sessions:Mapped[list[Session]] = relationship(back_populates="user")
    profiles:Mapped[list[Profile]] = relationship(back_populates="user")

    __table_args__ = (
        # Every row must have at least one way to authenticate. Without this a
        # bug could leave an account nobody -- including its owner -- can reach.
        CheckConstraint(
            "google_sub IS NOT NULL OR password_hash IS NOT NULL",
            name="auth_method_present",
        ),
        # ateeb@x.com and Ateeb@X.com are the same account. Same idiom as the
        # category and tag name indexes below.
        Index("uq__users__email_lower", text("lower(email)"), unique=True),
    )

class Session(Base):
    __tablename__ = "sessions"

    id:Mapped[int] = mapped_column(primary_key=True)
    user_id:Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash:Mapped[str] = mapped_column(String, unique=True)
    expires_at:Mapped[datetime] = mapped_column(DateTime(timezone=True))
    device_info: Mapped[str | None] = mapped_column(String)   

    created_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    user: Mapped["User"] = relationship(back_populates="sessions")

    
class Profile(Base):

    __tablename__ = "profiles"
    
    id:Mapped[int] = mapped_column(primary_key=True)
    user_id:Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    name:Mapped[str] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="profiles")
    categories:Mapped[list[Category]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    tags:Mapped[list[Tag]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    transactions:Mapped[list[Transaction]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    budgets:Mapped[list[Budget]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    templates:Mapped[list[RecurringTransactionTemplate]] = relationship(back_populates="profile", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("user_id","name"),
        Index(None,"user_id")
        )
    
    
class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    profile_id:Mapped[int] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"))
    category_name:Mapped[str] = mapped_column(String(50))
    parent_id:Mapped[int | None] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"))

    type: Mapped[str] = mapped_column(String(25))

    created_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    profile:Mapped[Profile] = relationship(back_populates="categories")
    transactions:Mapped[list[Transaction]] = relationship(back_populates="category")
    
    # the two ends of the SAME self-referential link:
    parent: Mapped["Category | None"] = relationship(
        back_populates="children",
        remote_side="Category.id",
    )
    children: Mapped[list["Category"]] = relationship(
        back_populates="parent",
    )
    
    __table_args__ = (
        # UniqueConstraint("profile_id","category_name"),
        # category_name is compared lower
        # Index(
        #     "uq__categories__profile_id__type__category_name_lower",
        #     "profile_id",
        #     "type",
        #     text("lower(category_name)"),
        #     unique=True
        # ),
        Index(
            "uq__categories__profile_id__type__parent_id__category_nameLower",
            "profile_id",
            "type",
            "parent_id",
            text("lower(category_name)"),
            unique=True,
            postgresql_nulls_not_distinct=True
            ),
        Index(None, "parent_id"),
        CheckConstraint(sql_in("type",CATEGORY_TYPE_VALUES),name= "type")
    )


class Tag(Base):
    __tablename__ = "tags"

    id:Mapped[int] = mapped_column(primary_key=True)
    profile_id:Mapped[int] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"))
    name:Mapped[str] = mapped_column(String(25))

    type:Mapped[str] = mapped_column(String(25))
    created_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    profile:Mapped[Profile] = relationship(back_populates="tags")

    
    __table_args__ = (
        Index(
            "uq__tags__profile_id__type__name_lower",
            "profile_id",
            "type",
            text("lower(name)"),
            unique=True
        ),
        CheckConstraint(sql_in("type",TAGS_TYPE_VALUES),name="type")
    )




class Transaction(Base):
    __tablename__ = "transactions"

    id:Mapped[int] = mapped_column(primary_key=True)
    profile_id:Mapped[int] = mapped_column(ForeignKey("profiles.id",ondelete="CASCADE"))
    category_id:Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="RESTRICT"))
    
    description:Mapped[str | None] = mapped_column(String(50), default=None)
    amount:Mapped[int] = mapped_column(Integer)
    transaction_type:Mapped[str] = mapped_column(String(50))
    notes:Mapped[str | None] = mapped_column(Text)
    transaction_date:Mapped[Date] = mapped_column(Date)

    source_template_id:Mapped[int | None] = mapped_column(ForeignKey("recurring_transaction_templates.id", ondelete="RESTRICT"))
    # I have set it to restrict, because i dont want to allow delete templates if used. I will change later when i would need to

    created_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


    profile:Mapped[Profile] = relationship(back_populates="transactions")
    category:Mapped[Category] = relationship(back_populates="transactions")
    tags:Mapped[list[Tag]] = relationship(secondary="transaction_tags")
    source_template:Mapped[RecurringTransactionTemplate | None] = relationship(back_populates="transactions")

    __table_args__ = (
        CheckConstraint(sql_in("transaction_type", TRANSACTION_TYPE_VALUES),name="transaction_type"),
        CheckConstraint("amount > 0", name="amount_positive"),
        Index(None,"profile_id", "transaction_date"),
        Index(None, "profile_id","category_id","transaction_date")
    )
    

# Junction table between tags and transactions
transaction_tags = Table(
    "transaction_tags", 
    Base.metadata,
    Column("transaction_id", ForeignKey("transactions.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id",ForeignKey("tags.id", ondelete="CASCADE"),primary_key=True),
    Index(None, "tag_id")
    )

#Junction table between tags and recurring transactions
template_tags = Table(
    "template_tags",
    Base.metadata,
    Column("template_id", ForeignKey("recurring_transaction_templates.id", ondelete="CASCADE"),primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"),primary_key=True),
    Index(None,"tag_id")
    )


class Budget(Base):
    __tablename__ = "budgets"

    id:Mapped[int] = mapped_column(primary_key=True)
    profile_id:Mapped[int] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"))
    category_id:Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"))
    name:Mapped[str] = mapped_column(String(25))
    budget_limit :Mapped[int] = mapped_column(Integer)
    budget_type:Mapped[str] = mapped_column(String(50)) #'weekly' or 'monthly'

    created_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    profile:Mapped[Profile] = relationship(back_populates="budgets")
    category:Mapped[Category] = relationship()

    __table_args__ = (
        CheckConstraint(sql_in("budget_type", BUDGET_TYPE_VALUES),name="budget_type"),
        CheckConstraint("budget_limit  > 0", name="budget_limit_positive"),
        UniqueConstraint("profile_id", "category_id","budget_type")
    )

class RecurringTransactionTemplate(Base):
    __tablename__ = "recurring_transaction_templates"

    id:Mapped[int] = mapped_column(primary_key=True)
    profile_id:Mapped[int] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"))
    category_id:Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="RESTRICT"))
    
    name:Mapped[str] = mapped_column(String(25))
    amount:Mapped[int] = mapped_column(Integer)
    transaction_type:Mapped[str] = mapped_column(String(50))
    transaction_date:Mapped[date] = mapped_column(Date)
    frequency: Mapped[str | None] = mapped_column(String(25))
    note:Mapped[str | None] = mapped_column(Text)

    # note here is not to be set as note to the transaction but as a note that user can add to recurring transaction, like a description of what it is

    created_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    profile:Mapped[Profile] = relationship(back_populates="templates")
    category: Mapped["Category"] = relationship()
    tags: Mapped[list["Tag"]] = relationship(secondary=template_tags)
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="source_template")

    __table_args__ = (
        CheckConstraint("amount > 0", name="amount_positive"),
        CheckConstraint(sql_in("transaction_type", TRANSACTION_TYPE_VALUES), name="transaction_type"),
        CheckConstraint(f"frequency IS NULL OR {sql_in('frequency', FREQUENCY_VALUES)}", name="frequency"),
        Index(None, "profile_id"),
    )