import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// 1. Add setIsActive to the accepted props
function Login({ setIsLoggedIn, setUserRole, setIsActive }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const formData = new URLSearchParams();
    formData.append('username', email); 
    formData.append('password', password);

    try {
      const response = await fetch('http://localhost:8000/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
              // 2. Save credentials to local storage
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.role); 

      // FIX: Pull from data.is_active (snake_case)
      localStorage.setItem('isActive', String(data.is_active));

      // 3. Update the state in App.jsx
      setIsLoggedIn(true); 
      setUserRole(data.role); 

      // FIX: Pull from data.is_active (snake_case)
      setIsActive(data.is_active);

      // 4. Smoothly route the user back to the Home page
      navigate('/');
            } else {
              alert('Login failed: ' + data.detail);
            }
          } catch (error) {
            console.error('Error logging in:', error);
            alert('An error occurred while trying to log in.');
          }
        };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '400px', margin: '0 auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
      <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '20px' }}>Welcome Back</h2>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
          Log In
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center', color: '#7f8c8d' }}>
        Don't have an account? <Link to="/register" style={{ color: '#4CAF50', fontWeight: 'bold', textDecoration: 'none' }}>Register here</Link>
      </p>
    </div>
  );
}

export default Login;