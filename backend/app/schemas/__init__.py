from pydantic import BaseModel
from typing import Literal
from datetime import datetime


class Issue(BaseModel):
    issue_id: str
    title: str
    edit_count: int
    spike_score: float
    updated_at: datetime


class SentimentResult(BaseModel):
    issue_id: str
    comment_id: str
    sentiment: Literal["positive", "negative", "neutral"]
    score: float
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
    type: Literal["sentiment", "briefing", "spike"]
    data: dict
