"""
Description: Handle "user engagement" actions like views, likes, ratings, comments.

Goals: 
- increment story views
- (later) likes, comments count, rating average
"""

from sqlalchemy.orm import Session
from sqlalchemy import update
from ..database.model import Story

#Incrementing views
def increment_story_views(db: Session, story_id: int) -> Story | None:
    #TODO: query story by ID
    db.execute(
        update(Story)
        .where(Story.id == story_id)
        .values(views = Story.views + 1)
    )
    db.commit() 
    story = db.query(Story).filter(Story.id == story_id).first()

    return story

#Incrementing likes 
def like_story(db: Session, story_id: int) -> Story | None:
    db.execute(
        update(Story)
        .where(Story.id == story_id)
        .values(like_story = Story.like_count + 1)
    )
    db.commit()
    story = db.query(Story).filter(Story.id == story_id).first()

    return story
