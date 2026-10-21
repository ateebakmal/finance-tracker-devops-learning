"""Password hashing for the email/password sign-in path.

Argon2id (via argon2-cffi) rather than bcrypt: no silent 72-byte
truncation, and the memory/time cost parameters stay tunable as hardware
gets faster.

Every call goes through `asyncio.to_thread` for a reason. Hashing is
*deliberately* slow -- roughly 50-100ms of solid CPU. Called inline in an
async endpoint it would block the event loop for that whole time, which
freezes every other request this worker is serving. The threadpool keeps
the loop free.
"""

import asyncio

from argon2 import PasswordHasher
from argon2.exceptions import (
    InvalidHashError,
    VerificationError,
    VerifyMismatchError,
)

_hasher = PasswordHasher()

# A real Argon2 hash of a throwaway string. `verify_password` compares against
# this whenever the account has no password of its own (a Google-only account,
# or no account at all), so every failure path costs the same wall-clock time.
# Without it, an attacker with a stopwatch could tell "no such user" from
# "wrong password" and enumerate who has an account here.
_DUMMY_HASH = _hasher.hash("not-a-real-password-constant-time-placeholder")


async def hash_password(password: str) -> str:
    return await asyncio.to_thread(_hasher.hash, password)


def _verify(password_hash: str | None, password: str) -> bool:
    try:
        return _hasher.verify(password_hash or _DUMMY_HASH, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


async def verify_password(password_hash: str | None, password: str) -> bool:
    """True only if `password` matches `password_hash`.

    A None hash always loses, but only after doing the same work as a real
    comparison -- see `_DUMMY_HASH` above.
    """
    return await asyncio.to_thread(_verify, password_hash, password)
