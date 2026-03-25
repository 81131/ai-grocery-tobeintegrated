import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Package, Truck, ShoppingCart, 
  MessageSquare, Bot, BarChart2, Settings, Search, Bell, ShoppingBag, Star
} from 'lucide-react';

import AdminOrders from './AdminOrders';
import AdminInventory from './AdminInventory';
import AdminSuppliers from './AdminSuppliers';
import AdminDelivery from './AdminDelivery';
import AdminDashboard from './AdminDashboard'; 
import AdminUsers from './AdminUsers';
import AdminDrivers from './AdminDrivers';

function AdminPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const navigate = useNavigate();

  // NEW: Notification States
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/orders/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setNotifications(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const toggleNotifications = () => {
    if (!showNotifications) fetchNotifications(); // Fetch fresh data when opening
    setShowNotifications(!showNotifications);
  };

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'drivers', label: 'Delivery Drivers', icon: Truck }, 
    { id: 'inventory', label: 'Products & Inventory', icon: Package },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'chatbot', label: 'Chatbot Support', icon: Bot },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart2 },
    { id: 'delivery', label: 'Settings', icon: Settings }, 
  ];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', backgroundColor: 'var(--bg-app)', fontFamily: '"Inter", sans-serif' }}>
      
      {/* LEFT SIDEBAR */}
      <div style={{ width: '260px', backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ backgroundColor: 'var(--color-primary)', padding: '6px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag color="white" size={20} />
          </div>
          <h2 className="text-title" style={{ fontSize: '20px' }}>Ransara</h2>
        </div>
        
        <nav style={{ flex: 1, padding: '0 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                  width: '100%', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '14px', textAlign: 'left', transition: 'all 0.2s ease'
                }}
              >
                <Icon size={20} color={isActive ? 'var(--color-primary)' : 'var(--text-muted)'} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
<header style={{ height: '70px', backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            
            {/* UPDATED: Interactive Notification Bell */}
            <div style={{ position: 'relative' }}>
              <div style={{ cursor: 'pointer', position: 'relative' }} onClick={toggleNotifications}>
                <Bell size={22} color="var(--text-muted)" />
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: 'var(--color-danger)', color: 'white', fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                  !
                </span>
              </div>

              {/* NEW: Notification Dropdown Popover */}
              {showNotifications && (
                <div className="card" style={{ position: 'absolute', top: '35px', right: '0', width: '320px', padding: '0', zIndex: 1000, boxShadow: 'var(--shadow-hover)' }}>
                  <div style={{ padding: '15px', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-muted)', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }}>
                    <h3 className="text-title" style={{ fontSize: '16px', margin: 0 }}>Recent Order Activity</h3>
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px' }}>
                    {notifications.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '20px 0' }}>No recent activity.</p>
                    ) : (
                      notifications.map((notif, idx) => (
                        <div key={idx} style={{ padding: '12px', borderBottom: '1px solid var(--bg-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>Order #{notif.order_id}</span>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Status updated to <strong style={{ color: 'var(--color-primary)' }}>{notif.status}</strong></span>
                          <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>{new Date(notif.changed_at).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <div style={{ width: '36px', height: '36px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-primary-hover)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>AD</div>
              <span className="text-title" style={{ fontSize: '14px', fontWeight: '500' }}>Admin</span>
            </div>
          </div>
        </header>        
        
        <main style={{ flex: 1, padding: '30px', overflowY: 'auto', backgroundColor: 'var(--bg-app)' }}>
          {activeTab === 'dashboard' && <AdminDashboard />}
          {activeTab === 'inventory' && <AdminInventory />}
          {activeTab === 'suppliers' && <AdminSuppliers />}
          {activeTab === 'orders' && <AdminOrders />}
          {activeTab === 'delivery' && <AdminDelivery />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'drivers' && <AdminDrivers />} 

          {['feedback', 'chatbot', 'reports'].includes(activeTab) && (
            <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-muted)' }}>
              <h2>Coming Soon</h2>
              <p>The {activeTab} module is currently under development.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;