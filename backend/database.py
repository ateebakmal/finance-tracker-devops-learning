from sqlalchemy import MetaData, UniqueConstraint
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from config import settings

# Neon requires TLS. A stock Postgres container does not offer it at all, so
# the old hard-coded `ssl: True` made a local database impossible to reach --
# asyncpg would refuse the connection outright.
#
# DB_SSL is now the switch, which is what config.py always claimed it was:
#   DB_SSL=require   -> Neon
#   DB_SSL=          -> local container (asyncpg defaults to "prefer", which
#                       negotiates TLS when offered and plaintext when not)
connect_args: dict = {
    # Neon's connection pooler cannot cache prepared statements. A no-op
    # everywhere else, so it stays unconditional.
    "statement_cache_size": 0,
}

if settings.db_ssl:
    connect_args["ssl"] = settings.db_ssl

engine = create_async_engine(
    settings.database_url,
    echo = settings.db_echo,
    connect_args = connect_args,
    pool_pre_ping = True,
    pool_recycle = 300
    )

AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

def all_column_names(constraint,table):
    return "__".join(col.name for col in constraint.columns)

NAMING_CONVENTION = {
    "all_column_names": all_column_names,
    "ix": "ix__%(table_name)s__%(all_column_names)s",             # index
    "uq": "uq__%(table_name)s__%(all_column_names)s",             # unique constraint
    "ck": "ck__%(table_name)s__%(constraint_name)s",           # check constraint
    "fk": "fk__%(table_name)s__%(column_0_name)s__%(referred_table_name)s",  # foreign key
    "pk": "pk__%(table_name)s",                               # primary key
}

class Base(DeclarativeBase):
    metadata = MetaData(naming_convention= NAMING_CONVENTION)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
