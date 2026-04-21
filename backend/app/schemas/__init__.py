from pydantic import BaseModel
from typing import Literal
from datetime import datetime


class Issue(BaseModel):
    issue_id: str
    title: str
    edit_count: int
    spike_score: float
    status: Literal["발생", "확산", "정점", "소강"] = "발생"
    updated_at: datetime


class SentimentResult(BaseModel):
    issue_id: str
    comment_id: str
    sentiment: Literal["positive", "negative", "neutral"]
    sentiment_score: float
    timestamp: datetime


class Briefing(BaseModel):
    issue_id: str
    summary: str
    key_points: list[str]
    created_at: datetime


class AlertSettings(BaseModel):
    issue_id: str
    threshold: int
    channels: list[Literal["discord", "email"]]


class WSMessage(BaseModel):
    type: Literal["sentiment", "briefing", "spike", "comment"]
    data: dict


class UserSettings(BaseModel):
    user_id: str
    username: str
    email: str


class UserSettingsPatch(BaseModel):
    username: str | None = None
    email: str | None = None


class Bookmark(BaseModel):
    bookmark_id: str
    issue_id: str
    created_at: datetime


class UserPreferences(BaseModel):
    categories: list[str]
