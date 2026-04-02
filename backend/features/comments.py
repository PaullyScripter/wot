from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from ..database.model import Comment, Story

def make_a_comment( db:Session, 
                   current_user, 
                   story_id: int, 
                   content: str, 
                   parent_comment_id: int | None = None):
    
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Only registered user can comment.")
    
    if not content or not content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                            detail="Cannot have empty comment.")
    
    story = db.query(Story).filer(Story.id == story_id).first()

    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Story not found.")
    
    if parent_comment_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            details = "Parent comment not found.")
    
    if parent_comment_id != story_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Parent comment and story does not match")
    
    new_comment = Comment(
        parent_comment_id = parent_comment_id,
        storyid = story_id,
        userid = current_user.id,
        content = content.strip()
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

    
    