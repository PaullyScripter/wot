from sqlalchemy.orm import Session
from ..database.model import Story
from sqlalchemy.orm import Session, joinedload

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
        "author_name": story.user.username if story.user else None,
    }

def list_all_stories(db: Session):
    stories = db.query(Story).options(joinedload(Story.user)).all()
    return [map_story(s) for s in stories]

def get_story_by_id(db: Session, story_id: int):
    story = (
    db.query(Story)
    .options(joinedload(Story.user))
    .filter(Story.id == story_id)
    .first()
   )
    if not story:
        return None
    return map_story(story)

def create_new_story(db: Session, payload):
    story = Story(
        user_id=payload.user_id,
        title=payload.title,
        culture=payload.culture,
        country=payload.country,
        year=payload.year,
        category=payload.category,
        text=payload.text,
        views=0,
    )

    db.add(story)
    db.commit()
    db.refresh(story)

    return map_story(story)



