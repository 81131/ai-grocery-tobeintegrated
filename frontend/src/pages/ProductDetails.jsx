import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Share2 } from 'lucide-react';

function ProductDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const item = location.state; 
  const [quantity, setQuantity] = useState(1);

  if (!item) {
    navigate('/');
    return null;
  }

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please log in to add items to your cart!");
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ batch_id: item.primary_batch_id, quantity: quantity })
      });
      
      if (response.ok) {
        alert(`Added ${quantity} ${item.product_name} to cart! 🛒`);
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.product_name,
          text: `Check out ${item.product_name} for just Rs. ${item.price} at our store!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      // Fallback for desktop browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert("Product link copied to clipboard!");
    }
  };

const keywordList = item.keywords ? item.keywords.split(',').map(k => k.trim()) : [];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <button onClick={() => navigate(-1)} className="btn" style={{ background: 'none', color: 'var(--color-info)', padding: '0 0 20px 0' }}>
        <ArrowLeft size={18} /> Back to Store
      </button>

      <div className="card" style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', padding: '40px' }}>
        
        {/* Left: Image */}
        <div style={{ flex: '1 1 400px' }}>
          <img 
            src={item.image} 
            alt={item.product_name} 
            style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }} 
          />
        </div>

        {/* Right: Details */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
            {item.category}
          </span>
          
          <h1 className="text-title" style={{ margin: '10px 0', fontSize: '32px' }}>{item.product_name}</h1>
          
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--color-primary)', margin: '10px 0 20px 0' }}>
            Rs. {item.price.toFixed(2)}
            <span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 'normal' }}> / {item.unit}</span>
          </p>

          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
            High-quality {item.product_name} sourced from our trusted suppliers. 
            Currently, we have <strong style={{ color: 'var(--text-main)' }}>{item.available_qty} {item.unit}</strong> in stock ready for delivery or pickup.
          </p>

          {/* Keywords Display */}
          {keywordList.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '30px' }}>
              {keywordList.map((kw, i) => (
                <span key={i} style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-main)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Cart Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: 'auto', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="btn btn-secondary" style={{ borderRadius: 0, padding: '12px 20px', fontSize: '18px' }}>-</button>
              <span style={{ padding: '0 20px', fontWeight: 'bold', fontSize: '18px', color: 'var(--text-main)' }}>{quantity}</span>
              <button onClick={() => setQuantity(Math.min(item.available_qty, quantity + 1))} className="btn btn-secondary" style={{ borderRadius: 0, padding: '12px 20px', fontSize: '18px' }}>+</button>
            </div>

            <button onClick={handleAddToCart} className="btn btn-primary" style={{ flex: 1, padding: '15px 30px', fontSize: '16px' }}>
              <ShoppingCart size={18} /> Add to Cart
            </button>
            
            <button onClick={handleShare} className="btn" style={{ padding: '15px', backgroundColor: 'var(--color-info)', color: 'white' }} title="Share this product">
              <Share2 size={18} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProductDetails;