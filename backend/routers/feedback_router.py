from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.feedback import Feedback
from models.user import User
from pydantic import BaseModel
from typing import Optional
import pickle
import os

router = APIRouter(prefix="/feedback", tags=["feedback"])

# ── ML model loading (graceful degradation) ───────────────────────────────────
feedback_model_path = os.path.join(os.path.dirname(__file__), "..", "feedback_model.pkl")
vectorizer_path     = os.path.join(os.path.dirname(__file__), "..", "vectorizer.pkl")
try:
    with open(feedback_model_path, "rb") as f:
        feedback_model = pickle.load(f)
    with open(vectorizer_path, "rb") as f:
        vectorizer = pickle.load(f)
    ml_enabled = True
except Exception:
    ml_enabled = False

# ── Auth dependency (lazy-imported to avoid circular) ────────────────────────
def get_current_user_dep():
    from routers.auth_router import get_current_user
    return get_current_user

# ── Schemas ───────────────────────────────────────────────────────────────────
class FeedbackRequest(BaseModel):
    text: str

class FeedbackSubmit(BaseModel):
    product_name: str
    message: str
    rating: int  # 1-5
    product_id: Optional[int] = None

class FeedbackReply(BaseModel):
    reply: str

# ── ML Analyze ────────────────────────────────────────────────────────────────
@router.post("/analyze")
def analyze_feedback(request: FeedbackRequest):
    if not ml_enabled:
        return {"sentiment": "neutral", "toxicity": 0.0, "warning": "ML Model not loaded."}
    vec = vectorizer.transform([request.text])
    prediction = feedback_model.predict(vec)[0]
    return {
        "text": request.text,
        "is_toxic": bool(prediction == 1),
        "toxicity_score": 1.0 if prediction == 1 else 0.0,
    }

# ── Submit Feedback (customer) ────────────────────────────────────────────────
@router.post("/submit")
def submit_feedback(
    data: FeedbackSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep()),
):
    # ML toxicity check
    is_offensive = False
    if ml_enabled:
        vec = vectorizer.transform([data.message])
        prediction = feedback_model.predict(vec)[0]
        is_offensive = bool(prediction == 1)

    fb = Feedback(
        user_id=current_user.user_id,
        user_name=f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email,
        product_name=data.product_name,
        product_id=data.product_id,
        message=data.message,
        rating=data.rating,
        offensive=is_offensive,
        role="user",
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return {
        "id": fb.id,
        "message": "Feedback submitted successfully",
        "flagged": is_offensive,
    }

# ── My Feedbacks ──────────────────────────────────────────────────────────────
@router.get("/my")
def my_feedbacks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep()),
):
    feedbacks = db.query(Feedback).filter(Feedback.user_id == current_user.user_id).order_by(Feedback.created_at.desc()).all()
    return [_fb_to_dict(fb) for fb in feedbacks]

# ── All Feedbacks (admin) ─────────────────────────────────────────────────────
@router.get("/")
def all_feedbacks(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    feedbacks = db.query(Feedback).order_by(Feedback.created_at.desc()).offset(skip).limit(limit).all()
    return [_fb_to_dict(fb) for fb in feedbacks]

# ── Admin Reply ───────────────────────────────────────────────────────────────
@router.put("/{feedback_id}/reply")
def reply_to_feedback(
    feedback_id: int,
    data: FeedbackReply,
    db: Session = Depends(get_db),
):
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    fb.reply = data.reply
    from datetime import datetime, timezone
    fb.replied_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Reply saved"}

# ── Delete Feedback (admin) ───────────────────────────────────────────────────
@router.delete("/{feedback_id}")
def delete_feedback(feedback_id: int, db: Session = Depends(get_db)):
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    db.delete(fb)
    db.commit()
    return {"message": "Feedback deleted"}

# ── Feedback Stats (for reports) ──────────────────────────────────────────────
@router.get("/stats")
def feedback_stats(db: Session = Depends(get_db)):
    total = db.query(Feedback).count()
    avg_rating_result = db.query(Feedback).all()
    avg_rating = round(sum(f.rating for f in avg_rating_result) / total, 2) if total else 0
    flagged = db.query(Feedback).filter(Feedback.offensive == True).count()
    return {"total": total, "avg_rating": avg_rating, "flagged": flagged}

# ── Helper ────────────────────────────────────────────────────────────────────
def _fb_to_dict(fb: Feedback) -> dict:
    return {
        "id": fb.id,
        "user_name": fb.user_name,
        "user_id": fb.user_id,
        "product_name": fb.product_name,
        "message": fb.message,
        "rating": fb.rating,
        "reply": fb.reply,
        "offensive": fb.offensive,
        "created_at": fb.created_at.isoformat() if fb.created_at else None,
        "replied_at": fb.replied_at.isoformat() if fb.replied_at else None,
    }
