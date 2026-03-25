from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    # user_id = Column(Integer, ForeignKey("users.id")) # Teammate will build users table later
    
    total_amount = Column(Float, default=0.0)
    status = Column(String, default="pending") # pending, paid, shipped, delivered, cancelled
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, nullable=False) 
    
    quantity = Column(Integer, nullable=False)
    
    price_at_purchase = Column(Float, nullable=False) 

    order = relationship("Order", back_populates="items")