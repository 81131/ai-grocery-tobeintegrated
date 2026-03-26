from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from database import get_db
from models.orders import Order, OrderItem, OrderDelivery, DeliveryConfig
from models.user import User
from models.inventory import StockBatch, Product
from pydantic import BaseModel

class DeliveryConfigUpdate(BaseModel):
    active_method: str
    fixed_fee: float
    base_weight_kg: float
    base_weight_fee: float
    extra_weight_fee_per_kg: float
    base_distance_km: float
    base_distance_fee: float
    extra_distance_fee_per_km: float
from typing import List, Optional
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/orders", tags=["orders"])

from schemas.orders import OrderCreate
from routers.auth_router import get_current_user

# ── Notifications ───────────────────────────────────────────────────────────────
@router.get("/notifications/unread-count")
def get_unread_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Simple dynamic unread count based on recent orders
    if current_user.role == "admin":
        count = db.query(Order).filter(Order.current_status == "Pending").count()
    else:
        count = db.query(Order).filter(Order.user_id == current_user.user_id, Order.current_status != "Delivered").count()
    return {"count": count}

# ── Delivery Config (admin) ───────────────────────────────────────────────────
@router.get("/delivery-config")
def get_delivery_config(db: Session = Depends(get_db)):
    config = db.query(DeliveryConfig).first()
    if not config:
        config = DeliveryConfig(active_method="fixed", fixed_fee=400.0, base_weight_kg=1.0, base_weight_fee=400.0, extra_weight_fee_per_kg=200.0, base_distance_km=1.0, base_distance_fee=200.0, extra_distance_fee_per_km=150.0)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.put("/delivery-config")
def update_delivery_config(config_update: DeliveryConfigUpdate, db: Session = Depends(get_db)):
    config = db.query(DeliveryConfig).first()
    if not config:
        config = DeliveryConfig()
        db.add(config)
    config.active_method = config_update.active_method
    config.fixed_fee = config_update.fixed_fee
    config.base_weight_kg = config_update.base_weight_kg
    config.base_weight_fee = config_update.base_weight_fee
    config.extra_weight_fee_per_kg = config_update.extra_weight_fee_per_kg
    config.base_distance_km = config_update.base_distance_km
    config.base_distance_fee = config_update.base_distance_fee
    config.extra_distance_fee_per_km = config_update.extra_distance_fee_per_km
    db.commit()
    db.refresh(config)
    return config

# ── All Orders (admin) ────────────────────────────────────────────────────────
@router.get("/")
def get_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).limit(100).all()
    result = []
    for order in orders:
        user = db.query(User).filter(User.user_id == order.user_id).first()
        result.append({
            "id": order.id,
            "user_name": f"{user.first_name or ''} {user.last_name or ''}".strip() if user else "Unknown",
            "status": order.current_status,
            "total": order.total_amount,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "payment_method": order.payment_method,
        })
    return result

# ── My Orders (customer) ──────────────────────────────────────────────────────
@router.get("/my")
def get_my_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    orders = db.query(Order).filter(Order.user_id == current_user.user_id).order_by(Order.created_at.desc()).all()
    result = []
    for order in orders:
        items = []
        for oi in order.items:
            batch = db.query(StockBatch).filter(StockBatch.id == oi.batch_id).first()
            product = batch.product if batch else None
            items.append({
                "name": product.product_name if product else "Item",
                "quantity": oi.quantity,
                "price": oi.price_at_purchase,
            })
        result.append({
            "id": order.id,
            "status": order.current_status,
            "total": order.total_amount,
            "items": items,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "payment_method": order.payment_method,
        })
    return result

# ── Customer Dashboard Stats ──────────────────────────────────────────────────
@router.get("/my-stats")
def my_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    orders = db.query(Order).filter(Order.user_id == current_user.user_id).all()
    total_orders = len(orders)
    total_spent = sum(o.total_amount for o in orders)
    # Recent 5 orders
    recent = db.query(Order).filter(Order.user_id == current_user.user_id)\
        .order_by(Order.created_at.desc()).limit(5).all()
    recent_list = [{"id": o.id, "status": o.current_status, "total": o.total_amount,
                    "created_at": o.created_at.isoformat() if o.created_at else None} for o in recent]
    return {"total_orders": total_orders, "total_spent": total_spent, "recent_orders": recent_list}

# ── Dashboard Stats (admin) ───────────────────────────────────────────────────
@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_orders = db.query(Order).count()
    total_revenue = db.query(func.sum(Order.total_amount)).scalar() or 0.0
    from models.inventory import Product
    from models.user import User as UserModel
    total_products = db.query(Product).count()
    active_users = db.query(UserModel).filter(UserModel.is_active == True).count()

    # Real recent orders (last 10)
    recent_raw = db.query(Order).order_by(Order.created_at.desc()).limit(10).all()
    STATUS_MAP = {
        "Delivered":  {"color": "#00a247", "bg": "#eefcf2"},
        "Processing": {"color": "#3b82f6", "bg": "#eff6ff"},
        "Shipped":    {"color": "#a855f7", "bg": "#faf5ff"},
        "Pending":    {"color": "#f59e0b", "bg": "#fffbeb"},
        "Cancelled":  {"color": "#ef4444", "bg": "#fef2f2"},
    }
    recent_orders = []
    for o in recent_raw:
        u = db.query(UserModel).filter(UserModel.user_id == o.user_id).first()
        st = STATUS_MAP.get(o.current_status, {"color": "#6b7280", "bg": "#f3f4f6"})
        elapsed = ""
        if o.created_at:
            delta = datetime.now(timezone.utc) - o.created_at.replace(tzinfo=timezone.utc)
            hours = int(delta.total_seconds() // 3600)
            elapsed = f"{hours} hour{'s' if hours != 1 else ''} ago" if hours > 0 else "Just now"
        recent_orders.append({
            "id": f"ORD-{o.id:03d}",
            "status": o.current_status,
            "name": f"{u.first_name or ''} {u.last_name or ''}".strip() if u else "Customer",
            "time": elapsed,
            "total": f"${o.total_amount:.2f}",
            "color": st["color"],
            "bg": st["bg"],
        })

    # Real low stock items
    low_stock_batches = db.query(StockBatch).filter(StockBatch.current_quantity < 50)\
        .order_by(StockBatch.current_quantity.asc()).limit(5).all()
    low_stock_items = []
    for b in low_stock_batches:
        product = b.product
        cat = product.categories[0].name if product and product.categories else "General"
        low_stock_items.append({
            "name": product.product_name if product else "Unknown",
            "cat": cat,
            "qty": int(b.current_quantity),
        })

    return {
        "stats": {
            "totalRevenue": round(float(total_revenue), 2),
            "totalOrders": total_orders,
            "totalProducts": total_products,
            "activeUsers": active_users,
        },
        "recentOrders": recent_orders,
        "lowStockItems": low_stock_items,
    }

# ── Reports & Analytics ────────────────────────────────────────────────────────
@router.get("/reports")
def get_reports(db: Session = Depends(get_db)):
    # Revenue by month (last 6 months)
    revenue_by_month = []
    now = datetime.now(timezone.utc)
    for i in range(5, -1, -1):
        month_dt = (now.replace(day=1) - timedelta(days=i * 30))
        month_num = month_dt.month
        year_num = month_dt.year
        rev = db.query(func.sum(Order.total_amount)).filter(
            extract('month', Order.created_at) == month_num,
            extract('year', Order.created_at) == year_num,
        ).scalar() or 0.0
        cnt = db.query(Order).filter(
            extract('month', Order.created_at) == month_num,
            extract('year', Order.created_at) == year_num,
        ).count()
        revenue_by_month.append({
            "month": month_dt.strftime("%b"),
            "revenue": round(float(rev), 2),
            "orders": cnt,
        })

    # Orders by status
    statuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]
    orders_by_status = []
    for s in statuses:
        cnt = db.query(Order).filter(Order.current_status == s).count()
        orders_by_status.append({"status": s, "count": cnt})

    # Top 5 products by sales volume
    top_products_raw = db.query(
        OrderItem.batch_id,
        func.sum(OrderItem.quantity).label("total_qty"),
        func.sum(OrderItem.quantity * OrderItem.price_at_purchase).label("total_revenue"),
    ).group_by(OrderItem.batch_id).order_by(func.sum(OrderItem.quantity).desc()).limit(5).all()

    top_products = []
    for row in top_products_raw:
        batch = db.query(StockBatch).filter(StockBatch.id == row.batch_id).first()
        name = batch.product.product_name if batch and batch.product else "Unknown"
        top_products.append({
            "name": name,
            "qty_sold": int(row.total_qty or 0),
            "revenue": round(float(row.total_revenue or 0), 2),
        })

    # Summary
    total_revenue = db.query(func.sum(Order.total_amount)).scalar() or 0.0
    total_orders = db.query(Order).count()

    return {
        "revenue_by_month": revenue_by_month,
        "orders_by_status": orders_by_status,
        "top_products": top_products,
        "summary": {
            "total_revenue": round(float(total_revenue), 2),
            "total_orders": total_orders,
        },
    }

# ── Notifications ─────────────────────────────────────────────────────────────
@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from models.orders import OrderStatusHistory
    notifications = db.query(OrderStatusHistory).order_by(
        OrderStatusHistory.changed_at.desc()
    ).limit(10).all()
    return [{"order_id": n.order_id, "status": n.status, "changed_at": n.changed_at.isoformat()} for n in notifications]

# ── User Orders (by user_id, admin) ──────────────────────────────────────────
@router.get("/user/{user_id}")
def get_user_orders(user_id: int, db: Session = Depends(get_db)):
    return db.query(Order).filter(Order.user_id == user_id).all()

# ── Calculate Fee ─────────────────────────────────────────────────────────────
class FeeRequest(BaseModel):
    delivery_type: str
    distance_km: Optional[float] = 0

@router.post("/calculate-fee")
def calculate_fee(request: FeeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from models.cart import CartItem
    from models.inventory import StockBatch
    items = db.query(CartItem).filter(CartItem.user_id == current_user.user_id).all()
    total_weight = sum(
        (db.query(StockBatch).filter(StockBatch.id == item.batch_id).first().unit_weight_kg or 0.5) * item.quantity
        for item in items
    )
    if request.delivery_type == "Store Pickup":
        fee = 0.0
    else:
        fee = 2.37 + (request.distance_km * 0.15) + (total_weight * 0.10)
    return {"fee": round(fee, 2), "total_weight": round(total_weight, 2)}

# ── Checkout ──────────────────────────────────────────────────────────────────
@router.post("/checkout")
async def checkout(
    customer_name: str = Form(...),
    delivery_type: str = Form("Home Delivery"),
    delivery_address: str = Form(""),
    distance_km: float = Form(0),
    payment_method: str = Form("Card"),
    payment_slip: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from models.cart import Cart, CartItem
    cart = db.query(Cart).filter(Cart.user_id == current_user.user_id).first()
    if not cart:
        raise HTTPException(status_code=400, detail="Cart is empty")
    cart_items = db.query(CartItem).filter(CartItem.cart_id == cart.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    subtotal = sum(
        (db.query(StockBatch).filter(StockBatch.id == ci.batch_id).first().retail_price or 0) * ci.quantity
        for ci in cart_items
    )
    tax = float(subtotal) * 0.08
    shipping = 2.37 if delivery_type == "Home Delivery" else 0.0
    total = float(subtotal) + tax + shipping

    order = Order(
        user_id=current_user.user_id,
        subtotal_amount=float(subtotal),
        delivery_fee=shipping,
        total_amount=total,
        delivery_type=delivery_type,
        current_status="Pending",
        payment_method=payment_method,
    )
    db.add(order)
    db.flush()

    delivery = OrderDelivery(
        order_id=order.id,
        customer_name=customer_name,
        delivery_address=delivery_address or "Store Pickup",
    )
    db.add(delivery)

    for ci in cart_items:
        batch = db.query(StockBatch).filter(StockBatch.id == ci.batch_id).first()
        if batch:
            oi = OrderItem(
                order_id=order.id,
                batch_id=ci.batch_id,
                quantity=ci.quantity,
                price_at_purchase=float(batch.retail_price),
            )
            db.add(oi)
            batch.current_quantity = max(0, batch.current_quantity - ci.quantity)

    # Clear cart
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
    return {"message": "Order placed successfully", "order_id": order.id}

# ── Update Order Status (admin) ───────────────────────────────────────────────
@router.put("/{order_id}/status")
def update_order_status(order_id: int, status: str, db: Session = Depends(get_db)):
    from models.orders import OrderStatusHistory
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.current_status = status
    history = OrderStatusHistory(order_id=order_id, status=status)
    db.add(history)
    db.commit()
    return {"message": "Status updated"}
