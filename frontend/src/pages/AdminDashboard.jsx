import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, Clock, Truck, AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const STATUS_STYLES = {
  Delivered:  { bg: '#eefcf2', color: '#00a247', icon: CheckCircle },
  Processing: { bg: '#eff6ff', color: '#3b82f6', icon: Clock },
  Shipped:    { bg: '#faf5ff', color: '#a855f7', icon: Truck },
  Pending:    { bg: '#fffbeb', color: '#f59e0b', icon: AlertCircle },
  Cancelled:  { bg: '#fef2f2', color: '#ef4444', icon: AlertCircle },
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState(null);

  const fetchDash = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch('http://localhost:8000/orders/dashboard-stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => setDashData(d))
      .catch(() => setDashData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDash(); }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', marginBottom: '15px', color: 'var(--color-primary)' }} />
        <p>Loading dashboard...</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const recent = dashData?.recentOrders || [];
  const lowStock = dashData?.lowStockItems || [];
  const stats = dashData?.stats || {};

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="text-title" style={{ fontSize: '26px', marginBottom: '4px' }}>Dashboard</h1>
          <p className="text-subtitle" style={{ fontSize: '14px' }}>Welcome back! Here's what's happening with your store today.</p>
        </div>
        <button onClick={fetchDash} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* STAT CARDS */}
      {stats.totalOrders !== undefined && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Revenue', value: `$${(stats.totalRevenue || 0).toFixed(2)}`, color: 'var(--color-primary)' },
            { label: 'Total Orders', value: stats.totalOrders ?? 0, color: '#3b82f6' },
            { label: 'Total Products', value: stats.totalProducts ?? 0, color: '#f97316' },
            { label: 'Active Users', value: stats.activeUsers ?? 0, color: '#a855f7' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ padding: '20px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{label}</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        {/* RECENT ORDERS */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 className="text-title" style={{ fontSize: '16px', marginBottom: '4px' }}>Recent Orders</h3>
          <p className="text-subtitle" style={{ fontSize: '13px', marginBottom: '20px' }}>Latest customer orders</p>

          {recent.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '20px 0', fontSize: '14px' }}>No orders yet.</p>
          ) : (
            recent.map((order, i) => {
              const st = STATUS_STYLES[order.status] || { bg: '#f3f4f6', color: '#6b7280', icon: AlertCircle };
              const Icon = st.icon;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: i < recent.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>{order.id}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', backgroundColor: st.bg, color: st.color }}>
                        <Icon size={11} /> {order.status}
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{order.name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>{order.time}</span>
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)' }}>{order.total}</span>
                </div>
              );
            })
          )}
        </div>

        {/* LOW STOCK */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 className="text-title" style={{ fontSize: '16px', marginBottom: '4px' }}>Low Stock Alert</h3>
          <p className="text-subtitle" style={{ fontSize: '13px', marginBottom: '20px' }}>Items running low on inventory</p>

          {lowStock.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '20px 0', fontSize: '14px' }}>No low stock items. All good! ✓</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lowStock.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AlertTriangle size={18} color="#ef4444" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.cat}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444' }}>{item.qty} units</div>
                    <div onClick={() => navigate('/admin?tab=inventory')} style={{ fontSize: '12px', color: 'var(--text-light)', cursor: 'pointer', textDecoration: 'underline' }}>Reorder now</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;