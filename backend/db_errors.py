import logging
from sqlalchemy.exc import IntegrityError

logger = logging.getLogger(__name__)

UNIQUE_VIOLATION   = "23505"
FK_VIOLATION       = "23503"
CHECK_VIOLATION    = "23514"
NOT_NULL_VIOLATION = "23502"

def _pg_error(exc: IntegrityError):
    orig = getattr(exc, "orig", None)
    return getattr(orig, "__cause__", None) or orig

def classify_integrity_error(exc: IntegrityError) -> tuple[int, str]:
    """Generic, name-free mapping. Correct status code + safe message. No constraint names."""
    err = _pg_error(exc)
    sqlstate = getattr(err, "sqlstate", None)
    constraint = getattr(err, "constraint_name", None)
    logger.warning("Unhandled IntegrityError sqlstate=%s constraint=%s", sqlstate, constraint)  # so you notice

    if sqlstate == UNIQUE_VIOLATION:   return 409, "This conflicts with existing data"
    if sqlstate == FK_VIOLATION:       return 400, "A referenced record does not exist"
    if sqlstate == CHECK_VIOLATION:    return 400, "A value failed a validation check"
    if sqlstate == NOT_NULL_VIOLATION: return 400, "A required field is missing"
    return 400, "Invalid data"


