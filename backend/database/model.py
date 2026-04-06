"""
Database Models
File Description: Defines what a “Story” looks like in the database - blueprint for storing data

- Defines database tables.
- Add views column (default=0)
- Add rating support
"""


from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from .db import Base
from pydantic import BaseModel  


class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String, nullable=False)
    culture = Column(String, nullable=True)
    country = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    category = Column(String, nullable=True)

    text = Column(Text, nullable=False)
    citation = Column( Text, nullable=False)
    visibility = Column(Text, nullable=False)

    views = Column(Integer, default=0, nullable=False)
    like_count = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    author = relationship("User")
    comments = relationship("Comment", back_populates="story", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_salt =  Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)

    stories = relationship("Story",back_populates="author", cascade="all,delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    reading_preferences = relationship(
        "UserReadingPreference",
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False
    )

class Comment(Base):
    __tablename__ = "comments"

    commentid = Column(Integer, primary_key=True, index=True)
    parent_comment_id = Column(Integer, ForeignKey("comments.commentid", ondelete="CASCADE"), nullable=True)
    storyid = Column(Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)
    userid = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    story = relationship("Story", back_populates="comments")
    user = relationship("User", back_populates="comments")
    parent = relationship("Comment", remote_side=[commentid], backref="replies")

class UserReadingPreference(Base):
    __tablename__ = "user_reading_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    font_size = Column(String, nullable=False, default="medium")
    font_weight = Column(String, nullable=False, default="normal")
    line_spacing = Column(String, nullable=False, default="normal")
    letter_spacing = Column(String, nullable=False, default="normal")
    theme = Column(String, nullable=False, default="original")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="reading_preferences")




