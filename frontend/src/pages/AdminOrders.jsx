import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, RefreshCw, X, FileText, Search } from 'lucide-react';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // NEW: Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    try {
      const res = await fetch('http://localhost:8000/orders/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const updateOrderStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8000/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, current_status: newStatus } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, current_status: newStatus });
        }
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Pending': { bg: '#fff3cd', color: '#856404', border: '#ffeeba' },
      'Processing': { bg: '#cce5ff', color: '#004085', border: '#b8daff' },
      'Out for Delivery': { bg: '#e2e3e5', color: '#383d41', border: '#d6d8db' },
      'Completed': { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
      'Cancelled': { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' }
    };
    const style = styles[status] || { bg: '#f8f9fa', color: '#6c757d', border: '#dee2e6' };

    return (
      <span style={{ 
        backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}`,
        padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'
      }}>
        {status}
      </span>
    );
  };

  // The filteredOrders logic is now scoped correctly to the main component
  const filteredOrders = orders.filter(o => 
    o.id.toString().includes(searchTerm) || 
    (o.delivery_info?.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="text-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package color="var(--color-primary)" /> Order Fulfillment
        </h2>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* NEW: Search Bar */}
          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search ID or Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
          
          <button onClick={fetchOrders} className="btn btn-secondary">
            <RefreshCw size={16} /> Refresh Feed
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading order feed...</p>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--bg-muted)', borderBottom: '2px solid var(--border-light)' }}>
              <tr>
                <th style={{ padding: '15px', color: 'var(--text-muted)' }}>Order ID</th>
                <th style={{ padding: '15px', color: 'var(--text-muted)' }}>Date & Time</th>
                <th style={{ padding: '15px', color: 'var(--text-muted)' }}>Customer</th>
                <th style={{ padding: '15px', color: 'var(--text-muted)' }}>Total Value</th>
                <th style={{ padding: '15px', color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '15px', color: 'var(--text-muted)', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
           <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>No matching orders found.</td></tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: order.current_status === 'Pending' ? '#f0fdf4' : 'var(--bg-surface)' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold', color: 'var(--text-main)' }}>#{order.id}</td>
                    <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{new Date(order.created_at).toLocaleString()}</td>
                    <td style={{ padding: '15px', fontWeight: '500' }}>{order.delivery_info?.customer_name || 'Unknown'}</td>
                    <td style={{ padding: '15px', fontWeight: 'bold', color: 'var(--color-primary)' }}>Rs. {order.total_amount?.toFixed(2)}</td>
                    <td style={{ padding: '15px' }}>{getStatusBadge(order.current_status)}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <button onClick={() => setSelectedOrder(order)} className="btn btn-primary" style={{ padding: '8px 15px', fontSize: '13px' }}>
                        Review & Fulfill
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '800px', maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-light)', paddingBottom: '15px', marginBottom: '20px' }}>
              <div>
                <h2 className="text-title" style={{ margin: '0 0 5px 0' }}>Order #{selectedOrder.id}</h2>
                <p className="text-subtitle">Placed on {new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <div style={{ flex: 1, backgroundColor: 'var(--bg-muted)', padding: '15px', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '5px' }}>Delivery Details</h4>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Name:</strong> {selectedOrder.delivery_info?.customer_name}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Address:</strong> {selectedOrder.delivery_info?.delivery_address}</p>
                
                <h4 style={{ margin: '15px 0 10px 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '5px' }}>Payment Info</h4>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Method:</strong> {selectedOrder.payment_method}</p>
                
                {selectedOrder.payment_slip_url && (
                  <div style={{ marginTop: '10px' }}>
                    <a href={selectedOrder.payment_slip_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '6px 12px', textDecoration: 'none', fontSize: '12px' }}>
                      <FileText size={16} /> View Payment Slip
                    </a>
                  </div>
                )}
              </div>
              
              <div style={{ flex: 1, backgroundColor: 'var(--bg-muted)', padding: '15px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '15px' }}>
                  {['Pending', 'Processing', 'Out for Delivery', 'Completed', 'Cancelled'].map(status => (
                    <button 
                      key={status}
                      onClick={() => updateOrderStatus(selectedOrder.id, status)}
                      disabled={selectedOrder.current_status === status}
                      className="btn"
                      style={{ 
                        padding: '5px 10px', fontSize: '12px',
                        backgroundColor: selectedOrder.current_status === status ? 'var(--text-light)' : 'var(--bg-surface)',
                        border: '1px solid var(--border-light)', color: selectedOrder.current_status === status ? 'white' : 'var(--text-main)'
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}>Packing List (Items to pull from shelves)</h4>
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)' }}>
                  <tr>
                    <th style={{ padding: '10px 15px', color: 'var(--text-muted)', fontSize: '13px' }}>Target Batch ID</th>
                    <th style={{ padding: '10px 15px', color: 'var(--text-muted)', fontSize: '13px' }}>Quantity to Pack</th>
                    <th style={{ padding: '10px 15px', color: 'var(--text-muted)', fontSize: '13px' }}>Sold Price</th>
                    <th style={{ padding: '10px 15px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--bg-muted)' }}>
                        <td style={{ padding: '12px 15px', fontWeight: 'bold', color: 'var(--color-warning)' }}>Batch #{item.batch_id}</td>
                        <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{item.quantity}</td>
                        <td style={{ padding: '12px 15px' }}>Rs. {item.price_at_purchase?.toFixed(2)}</td>
                        <td style={{ padding: '12px 15px', textAlign: 'right', fontWeight: '500' }}>Rs. {(item.quantity * item.price_at_purchase).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" style={{ padding: '15px', textAlign: 'center', color: 'var(--text-light)' }}>No items found in this order.</td></tr>
                  )}
                </tbody>
                <tfoot style={{ backgroundColor: 'var(--bg-muted)', borderTop: '2px solid var(--border-light)' }}>
                  <tr>
                    <td colSpan="3" style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-main)' }}>Total:</td>
                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '16px' }}>Rs. {selectedOrder.total_amount?.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;