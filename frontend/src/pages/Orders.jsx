import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, Truck, AlertCircle, ShoppingBag, Star } from 'lucide-react';

const STATUS_STYLES = {
  Delivered:  { bg: '#eefcf2', color: '#00a247', icon: CheckCircle },
  Processing: { bg: '#eff6ff', color: '#3b82f6', icon: Clock },
  Shipped:    { bg: '#faf5ff', color: '#a855f7', icon: Truck },
  Pending:    { bg: '#fffbeb', color: '#f59e0b', icon: AlertCircle },
  Cancelled:  { bg: '#fef2f2', color: '#ef4444', icon: AlertCircle },
};

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetch('http://localhost:8000/orders/my', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => setOrders(data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [navigate]);

  const rateDriver = async (driverId, rating) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8000/users/drivers/${driverId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating })
      });
      if (res.ok) alert("Thank you for rating the driver!");
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '100px', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-light)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }}></div>
          <p>Loading orders...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '100px' }}>
        <ShoppingBag size={60} style={{ color: 'var(--text-light)', marginBottom: '20px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '10px' }}>No orders yet</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Start shopping to place your first order!</p>
        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ padding: '12px 28px' }}>Shop Now</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px 0 60px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>My Orders</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {orders.map(order => {
          const st = STATUS_STYLES[order.status] || { bg: '#f3f4f6', color: '#6b7280', icon: Package };
          const Icon = st.icon;
          const date = order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
          return (
            <div key={order.id} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-main)' }}>Order #{order.id}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: st.bg, color: st.color }}>
                      <Icon size={12} /> {order.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>{date} · {order.payment_method}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', fontSize: '20px', color: 'var(--color-primary)' }}>Rs. {order.total?.toFixed(2)}</div>
                </div>
              </div>

              {order.otp_code && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                <div style={{ marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#166534' }}>Drop-off OTP verification code:</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '2px', color: '#15803d' }}>{order.otp_code}</span>
                </div>
              )}

              {order.items && order.items.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Items</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', padding: '4px 0' }}>
                        <div>
                          <span style={{ color: 'var(--text-main)' }}>{item.product_name || item.name} <span style={{ color: 'var(--text-muted)' }}>× {item.quantity}</span></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Rs. {(item.price * item.quantity).toFixed(2)}</span>
                          {order.status === 'Delivered' && (
                            <button 
                              onClick={() => navigate('/feedback', { state: { product_id: item.product_id || item.id, product_name: item.product_name || item.name } })}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: '1px solid var(--border-light)', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-main)', transition: 'background-color 0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-muted)'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Star size={12} color="#f59e0b" /> Review
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {order.status === 'Delivered' && order.driver_id && (
                <div style={{ marginTop: '16px', borderTop: '1px dashed var(--border-light)', paddingTop: '16px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginRight: '10px' }}>Rate your delivery driver:</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={20} color="#d1d5db" 
                        style={{ cursor: 'pointer', transition: 'color 0.2s', fill: '#d1d5db' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#f59e0b'; e.currentTarget.style.fill = '#f59e0b'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.fill = '#d1d5db'; }}
                        onClick={() => {
                           rateDriver(order.driver_id, star);
                           // optimistic color lock mock
                           e.currentTarget.parentNode.childNodes.forEach((n, i) => {
                               n.style.fill = i < star ? '#f59e0b' : '#d1d5db';
                               n.style.color = i < star ? '#f59e0b' : '#d1d5db';
                           });
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Orders;