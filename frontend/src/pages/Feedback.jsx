import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Star, Send, MessageSquare, CheckCircle } from 'lucide-react';

function StarRating({ value, onChange, readOnly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => !readOnly && onChange(i)}
          onMouseEnter={() => !readOnly && setHover(i)}
          onMouseLeave={() => !readOnly && setHover(0)}
          style={{ background: 'none', border: 'none', cursor: readOnly ? 'default' : 'pointer', padding: '2px' }}
        >
          <Star
            size={readOnly ? 14 : 22}
            color={(hover || value) >= i ? '#f59e0b' : '#d1d5db'}
            fill={(hover || value) >= i ? '#f59e0b' : 'none'}
          />
        </button>
      ))}
    </div>
  );
}

export default function Feedback() {
  const location = useLocation();
  const state = location.state;
  
  const [form, setForm] = useState({ product_name: '', message: '', rating: 0, product_id: null });
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    // Fetch user's feedback
    fetchMyFeedbacks();
    
    // Fetch products for dropdown
    fetch('http://localhost:8000/inventory/products')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setProducts(data);
        if (state && state.product_id) {
          setForm(f => ({ ...f, product_id: state.product_id, product_name: state.product_name || '' }));
        }
      })
      .catch(err => console.error("Could not load products"));
  }, [state]);

  const fetchMyFeedbacks = () => {
    if (!token) return;
    setLoading(true);
    fetch('http://localhost:8000/feedback/my', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => setMyFeedbacks(data))
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product_id && !form.product_name) { setError('Please select a product.'); return; }
    if (form.rating === 0) { setError('Please select a star rating.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess(true);
        setForm({ product_name: '', message: '', rating: 0, product_id: null });
        fetchMyFeedbacks();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const err = await res.json();
        setError(err.detail || 'Failed to submit feedback');
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ padding: '30px 0 60px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>Feedback</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Share your experience with our products</p>
      </div>

      {/* Submit Form */}
      <div className="card" style={{ padding: '28px', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={17} color="var(--color-primary)" /> Leave a Review
        </h3>

        {success && (
          <div style={{ backgroundColor: '#eefcf2', border: '1px solid #bbf7d0', color: 'var(--color-primary)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} /> Feedback submitted successfully!
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {products.length === 0 ? (
          <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeeba', color: '#856404', padding: '16px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            There are currently no products available to review in the storefront.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px' }}>Select Product</label>
              <select
                className="input-field"
                value={form.product_id || ''}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selectedProduct = products.find(p => p.id === parseInt(selectedId));
                  setForm(f => ({
                    ...f,
                    product_id: selectedId ? parseInt(selectedId) : null,
                    product_name: selectedProduct ? selectedProduct.name : ''
                  }));
                }}
                required
                style={{ padding: '10px 14px', width: '100%', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '14px', backgroundColor: 'white' }}
              >
                <option value="" disabled>-- Choose a product to review --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px' }}>Your Rating</label>
              <StarRating value={form.rating} onChange={val => setForm(f => ({ ...f, rating: val }))} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px' }}>Your Review</label>
              <textarea
                className="input-field"
                placeholder="Share your experience..."
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                required
                rows={4}
                style={{ resize: 'vertical', minHeight: '100px' }}
              />
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '11px 24px', borderRadius: '8px', gap: '8px' }}>
              <Send size={15} /> {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}
      </div>

      {/* My Previous Reviews */}
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px' }}>My Reviews ({myFeedbacks.length})</h3>

        {loading ? (
          <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '20px' }}>Loading...</p>
        ) : myFeedbacks.length === 0 ? (
          <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-light)' }}>
            <MessageSquare size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
            <p>You haven't submitted any reviews yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {myFeedbacks.map(fb => (
              <div key={fb.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>{fb.product_name}</span>
                    <div style={{ marginTop: '4px' }}>
                      <StarRating value={fb.rating} readOnly />
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>{fb.created_at ? new Date(fb.created_at).toLocaleDateString() : ''}</span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{fb.message}</p>
                {fb.offensive && (
                  <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginTop: '10px' }}>
                    ⚠️ This review was flagged for review by our moderation system.
                  </div>
                )}
                {fb.reply && (
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '8px', marginTop: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '6px' }}>Admin Reply</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{fb.reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
