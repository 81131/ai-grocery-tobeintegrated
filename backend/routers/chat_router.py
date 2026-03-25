from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime # --- NEW IMPORT ---
from database import get_db
from models.chat import ChatMessage
from schemas.chat_schema import ChatCreate
from services.chatbot_service import generate_ai_response

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.get("/")
def get_all_messages(db: Session = Depends(get_db)):
    return db.query(ChatMessage).order_by(ChatMessage.timestamp.asc()).all()

@router.post("/send")
def send_message(chat: ChatCreate, db: Session = Depends(get_db)):
    user_msg = ChatMessage(content=chat.content, role="user")
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    ai_reply = generate_ai_response(chat.content)

    bot_msg = ChatMessage(content=ai_reply, role="assistant")
    db.add(bot_msg)
    db.commit()
    db.refresh(bot_msg)

    return {"user": user_msg, "assistant": bot_msg}

@router.put("/{message_id}")
def update_message(message_id: int, chat_update: ChatCreate, db: Session = Depends(get_db)):
    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.role != "user":
        raise HTTPException(status_code=400, detail="Can only edit user messages")

    # --- UPDATE CONTENT AND RECORD THE EDIT TIME ---
    msg.content = chat_update.content
    msg.edited_at = datetime.utcnow() 
    db.commit()
    
    db.query(ChatMessage).filter(ChatMessage.id > message_id).delete()
    db.commit()

    ai_reply_text = generate_ai_response(chat_update.content)

    bot_msg = ChatMessage(content=ai_reply_text, role="assistant")
    db.add(bot_msg)
    db.commit()
    db.refresh(bot_msg)

    return {"updated": msg, "new_reply": bot_msg}

@router.delete("/{message_id}")
def delete_message(message_id: int, db: Session = Depends(get_db)):
    # 1. Find the message the user clicked on
    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    # 2. Reliable paired-deletion logic
    if msg.role == "user":
        # Get the EXACT next message in the chronological timeline
        next_msg = db.query(ChatMessage).filter(ChatMessage.id > message_id).order_by(ChatMessage.id.asc()).first()
        
        # STRICT CHECK: Only delete if the very next message is an assistant.
        if next_msg and next_msg.role == "assistant":
            db.delete(next_msg)
            
    # 3. Delete the target message and save
    db.delete(msg)
    db.commit()
    
    return {"deleted": message_id}