"""
API Routes Layer(HTTP Endpoints)
File Desription: Defines URLs/endpoints for frontend to call

Objectives:
- Define HTTP endpoints
- Validate request inputs
- Call DB and feature logic
- Return JSON responses
- Add GET /api/stories/{id}
- Improve error handling
- Add /api/search endpoint
- Add sorting parameters
"""

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session
from typing import List

from ..database.db import get_db
from ..database.model import User, Comment

from .schemas import (
    UserRegister,
    UserLogin,
    StoryOut,
    StoryCreate,
    CommentCreateRequest,
    CommentOut, 
)

from ..features.engagement import increment_story_views
from ..features.stories import list_all_stories, get_story_by_id, create_new_story
from ..features.auth import authenticate_user, register_user, get_current_user, get_current_user_by_id
from ..features.comments import make_a_comment

from .schemas import ReadingPreferenceOut, ReadingPreferenceUpdate
from ..features.preferences import get_user_preferences, upsert_user_preferences

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/stories", response_model=List[StoryOut])
def list_stories(db: Session = Depends(get_db)):
    return list_all_stories(db)

#receives story_id from URL + queries DB for ID
@router.get("/stories/{story_id}", response_model = StoryOut)
def get_story(story_id: int, db: Session = Depends(get_db), email: str = None, password: str = None):
    current_user = None
    if email and password:
        user, error = authenticate_user(db, email, password)
        if not error:
            current_user = user

    story = get_story_by_id(db, story_id, current_user)

    if story is None:
        raise HTTPException(status_code = 404, detail = "Story not found")
    return story

@router.get("/stories/{story_id}/comments", response_model=List[CommentOut])
def get_comments(story_id: int, db:Session = Depends(get_db)):
    return db.query(Comment).filter(Comment.storyid == story_id).all()


@router.post("/stories", response_model=StoryOut)
def create_story(payload: StoryCreate, db: Session = Depends(get_db)):
    current_user = db.query(User).filter(User.id == payload.user_id).first()

    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid user")

    return create_new_story(db, current_user, payload)

@router.post("/stories/{story_id}/views")
def increment_views(story_id: int, db:Session = Depends(get_db)):
    #OLD: story = db.query(Story).filter(Story.id == story_id).first()
    story = increment_story_views(db, story_id)
    if story is None:
        raise HTTPException(status_code = 404, detail = "Story not found")
    return {"id" : story.id, "views": story.views}

@router.post("/auth/register")
def register(payload: UserRegister, db: Session = Depends(get_db)):
    user, error = register_user(db, payload.username, payload.email, payload.password)

    if error:
        raise HTTPException(status_code=400, detail=error)
    
    return {"message": "User Registered", "user_id": user.id} 

@router.post("/auth/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user, error = authenticate_user(db, payload.email, payload.password)

    if error:
        raise HTTPException(status_code=401, detail="Invalid information")
        
    return {"message": "Login Sucessfully!", "user_id": user.id} 

@router.post("/stories/{story_id}/comments")
def create_comment(
    story_id: int,
    payload: CommentCreateRequest,
    db: Session = Depends(get_db),

):
    current_user, error = authenticate_user(db=db, 
                                          email=payload.email,
                                          password=payload.password)
    if error:
        raise HTTPException(status_code=401, detail="Invalid Credentials")
    
    return make_a_comment(
        db=db,
        current_user=current_user,
        story_id=story_id,
        content=payload.content,
        parent_comment_id=payload.parent_comment_id,
    )

    
@router.get("/users/{user_id}/reading-preferences", response_model=ReadingPreferenceOut)
def read_preferences(user_id: int, db: Session = Depends(get_db)):
    prefs = get_user_preferences(db, user_id)
    if prefs is None:
        raise HTTPException(status_code=404, detail="Reading preferences not found")
    return prefs


@router.get("/users/{user_id}/reading-preferences", response_model=ReadingPreferenceOut)
def read_preferences(user_id: int, db: Session = Depends(get_db)):
    prefs = get_user_preferences(db, user_id)

    if prefs is None:
        prefs = UserReadingPreference(
            user_id=user_id,
            font_size="medium",
            font_weight="normal",
            line_spacing="normal",
            letter_spacing="normal",
            theme="original",
        )
        db.add(prefs)
        db.commit()
        db.refresh(prefs)

    return prefs

@router.put("/users/{user_id}/reading-preferences", response_model=ReadingPreferenceOut)
def update_preferences(
    user_id: int,
    payload: ReadingPreferenceUpdate,
    db: Session = Depends(get_db)
):
    prefs, error = upsert_user_preferences(db, user_id, payload)

    if error:
        raise HTTPException(status_code=404, detail=error)

    return prefs


@router.get("/api/my-stories")
def get_my_stories(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return list_user_stories(db, current_user)
        
