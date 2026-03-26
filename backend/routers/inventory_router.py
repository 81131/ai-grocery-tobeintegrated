from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models.inventory import Product, Category, StockBatch, StockBatchEditHistory
from schemas.inventory import ProductCreate, KeywordRequest, StockBatchCreate, StockBatchUpdate
from pydantic import BaseModel
import uuid
import os

class CategoryCreate(BaseModel):
    name: str
    description: str = None
    discount_percentage: float = 0.0

router = APIRouter(prefix="/inventory", tags=["inventory"])

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@router.post("/categories")
def create_category(cat: CategoryCreate, db: Session = Depends(get_db)):
    new_cat = Category(name=cat.name, description=cat.description, discount_percentage=cat.discount_percentage)
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@router.get("/products")
def get_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = db.query(Product).offset(skip).limit(limit).all()
    results = []
    for p in products:
        # Get active batch or first
        batch = next((b for b in p.batches if b.current_quantity > 0), None)
        if not batch and p.batches:
            batch = p.batches[0]
            
        p_dict = {
            "id": p.id,
            "sku": p.sku,
            "product_name": p.product_name,
            "description": p.description,
            "image_url": p.image_url,
            "unit_of_measure": p.unit_of_measure,
            "keywords": p.keywords,
            "supplier_id": p.supplier_id,
            "category_name": p.categories[0].name if p.categories else "General",
            "category_ids": [c.id for c in p.categories],
            "buying_price": float(batch.buying_price) if batch else 0.0,
            "retail_price": float(batch.retail_price) if batch else 0.0,
            "current_quantity": float(batch.current_quantity) if batch else 0.0
        }
        results.append(p_dict)
    return results

@router.get("/storefront")
def get_storefront(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    storefront_items = []
    for product in products:
        # Need active batch
        batch = next((b for b in product.batches if b.current_quantity > 0), None)
        if not batch and product.batches:
            batch = product.batches[0]
            
        if batch:
            cat_name = product.categories[0].name if product.categories else "General"
            storefront_items.append({
                "primary_batch_id": batch.id,
                "group_key": product.id,
                "product_name": product.product_name,
                "category": cat_name,
                "keywords": product.keywords or "",
                "price": float(batch.retail_price),
                "unit": product.unit_of_measure,
                "image": product.image_url or batch.image_url or "https://via.placeholder.com/150",
                "available_qty": batch.current_quantity
            })
    return storefront_items

@router.get("/products/{product_id}/feedbacks")
def get_product_feedbacks(product_id: int, db: Session = Depends(get_db)):
    from models.feedback import Feedback
    feedbacks = db.query(Feedback).filter(Feedback.product_id == product_id, Feedback.offensive == False).order_by(Feedback.created_at.desc()).all()
    return [
        {
            "id": fb.id,
            "user_name": fb.user_name,
            "rating": fb.rating,
            "message": fb.message,
            "reply": fb.reply,
            "created_at": fb.created_at
        }
        for fb in feedbacks
    ]

@router.post("/products")
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    sku = product.sku if product.sku else f"SKU-{uuid.uuid4().hex[:8].upper()}"
    
    new_product = Product(
        product_name=product.product_name,
        sku=sku,
        description=product.description,
        image_url=product.image_url,
        unit_of_measure=product.unit_of_measure,
        keywords=product.keywords,
        supplier_id=product.supplier_id
    )
    
    if product.category_ids:
        categories = db.query(Category).filter(Category.id.in_(product.category_ids)).all()
        new_product.categories = categories

    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.post("/generate-keywords")
def generate_keywords(req: KeywordRequest, db: Session = Depends(get_db)):
    # Using a simple mock AI generator for demo purposes. 
    # In production, call an LLM API here.
    words = req.name.lower().split()
    if req.description:
        words += req.description.lower().split()
    
    # Filter out short words and take unique
    keywords = list(set([f"#{w.capitalize()}" for w in words if len(w) > 3]))
    return {"keywords": ", ".join(keywords[:5])}

@router.post("/upload-image")
def upload_image(file: UploadFile = File(...)):
    # Mock upload: return a fun dicebear url or placeholder
    # Or actually save it:
    os.makedirs("/app/uploads", exist_ok=True)
    file_path = f"/app/uploads/{uuid.uuid4()}_{file.filename}"
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())
    # Note: need a static mount to serve this really, but placeholder works for UI demo
    return {"image_url": f"https://api.dicebear.com/7.x/shapes/svg?seed={uuid.uuid4()}"}

@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted"}

@router.get("/products/{product_id}/batches")
def get_product_batches(product_id: int, db: Session = Depends(get_db)):
    return db.query(StockBatch).filter(StockBatch.product_id == product_id).all()

@router.post("/batches")
def create_batch(batch: StockBatchCreate, db: Session = Depends(get_db)):
    db_batch = StockBatch(**batch.model_dump() if hasattr(batch, 'model_dump') else batch.dict())
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    return db_batch

@router.put("/batches/{batch_id}")
def update_batch(batch_id: int, batch: StockBatchUpdate, db: Session = Depends(get_db)):
    db_batch = db.query(StockBatch).filter(StockBatch.id == batch_id).first()
    if not db_batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    if batch.buying_price is not None:
        db_batch.buying_price = batch.buying_price
    if batch.retail_price is not None:
        db_batch.retail_price = batch.retail_price
    if batch.current_quantity is not None:
        db_batch.current_quantity = batch.current_quantity
        
    db.commit()
    db.refresh(db_batch)
    return db_batch

@router.get("/batches/{batch_id}/history")
def get_batch_history(batch_id: int, db: Session = Depends(get_db)):
    return db.query(StockBatchEditHistory).filter(StockBatchEditHistory.batch_id == batch_id).order_by(StockBatchEditHistory.timestamp.desc()).all()
