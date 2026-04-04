from sqlalchemy.orm import Session
from ..database.model import User, UserReadingPreference

def get_user_preferences(db: Session, user_id: int):
    return (
        db.query(UserReadingPreference)
        .filter(UserReadingPreference.user_id == user_id)
        .first()
    )

def upsert_user_preferences(db: Session, user_id: int, payload):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None, "User not found"

    prefs = (
        db.query(UserReadingPreference)
        .filter(UserReadingPreference.user_id == user_id)
        .first()
    )

    if prefs is None:
        prefs = UserReadingPreference(
            user_id=user_id,
            font_size=payload.font_size,
            font_weight=payload.font_weight,
            line_spacing=payload.line_spacing,
            letter_spacing=payload.letter_spacing,
            theme=payload.theme,
        )
        db.add(prefs)
    else:
        prefs.font_size = payload.font_size
        prefs.font_weight = payload.font_weight
        prefs.line_spacing = payload.line_spacing
        prefs.letter_spacing = payload.letter_spacing
        prefs.theme = payload.theme

    db.commit()
    db.refresh(prefs)
    return prefs, None