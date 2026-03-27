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
from sqlalchemy import or_, func
from pydantic import BaseModel
from typing import Optional, List

from ..database.db import SessionLocal
from ..database.model import  UserLogin, UserRegister
from ..features.engagement import increment_story_views
from ..features.stories import list_all_stories, get_story_by_id, create_new_story
from ..features.auth import authenticate_user, register_user

router = APIRouter(prefix="/api", tags=["api"])

# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#API contract
class StoryCreate(BaseModel):
    title: str
    culture: Optional[str] = None
    text: str

class StoryOut(BaseModel):
    id: int
    title: str
    culture: Optional[str] = None
    country: Optional[str] = None
    year: Optional[int] = None
    category: Optional[str] = None
    text: str
    views: int

    class Config:
        from_attributes = True

""" 
TO BE REPLACED
class SearchResultItem(BaseModel):
    id: int
    title: str
    culture: Optional[str] = None
    snippet: str
    views: int

class SearchResponse(BaseModel):
    query: str
    total: int
    results: List[SearchResultItem]
"""


@router.get("/stories", response_model=List[StoryOut])
def list_stories(db: Session = Depends(get_db)):
    return list_all_stories(db)

#receives story_id from URL + queries DB for ID
@router.get("/stories/{story_id}", response_model = StoryOut)
def get_story(story_id: int, db: Session = Depends(get_db)):
    story = get_story_by_id(db, story_id)
    if story is None:
        raise HTTPException(status_code = 404, detail = "Story not found")
    return story

"""
FIXME 
#registers GET endpoint for search
@router.get("/search", response_model = SearchResponse)
def search_stories(
    q: str = Query(..., min_length = 1), #required at least 1 text
    limit: int  = Query(10, ge = 1, le = 100), #items per page 1-100
    offset: int = Query(0 , ge = 0), #items to skip
    sort: str = Query("view" , pattern = "^(views|newest|relevance)$"), 
    db: Session = Depends(get_db), 
):
    
    query_text = q.strip() #removes space
    pattern = f"%{query_text}%" #matches texts

    #search filter => ilike: case-insensitive match in Postgres
    filters = or_(
        Story.title.ilike(pattern),
        Story.culture.ilike(pattern),
        Story.text.ilike(pattern),
    )

    #find how many searches match
    total = db.query(func.count(Story.id)).filter(filters).scalar() or 0

    #sort
    if sort == "newest":
        order_by = (Story.id.desc(),)
    else:
        order_by = (Story.views.desc(), Story.id.desc())

    #db query
    rows = (
        db.query(Story)
        .filter(filters)
        .order_by(*order_by)
        .offset(offset)
        .limit(limit)
        .all()
    )

    #display result snippets until user decide to open or not
    results: List[SearchResultItem] = []
    for s in rows:
        raw = s.text or ""
        snippet = raw[:160].strip() + ("..." if len(raw) > 160 else "")
        results.append(
            SearchResultItem(
                id = s.id,
                title = s.title,
                culture = s.culture,
                snippet = snippet,
                views = s.views,
            )
        )
        #return typed Pydantic object
        return SearchResponse(query = query_text, total = int(total),  results = results)

 """


@router.post("/stories", response_model=StoryOut)
def create_story(payload: StoryCreate, db: Session = Depends(get_db)):
    return create_new_story(db, payload)

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

    




        
