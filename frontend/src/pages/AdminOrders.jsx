import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, RefreshCw, X, FileText, Search } from 'lucide-react';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // NEW: Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [assigning, setAssigning] = useState(false);
  
  const navigate = useNavigate();

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    try {
      const res = await fetch('http://localhost:8000/orders/', {
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

  useEffect(() => {
    if (selectedOrder) {
      fetchAvailableDrivers();
    }
  }, [selectedOrder]);

  const fetchAvailableDrivers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/orders/drivers/available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setAvailableDrivers(await res.json());
    } catch (err) {
      console.error("Failed to fetch drivers:", err);
    }
  };

  const assignDriver = async (orderId, driverId) => {
    if (!driverId) return;
    setAssigning(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8000/orders/${orderId}/assign-driver`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ driver_id: parseInt(driverId) })
      });
      if (res.ok) {
        alert("Driver assigned successfully! 🚚");
        fetchOrders();
        setSelectedOrder(null);
      } else {
        alert("Failed to assign driver.");
      }
    } catch (err) {
      console.error("Assign error:", err);
    } finally {
      setAssigning(false);
    }
  };

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
              {/* Column 1: Details & Payment */}
              <div style={{ flex: 1, backgroundColor: 'var(--bg-muted)', padding: '15px', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '5px' }}>Delivery Details</h4>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Name:</strong> {selectedOrder.delivery_info?.customer_name}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Address:</strong> {selectedOrder.delivery_info?.delivery_address}</p>
                
                <h4 style={{ margin: '15px 0 10px 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '5px' }}>Payment Info</h4>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Method:</strong> {selectedOrder.payment_method}</p>

                {selectedOrder.payment_slip_url && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>Slip Status:</span>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                        background: selectedOrder.payment_slip_status === 'approved' ? '#d4edda' : selectedOrder.payment_slip_status === 'rejected' ? '#f8d7da' : '#fff3cd',
                        color: selectedOrder.payment_slip_status === 'approved' ? '#155724' : selectedOrder.payment_slip_status === 'rejected' ? '#721c24' : '#856404',
                      }}>
                        {selectedOrder.payment_slip_status === 'approved' ? '✓ Approved' : selectedOrder.payment_slip_status === 'rejected' ? '✗ Rejected' : '⏳ Pending Review'}
                      </span>
                    </div>
                    <a
                      href={`http://localhost:8000/payment-slips/${selectedOrder.payment_slip_url.split('/').pop()}`}
                      target="_blank" rel="noopener noreferrer" className="btn btn-primary"
                      style={{ padding: '6px 12px', textDecoration: 'none', fontSize: '12px', display: 'inline-flex', marginBottom: '8px' }}
                    >
                      <FileText size={14} /> View Slip
                    </a>
                    {selectedOrder.payment_slip_status === 'pending_review' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn" style={{ padding: '4px 10px', background: '#d4edda', color: '#155724', fontSize: '12px' }}
                                onClick={async () => {
                                  const token = localStorage.getItem('token');
                                  const res = await fetch(`http://localhost:8000/orders/${selectedOrder.id}/review-slip`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify({ action: 'approve' })
                                  });
                                  if (res.ok) {
                                    const data = await res.json();
                                    const updated = { ...selectedOrder, payment_slip_status: 'approved', current_status: data.new_status };
                                    setSelectedOrder(updated);
                                    setOrders(orders.map(o => o.id === selectedOrder.id ? updated : o));
                                  }
                                }}>Approve</button>
                        <button className="btn" style={{ padding: '4px 10px', background: '#f8d7da', color: '#721c24', fontSize: '12px' }}
                                onClick={async () => {
                                  const token = localStorage.getItem('token');
                                  const res = await fetch(`http://localhost:8000/orders/${selectedOrder.id}/review-slip`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify({ action: 'reject' })
                                  });
                                  if (res.ok) {
                                    const updated = { ...selectedOrder, payment_slip_status: 'rejected' };
                                    setSelectedOrder(updated);
                                    setOrders(orders.map(o => o.id === selectedOrder.id ? updated : o));
                                  }
                                }}>Reject</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Column 2: Status Controls */}
              <div style={{ flex: 1, backgroundColor: 'var(--bg-muted)', padding: '15px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h4 style={{ margin: '0 0 15px 0', textAlign: 'center', color: 'var(--text-main)' }}>Update Status</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['Pending', 'Processing', 'Out for Delivery', 'Completed', 'Cancelled'].map(status => (
                    <button 
                      key={status}
                      onClick={() => updateOrderStatus(selectedOrder.id, status)}
                      disabled={selectedOrder.current_status === status}
                      className="btn"
                      style={{ 
                        padding: '8px 12px', fontSize: '13px',
                        backgroundColor: selectedOrder.current_status === status ? 'var(--color-primary)' : 'var(--bg-surface)',
                        color: selectedOrder.current_status === status ? 'white' : 'var(--text-main)',
                        border: '1px solid var(--border-light)'
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* NEW: Driver Assignment Section */}
            <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '15px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} /> Driver Assignment
              </h4>
              
              {selectedOrder.delivery_info?.driver_name ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, fontSize: '15px' }}>
                    Assigned to: <strong style={{ color: 'var(--color-primary)' }}>{selectedOrder.delivery_info.driver_name}</strong>
                  </p>
                  <button 
                    onClick={() => {
                      const updated = { ...selectedOrder, delivery_info: { ...selectedOrder.delivery_info, driver_name: null } };
                      setSelectedOrder(updated);
                    }}
                    className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}
                  >Change Driver</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select 
                    id="driver-select"
                    className="input-field" 
                    style={{ flex: 1, margin: 0 }}
                  >
                    <option value="">-- Select an Available Driver --</option>
                    {availableDrivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <button 
                    disabled={assigning}
                    onClick={() => {
                      const dId = document.getElementById('driver-select').value;
                      if (!dId) return alert("Please select a driver first");
                      assignDriver(selectedOrder.id, dId);
                    }}
                    className="btn btn-primary"
                  >
                    {assigning ? 'Assigning...' : 'Assign Driver'}
                  </button>
                </div>
              )}
              {availableDrivers.length === 0 && !selectedOrder.delivery_info?.driver_name && (
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#e11d48' }}>
                  ⚠ No available drivers found. Make sure drivers are marked as available.
                </p>
              )}
            </div>

            <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}>Packing List (Shelf Pickups)</h4>

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