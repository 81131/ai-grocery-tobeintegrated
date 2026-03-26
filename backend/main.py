from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import engine, get_db, Base
import os
from passlib.context import CryptContext

# Import your routers and models
from routers.chat_router import router as chat_router
from routers.auth_router import router as auth_router
from routers.inventory_router import router as inventory_router
from routers.supplier_router import router as supplier_router
from routers.cart_router import router as cart_router
from routers.order_router import router as order_router
from routers.feedback_router import router as feedback_router
from models import orders, chat, cart, feedback, inventory, suppliers, user  # Ensure models are imported so the tables create

# Create tables in the database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Ransara Supermarket API")

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(auth_router)
app.include_router(inventory_router)
app.include_router(supplier_router)
app.include_router(cart_router)
app.include_router(order_router)
app.include_router(feedback_router)

# ─── Seed Admin Account on Startup ───────────────────────────────────────────
def seed_admin():
    from database import SessionLocal
    from models.user import User
    db = SessionLocal()
    try:
        admin_email = os.getenv("ADMIN_EMAIL", "admin@ransara.com")
        existing = db.query(User).filter(User.email == admin_email).first()
        if not existing:
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            admin = User(
                email=admin_email,
                password_hash=pwd_context.hash(os.getenv("ADMIN_PASSWORD", "Admin@123")),
                first_name=os.getenv("ADMIN_FIRSTNAME", "Market"),
                last_name=os.getenv("ADMIN_LASTNAME", "Admin"),
                role="admin",
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print(f"[SEED] Admin account created: {admin_email}")
        else:
            print(f"[SEED] Admin already exists: {admin_email}")
    except Exception as e:
        print(f"[SEED] Error seeding admin: {e}")
        db.rollback()
    finally:
        db.close()

@app.on_event("startup")
def startup_event():
    seed_admin()

@app.get("/")
def root():
    return {"message": "Welcome to the Ransara Supermarket API backend!"}

@app.get("/test-db")
def test_database_connection(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "success", "message": "Successfully connected to PostgreSQL!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")