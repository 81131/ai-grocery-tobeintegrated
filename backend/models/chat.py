from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String, nullable=False)
    role = Column(String, nullable=False)  # user / assistant
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # --- NEW FIELD ---
    edited_at = Column(DateTime, nullable=True)