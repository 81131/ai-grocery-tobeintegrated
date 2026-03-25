from pydantic import BaseModel
from datetime import datetime
from typing import Optional # Add this import

class ChatCreate(BaseModel):
    content: str

class ChatResponse(BaseModel):
    id: int
    content: str
    role: str
    timestamp: datetime
    
    # --- NEW FIELD ---
    edited_at: Optional[datetime] = None

    class Config:
        from_attributes = True