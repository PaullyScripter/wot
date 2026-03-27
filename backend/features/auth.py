import os
import secrets
import hashlib
from sqlalchemy.orm import Session


from ..database.model import User

PEPPER = os.getenv("PEPPER","")

#get salt
def generate_salt() -> str:
    return secrets.token_hex(16)

#hasing: password + salt + papper
def hash_password_sha256(password: str, salt: str) -> str:
    hashed = f"{password}{salt}{PEPPER}"
    return hashlib.sha256(hashed.encode("utf-8")).hexdigest()

def register_user(db: Session, username: str, email: str, password: str):

    #check for existing emails
    existing_email = db.query(User).filter(User.email == email).first()

    if existing_email:
        return None, "Already registered email"
    
    #check for existing username
    existing_username = db.query(User).filter(User.username == username).first()

    if existing_username:
        return None, "Already registered username"
    
    salt = generate_salt()
    hashed_password = hash_password_sha256(password, salt)

    user = User(
        username = username,
        email = email,
        password_salt = salt,
        hashed_password = hashed_password,
    )
    
    #update database
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, None

def authenticate_user(db: Session, email: str, password: str):

    #check if user email exists
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None, "Failed to authenticate"
    
    #check if hashed password
    attempted_hash = hash_password_sha256(password, user.password_salt)

    if attempted_hash != user.hashed_password:
        return None, "Failed to authenticate"
    
    return user, None










