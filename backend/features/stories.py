from sqlalchemy.orm import Session
from ..database.model import Story
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

def map_story(story: Story):
    return {
        "id": story.id,
        "title": story.title,
        "culture": story.culture,
        "country": story.country,
        "year": story.year,
        "category": story.category,
        "text": story.text,
        "views": story.views,
        "author_name": story.author.username if story.author else None,
        "like_count": story.like_count,
        "created_at": story.created_at.isoformat() if story.created_at else None,
        "updated_at": story.updated_at.isoformat() if story.updated_at else None,
    }

def list_all_stories(db: Session):
    #stories = db.query(Story).options(joinedload(Story.author)).all()
    stories = ( db.query(Story)
               .options(joinedload(Story.author))
               .filter(Story.visibility == "Public")
               .all()
               )

    return [map_story(s) for s in stories]

def get_story_by_id(db: Session, story_id: int, current_user = None):
    story = ( db.query(Story)
               .options(joinedload(Story.author))
               .filter(Story.id == story_id)
               .first()
               )
    if not story:
        return None
    
    if story.visibility == "Private":
        if not current_user or story.user_id != current_user.id:
            raise HTTPException(
                status_code=403, detail = "This story is private"
            )
    return map_story(story)

def create_new_story(db: Session, current_user, payload):
    story = Story(
        user_id=current_user.id,
        title=payload.title,
        culture=payload.culture,
        country=payload.country,
        year=payload.year,
        category=payload.category,
        text=payload.text,
        views=0,
        citation = payload.citation,
        visibility = payload.visibility, 
    )

    db.add(story)
    db.commit()
    db.refresh(story)

    return map_story(story)



