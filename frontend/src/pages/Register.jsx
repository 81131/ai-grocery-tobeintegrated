import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { User, Mail, Lock, UserPlus, ArrowRight } from 'lucide-react';

function Register() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  // UPDATED: Replaced 'username' with 'firstName' and 'lastName'
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      addToast("Passwords do not match!", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // UPDATED: Sending the exact keys your backend User model expects
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password
        }),
      });

      if (response.ok) {
        addToast("Registration successful! Welcome to Ransara Fresh.", "success");
        navigate('/login');
      } else {
        const errorData = await response.json();
        addToast(errorData.detail || "Registration failed. Please try again.", "error");
      }
    } catch (error) {
      console.error("Registration error:", error);
      addToast("A network error occurred. Please try again later.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '40px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ 
            backgroundColor: 'rgba(16, 185, 129, 0.1)', 
            width: '60px', height: '60px', 
            borderRadius: '50%', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            margin: '0 auto 15px auto',
            color: 'var(--color-primary)'
          }}>
            <UserPlus size={30} />
          </div>
          <h2 className="text-title" style={{ fontSize: '28px', marginBottom: '8px' }}>Create an Account</h2>
          <p className="text-subtitle">Join us to start shopping for fresh groceries.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* UPDATED: Side-by-side First Name and Last Name inputs */}
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <User size={18} color="var(--text-light)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                name="firstName" 
                placeholder="First Name" 
                required 
                value={formData.firstName} 
                onChange={handleChange} 
                className="input-field" 
                style={{ paddingLeft: '42px' }} 
              />
            </div>
            
            <div style={{ position: 'relative', flex: 1 }}>
              <User size={18} color="var(--text-light)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                name="lastName" 
                placeholder="Last Name" 
                required 
                value={formData.lastName} 
                onChange={handleChange} 
                className="input-field" 
                style={{ paddingLeft: '42px' }} 
              />
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <Mail size={18} color="var(--text-light)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="email" 
              name="email" 
              placeholder="Email Address" 
              required 
              value={formData.email} 
              onChange={handleChange} 
              className="input-field" 
              style={{ paddingLeft: '42px' }} 
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} color="var(--text-light)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              required 
              value={formData.password} 
              onChange={handleChange} 
              className="input-field" 
              style={{ paddingLeft: '42px' }} 
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} color="var(--text-light)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="password" 
              name="confirmPassword" 
              placeholder="Confirm Password" 
              required 
              value={formData.confirmPassword} 
              onChange={handleChange} 
              className="input-field" 
              style={{ paddingLeft: '42px' }} 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading} 
            className="btn btn-primary" 
            style={{ padding: '14px', fontSize: '16px', marginTop: '10px', opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'} <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '25px', paddingTop: '20px', borderTop: '1px solid var(--border-light)' }}>
          <p className="text-subtitle" style={{ fontSize: '14px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none' }}>
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;