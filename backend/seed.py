"""Demo data for the deployed environments.

Run it against whichever database DATABASE_URL points at:

    docker run --rm -i \
      -e DATABASE_URL=... -e DB_SSL=require ... \
      USER/finance-backend:1.0.0 python - < seed.py

Idempotent: it checks for the demo user and exits if the data is already
there, so running it twice is harmless.

Deliberately NOT an Alembic migration -- migrations are schema history and
would carry this demo data into every environment forever.
"""

import asyncio
from datetime import date

from sqlalchemy import select

from database import AsyncSessionLocal
from auth.password import hash_password
import models

EMAIL = "demo@financetracker.app"
PASSWORD = "DemoPass123!"

# (type, category, [(day_of_month, amount_in_rupees, description)])
PROFILES = {
    "Personal": [
        ("income",  "Salary",      [(1, 185000, "Monthly salary")]),
        ("income",  "Freelance",   [(6, 42000, "Logo design project")]),
        ("expense", "Groceries",   [(2, 8450, "Imtiaz Super Market"), (7, 6230, "Al-Fatah")]),
        ("expense", "Transport",   [(3, 3200, "Fuel"), (8, 1500, "Careem rides")]),
        ("expense", "Dining",      [(4, 2650, "Dinner out"), (9, 1890, "Coffee")]),
        ("expense", "Utilities",   [(5, 14200, "Electricity bill"), (10, 3600, "Internet")]),
    ],
    "Household": [
        ("income",  "Rental income", [(2, 65000, "Upper portion rent")]),
        ("expense", "Rent",          [(1, 45000, "Monthly rent")]),
        ("expense", "Maintenance",   [(6, 9800, "Plumbing repair"), (9, 4500, "Paint touch-up")]),
        ("expense", "Groceries",     [(3, 11200, "Monthly stock-up")]),
    ],
}

TAGS = [("expense", "essential"), ("expense", "recurring"), ("income", "primary")]


async def main() -> None:
    today = date.today()

    async with AsyncSessionLocal() as db:
        if await db.scalar(select(models.User).where(models.User.email == EMAIL)):
            print("Seed already present - nothing to do.")
            return

        user = models.User(
            email=EMAIL,
            password_hash=await hash_password(PASSWORD),
            setup_completed=True,
        )
        db.add(user)
        await db.flush()

        n_tx = 0
        for profile_name, rows in PROFILES.items():
            profile = models.Profile(user_id=user.id, name=profile_name)
            db.add(profile)
            await db.flush()

            tags = {}
            for tag_type, tag_name in TAGS:
                tag = models.Tag(profile_id=profile.id, name=tag_name, type=tag_type)
                db.add(tag)
                tags[tag_name] = tag
            await db.flush()

            for cat_type, cat_name, entries in rows:
                category = models.Category(
                    profile_id=profile.id, category_name=cat_name, type=cat_type
                )
                db.add(category)
                await db.flush()

                for day, amount, description in entries:
                    transaction = models.Transaction(
                        profile_id=profile.id,
                        category_id=category.id,
                        amount=amount,
                        transaction_type=cat_type,
                        description=description,
                        # Clamped so nothing lands in the future whatever day
                        # this runs. /transactions/summary only counts
                        # month-start..today, so future rows would be invisible.
                        transaction_date=today.replace(day=min(day, today.day)),
                    )
                    transaction.tags.append(
                        tags["essential"] if cat_type == "expense" else tags["primary"]
                    )
                    db.add(transaction)
                    n_tx += 1

        await db.commit()
        print(f"Seeded {EMAIL} / {PASSWORD}")
        print(f"  profiles: {len(PROFILES)}   transactions: {n_tx}")


asyncio.run(main())
