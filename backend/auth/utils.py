from datetime import datetime, timedelta,timezone

import jwt


from secrets import token_urlsafe
from hashlib import sha256

from config import settings

def create_access_token(user_id:int)->str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub" : str(user_id),
        "iat" : now,
        "exp" : now + timedelta(minutes=settings.access_token_expire_minutes),
        "type" : "access"
    }

    return jwt.encode(payload,settings.jwt_secret,algorithm=settings.algorithm)

def decode_access_token(token: str)-> dict:
    return jwt.decode(token,settings.jwt_secret,algorithms=[settings.algorithm])


def generate_refresh_token()->str:
    return token_urlsafe(48)

def hash_refresh_token(token_raw:str)->str:
    return sha256(token_raw.encode()).hexdigest()