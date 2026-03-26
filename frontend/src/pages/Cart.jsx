import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, ShoppingCart, CreditCard, CheckCircle } from 'lucide-react';

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '8px',
  border: '1px solid var(--border-light)',
  backgroundColor: '#f9fafb',
  fontSize: '14px',
  color: 'var(--text-main)',
  outline: 'none',
  fontFamily: 'inherit',
};

function Cart() {
  const [cartData, setCartData] = useState({ items: [], total: 0 });
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [isPlacing, setIsPlacing] = useState(false);

  // Shipping form
  const [firstName, setFirstName]   = useState('');
  const [lastName,  setLastName]    = useState('');
  const [email,     setEmail]       = useState('');
  const [phone,     setPhone]       = useState('');
  const [address,   setAddress]     = useState('');
  const [city,      setCity]        = useState('New York');
  const [zip,       setZip]         = useState('10001');

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiry,     setExpiry]     = useState('');
  const [cvv,        setCvv]        = useState('');

  const navigate = useNavigate();

  const fetchCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    try {
      const res = await fetch('http://localhost:8000/cart/', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCartData(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchCart(); }, [navigate]);

  const updateQuantity = async (batchId, newQty) => {
    const token = localStorage.getItem('token');
    await fetch('http://localhost:8000/cart/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ batch_id: batchId, quantity: newQty }),
    });
    fetchCart();
  };

  const tax      = +(cartData.total * 0.08).toFixed(2);
  const shipping = cartData.total > 0 ? 2.37 : 0;
  const grandTotal = +(cartData.total + tax + shipping).toFixed(2);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsPlacing(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('customer_name', `${firstName} ${lastName}`.trim() || 'Customer');
    formData.append('delivery_type', 'Home Delivery');
    formData.append('delivery_address', `${address}, ${city} ${zip}`);
    formData.append('distance_km', 0);
    formData.append('payment_method', paymentMethod === 'credit' ? 'Card' : paymentMethod === 'paypal' ? 'PayPal' : 'Cash on Delivery');

    try {
      const res = await fetch('http://localhost:8000/orders/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        navigate('/orders');
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Checkout failed: ' + (err.detail || 'Unknown error'));
      }
    } catch (err) {
      alert('Network error during checkout.');
    } finally {
      setIsPlacing(false);
    }
  };

  if (cartData.items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <ShoppingCart size={64} style={{ color: 'var(--text-light)', marginBottom: '20px' }} />
        <h2 className="text-title" style={{ fontSize: '26px', marginBottom: '10px' }}>Your cart is empty</h2>
        <p className="text-subtitle" style={{ marginBottom: '24px' }}>Add items from the store to get started.</p>
        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px' }}>
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '30px 20px' }}>
      <h1 className="text-title" style={{ fontSize: '26px', marginBottom: '28px' }}>Checkout</h1>

      <form onSubmit={handlePlaceOrder}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '28px', alignItems: 'start' }}>

          {/* ───────── LEFT COLUMN ───────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Cart Items Summary */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 className="text-title" style={{ fontSize: '15px', marginBottom: '16px' }}>Your Items</h3>
              {cartData.items.map(item => (
                <div key={item.item_id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0', borderBottom: '1px solid var(--border-light)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={item.image} alt={item.name} style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px', backgroundColor: '#f3f4f6' }} />
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '14px', color: 'var(--text-main)' }}>{item.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>${item.price.toFixed(2)} each</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button type="button" onClick={() => updateQuantity(item.batch_id, item.quantity - 1)}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Minus size={13} />
                    </button>
                    <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.batch_id, item.quantity + 1)}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Plus size={13} />
                    </button>
                    <span style={{ fontWeight: '600', color: 'var(--color-primary)', minWidth: '60px', textAlign: 'right', fontSize: '14px' }}>
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping Address */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 className="text-title" style={{ fontSize: '15px', marginBottom: '18px' }}>Shipping Address</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-main)', marginBottom: '6px' }}>First Name</label>
                  <input style={inputStyle} placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-main)', marginBottom: '6px' }}>Last Name</label>
                  <input style={inputStyle} placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-main)', marginBottom: '6px' }}>Email</label>
                  <input style={inputStyle} type="email" placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-main)', marginBottom: '6px' }}>Phone</label>
                  <input style={inputStyle} placeholder="+1 234 567 890" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>

              <div style={{ marginTop: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-main)', marginBottom: '6px' }}>Address</label>
                <input style={inputStyle} placeholder="123 Main Street, Apt 4B" value={address} onChange={e => setAddress(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-main)', marginBottom: '6px' }}>City</label>
                  <input style={inputStyle} placeholder="New York" value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-main)', marginBottom: '6px' }}>Zip Code</label>
                  <input style={inputStyle} placeholder="10001" value={zip} onChange={e => setZip(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 className="text-title" style={{ fontSize: '15px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={17} /> Payment Method
              </h3>

              {/* Method Options */}
              {[
                { id: 'credit',   label: 'Credit/Debit Card',  rightIcon: <CreditCard size={16} color="var(--text-light)" /> },
                { id: 'paypal',   label: 'PayPal',             rightIcon: null },
                { id: 'cod',      label: 'Cash on Delivery',   rightIcon: null },
              ].map(opt => (
                <label key={opt.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', marginBottom: '10px', borderRadius: '8px',
                  border: `1.5px solid ${paymentMethod === opt.id ? 'var(--color-primary)' : 'var(--border-light)'}`,
                  backgroundColor: paymentMethod === opt.id ? '#f0fdf4' : 'white',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="radio" name="payment" value={opt.id}
                      checked={paymentMethod === opt.id} onChange={() => setPaymentMethod(opt.id)}
                      style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>{opt.label}</span>
                  </div>
                  {opt.rightIcon}
                </label>
              ))}

              {/* Card Details — visible only when credit selected */}
              {paymentMethod === 'credit' && (
                <div style={{ marginTop: '4px', padding: '18px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-main)', marginBottom: '6px' }}>Card Number</label>
                    <input
                      style={inputStyle}
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      maxLength={19}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-main)', marginBottom: '6px' }}>Expiry Date</label>
                      <input style={inputStyle} placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value)} maxLength={5} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-main)', marginBottom: '6px' }}>CVV</label>
                      <input style={inputStyle} placeholder="123" value={cvv} onChange={e => setCvv(e.target.value)} maxLength={4} type="password" />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ───────── RIGHT SIDEBAR: Order Summary ───────── */}
          <div className="card" style={{ padding: '24px', position: 'sticky', top: '20px' }}>
            <h3 className="text-title" style={{ fontSize: '15px', marginBottom: '20px' }}>Order Summary</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)' }}>
                <span>Subtotal</span>
                <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>${cartData.total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)' }}>
                <span>Tax</span>
                <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>${tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)' }}>
                <span>Shipping</span>
                <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>${shipping.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-main)' }}>Total</span>
              <span style={{ fontWeight: '700', fontSize: '20px', color: 'var(--color-primary)' }}>${grandTotal.toFixed(2)}</span>
            </div>

            <button
              type="submit"
              disabled={isPlacing}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '15px', borderRadius: '8px', justifyContent: 'center', opacity: isPlacing ? 0.7 : 1 }}
            >
              <CheckCircle size={17} />
              {isPlacing ? 'Placing Order...' : 'Place Order'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-light)', marginTop: '12px' }}>
              By placing your order, you agree to our terms and conditions
            </p>
          </div>

        </div>
      </form>
    </div>
  );
}

export default Cart;