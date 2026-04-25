from sqlalchemy.orm import Session
from ..database.model import Story
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
import re

VISIBILITY = {"Public", "Private"}

def map_story(story: Story):
    return {
        "id": story.id,
        "title": story.title,
        "culture": story.culture,
        "country": story.country,
        "year": story.year,
        "category": story.category,
        "text": story.text,
        "citation": story.citation,
        "visibility": story.visibility, 
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


def mla_check( citation: str) -> bool:
    if not citation or len(citation.strip()) < 15:
        return False
    
    citation = citation.strip()

    has_periods = citation.count(".") >= 2
    has_year = bool(re.search(r"\b(19|20)\d{2}\b", citation))

    return has_periods and has_year




def create_new_story(db: Session, current_user, payload):

    if not payload.citation or not payload.citation.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One MLA formatted citation is required."
        )
    
    if not mla_check(payload.citation):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must contain at least 1 MLA formatted citaiton."
        )
    
    if payload.visibility not in VISIBILITY: 
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must define visibility(Public or Private)."
        )

    story = Story(
        user_id=current_user.id,
        title=payload.title,
        culture=payload.culture,
        country=payload.country,
        year=payload.year,
        category=payload.category,
        text=payload.text,
        citation = payload.citation,
        visibility = payload.visibility, 
        views=0,
      
    )

    db.add(story)
    db.commit()
    db.refresh(story)

    return map_story(story)





