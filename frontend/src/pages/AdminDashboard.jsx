import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ShoppingCart, Package, Users, AlertTriangle, Loader2, CheckCircle, Clock } from 'lucide-react';

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalProducts: 0, activeUsers: 0 });

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      try {
        const response = await fetch('http://localhost:8000/orders/dashboard-stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setRecentOrders(data.recentOrders);
          setLowStockItems(data.lowStockItems);
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <Loader2 className="lucide-spin" size={40} style={{ animation: 'spin 1s linear infinite', marginBottom: '15px', color: 'var(--color-primary)' }} />
        <p>Crunching the latest numbers...</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 className="text-title" style={{ fontSize: '28px', marginBottom: '5px' }}>Dashboard</h1>
        <p className="text-subtitle">Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* --- STATS ROW --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Total Revenue</h3>
            <DollarSign color="var(--color-primary)" size={20} />
          </div>
          <h2 className="text-title" style={{ fontSize: '28px', marginBottom: '8px' }}>Rs. {stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
          <span style={{ color: 'var(--color-primary)', fontSize: '13px', fontWeight: '500' }}>↗ Lifetime Revenue</span>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Total Orders</h3>
            <ShoppingCart color="var(--color-info)" size={20} />
          </div>
          <h2 className="text-title" style={{ fontSize: '28px', marginBottom: '8px' }}>{stats.totalOrders}</h2>
          <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>All time orders</span>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Total Products</h3>
            <Package color="var(--color-warning)" size={20} />
          </div>
          <h2 className="text-title" style={{ fontSize: '28px', marginBottom: '8px' }}>{stats.totalProducts}</h2>
          <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>Active product listings</span>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Active Users</h3>
            <Users color="#a855f7" size={20} />
          </div>
          <h2 className="text-title" style={{ fontSize: '28px', marginBottom: '8px' }}>{stats.activeUsers}</h2>
          <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>Users with placed orders</span>
        </div>

      </div>

      {/* --- BOTTOM ROW --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        
        {/* Recent Orders */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 className="text-title" style={{ fontSize: '16px', marginBottom: '5px' }}>Recent Orders</h3>
          <p className="text-subtitle" style={{ marginBottom: '20px' }}>Latest customer orders</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentOrders.length > 0 ? (
              recentOrders.map((order, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '14px' }}>{order.id}</span>
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', color: order.color, backgroundColor: order.bg, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {order.status === 'Delivered' ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {order.status}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '2px' }}>{order.name}</div>
                    <div style={{ color: 'var(--text-light)', fontSize: '12px' }}>{order.time}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '16px' }}>{order.total}</div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '20px 0' }}>No recent orders to display.</p>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 className="text-title" style={{ fontSize: '16px', marginBottom: '5px' }}>Low Stock Alert</h3>
          <p className="text-subtitle" style={{ marginBottom: '20px' }}>Items running low on inventory</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <AlertTriangle color="var(--color-danger)" size={20} style={{ marginTop: '2px' }} />
                    <div>
                      <div style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>{item.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{item.cat}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--color-danger)', fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>{item.qty} units</div>
                    <div onClick={() => navigate('/admin?tab=inventory')} style={{ color: 'var(--text-light)', fontSize: '12px', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='var(--color-danger)'} onMouseLeave={e => e.target.style.color='var(--text-light)'}>
                      Reorder now
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '20px 0' }}>Inventory levels are healthy.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;