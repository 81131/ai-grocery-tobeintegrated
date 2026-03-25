import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, Package, Bell, Settings, LogOut } from 'lucide-react';

import Home from './pages/Home';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import Notifications from './pages/Notifications';
import ProductDetails from './pages/ProductDetails';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'customer');

const [isActive, setIsActive] = useState(localStorage.getItem('isActive') !== 'false');

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('isActive'); 
  setIsLoggedIn(false);
  setUserRole('customer');
  setIsActive(true); 
  window.location.href = '/'; 
};

  return (
    <Router>
      <div>
        <nav style={{ 
          padding: '15px 40px', backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 1000
        }}>
          <Link to="/" style={{ color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={28} />
            <h1 className="text-title" style={{ fontSize: '22px' }}>Ransara Fresh</h1>
          </Link>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', fontWeight: '500' }}>
            <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
            
            {isLoggedIn ? (
              <>
                <Link to="/cart" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}><ShoppingCart size={18}/> Cart</Link>
                <Link to="/orders" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}><Package size={18}/> Orders</Link>
                <Link to="/notifications" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}><Bell size={20}/></Link>
                
                {userRole === 'admin' && (
                  <Link to="/admin" className="btn btn-secondary" style={{ textDecoration: 'none', padding: '8px 16px' }}>
                    <Settings size={16}/> Admin Suite
                  </Link>
                )}
                
                <button onClick={handleLogout} className="btn" style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: '8px 16px' }}>
                  <LogOut size={16}/> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Login</Link>
                <Link to="/register" className="btn btn-primary" style={{ textDecoration: 'none', padding: '8px 16px' }}>Register</Link>
              </>
            )}
          </div>
        </nav>
        
        
        {isLoggedIn && !isActive && (
          <div style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: '12px 20px', textAlign: 'center', fontWeight: '500', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span> 
            Your account has been suspended. You are restricted from placing orders. 
            <a href="mailto:admin@ransarafresh.com" style={{ color: 'white', textDecoration: 'underline', fontWeight: 'bold', marginLeft: '10px' }}>Contact Administration</a>
          </div>
        )}

    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 30px', minHeight: 'calc(100vh - 70px)' }}>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
            <Route 
              path="/login" 
              element={<Login setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} setIsActive={setIsActive} />} 
            />            
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/product/:id" element={<ProductDetails />} />
          </Routes>
      </div>
      </div>
    </Router>
  );
}

export default App;