"""Single source of truth for the small fixed value-lists used in CHECK rules.

Your design doc is explicit: the allowed income/expense words live in exactly
ONE place so the list can never drift. Both the DB CHECK constraints (built via
`sql_in` below) and any future app-code validation import from here.
"""

# The income-vs-expense direction, shared by transactions and templates.
TRANSACTION_TYPE_VALUES: tuple[str, ...] = ("income", "expense")
CATEGORY_TYPE_VALUES:tuple[str,...] = ("income", "expense")
TAGS_TYPE_VALUES:tuple[str,...] = ("income", "expense")

# How often a budget applies.
BUDGET_TYPE_VALUES: tuple[str, ...] = ("weekly", "monthly")

# Cosmetic grouping label on a template (optional).
FREQUENCY_VALUES: tuple[str, ...] = ("weekly", "monthly")


def sql_in(column: str, values: tuple[str, ...]) -> str:
    """Build a SQL `col IN ('a', 'b')` fragment for a CheckConstraint.

    Keeping the values in Python and generating the SQL means the constraint and
    the app share the exact same list.
    """
    joined = ", ".join(f"'{value}'" for value in values)
    return f"{column} IN ({joined})"

