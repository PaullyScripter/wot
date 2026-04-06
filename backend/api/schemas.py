from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime



#Auth Schema
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True

#Story Schemas
class StoryCreate(BaseModel):
    email: str
    password: str
    title: str
    culture: Optional[str] = None
    country: Optional[str] = None
    year: Optional[int] = None
    category: Optional[str] = None
    text: str
    citation: str
    visibility: str

class StoryOut(BaseModel):
    id: int
    user_id: int | None = None
    title: str
    culture: Optional[str] = None
    country: Optional[str] = None
    year: Optional[int] = None
    category: Optional[str] = None
    text: str
    views: int
    author_name: Optional[str] = None 
    like_count: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    class Config:
        from_attributes = True

#Comment Schemas
class CommentCreateRequest(BaseModel):
    email: str
    password: str
    content: str = Field(..., min_length = 1)
    parent_comment_id: Optional[int] = None

class CommentOut(BaseModel):
    commentid: int
    storyid: int
    userid: int
    parent_comment_id: Optional[int] = None
    content: str

    class Config:
        from_attributes = True