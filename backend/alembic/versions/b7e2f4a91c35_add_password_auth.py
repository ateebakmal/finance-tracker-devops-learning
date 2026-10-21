"""add password auth: nullable google_sub, password_hash, case-insensitive email

Revision ID: b7e2f4a91c35
Revises: dac077754462
Create Date: 2026-10-10

Hand-written rather than --autogenerate, because autogenerate has to connect
to a live database and diff against it -- which at the time of writing would
have been the production Neon instance.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7e2f4a91c35'
down_revision: Union[str, Sequence[str], None] = 'dac077754462'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Google is no longer the only way in, so an account may legitimately have
    # no google_sub. The unique index survives: Postgres treats NULLs as
    # distinct by default, so any number of password-only rows are fine.
    op.alter_column('users', 'google_sub',
                    existing_type=sa.String(),
                    nullable=True)

    # Argon2 output is ~95 chars today but the format carries its own
    # parameters and will grow, so leave it unbounded.
    op.add_column('users', sa.Column('password_hash', sa.String(), nullable=True))

    # 50 was fine for Google-supplied addresses. Users now type these in, and
    # RFC 5321 allows 254. Widening a varchar can never fail on existing data.
    op.alter_column('users', 'email',
                    existing_type=sa.String(50),
                    type_=sa.String(254),
                    existing_nullable=False)

    # Belt and braces: no row may exist with neither sign-in method.
    op.create_check_constraint(
        op.f('ck__users__auth_method_present'),
        'users',
        'google_sub IS NOT NULL OR password_hash IS NOT NULL',
    )

    # ateeb@x.com and Ateeb@X.com must be one account. The register/login
    # queries use lower(email), and this index is what keeps that lookup from
    # ever matching two rows. Same idiom as the category and tag name indexes.
    op.create_index(
        'uq__users__email_lower',
        'users',
        [sa.literal_column('lower(email)')],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index('uq__users__email_lower', table_name='users')
    op.drop_constraint(op.f('ck__users__auth_method_present'), 'users', type_='check')
    op.alter_column('users', 'email',
                    existing_type=sa.String(254),
                    type_=sa.String(50),
                    existing_nullable=False)
    op.drop_column('users', 'password_hash')
    # Only succeeds while every remaining row still has a google_sub -- i.e. no
    # password-only account was ever created. That is the correct behaviour:
    # failing loudly beats silently deleting someone's account.
    op.alter_column('users', 'google_sub',
                    existing_type=sa.String(),
                    nullable=False)
