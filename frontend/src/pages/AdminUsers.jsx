import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { Shield, User as UserIcon, Mail, Ban, CheckCircle, Search, Filter } from 'lucide-react';

const UserRowSkeleton = () => (
  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
    <td style={{ padding: '16px' }}><div className="skeleton skeleton-text short" style={{ margin: 0 }}></div></td>
    <td style={{ padding: '16px' }}><div className="skeleton skeleton-text" style={{ margin: 0, width: '70%' }}></div></td>
    <td style={{ padding: '16px' }}><div className="skeleton skeleton-text" style={{ margin: 0, width: '50%' }}></div></td>
    <td style={{ padding: '16px' }}><div className="skeleton skeleton-text short" style={{ margin: 0, height: '28px', borderRadius: '14px' }}></div></td>
    <td style={{ padding: '16px' }}><div className="skeleton skeleton-text short" style={{ margin: 0, height: '28px', borderRadius: '14px' }}></div></td>
    <td style={{ padding: '16px' }}><div className="skeleton skeleton-btn" style={{ margin: 0, height: '32px', width: '80px' }}></div></td>
  </tr>
);

function AdminUsers() {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- FILTER & SORT STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:8000/users');
      if (res.ok) setUsers(await res.json());
      else addToast("Failed to fetch users", "error");
    } catch (error) {
      addToast("Network error. Could not connect to server.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // --- HANDLERS ---
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`http://localhost:8000/users/${userId}?role=${newRole}`, { method: 'PUT' });
      if (res.ok) {
        addToast(`User role updated to ${newRole}`, "success");
        setUsers(users.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
      } else { addToast("Failed to update user role", "error"); }
    } catch (error) { addToast("Network error occurred", "error"); }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = !user.is_active;
    const actionText = newStatus ? "reactivate" : "suspend";
    
    if (!window.confirm(`Are you sure you want to ${actionText} this user's account?`)) return;
    
    try {
      const res = await fetch(`http://localhost:8000/users/${user.user_id}?is_active=${newStatus}`, { method: 'PUT' });
      if (res.ok) {
        addToast(`Account ${newStatus ? 'reactivated' : 'suspended'} successfully`, "success");
        setUsers(users.map(u => u.user_id === user.user_id ? { ...u, is_active: newStatus } : u));
      } else { addToast("Failed to update account status", "error"); }
    } catch (error) { addToast("Network error occurred", "error"); }
  };

  // --- FILTER LOGIC ---
  const filteredUsers = users.filter(u => {
    const searchString = `${u.first_name || ''} ${u.last_name || ''} ${u.email}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && u.is_active) || 
                          (statusFilter === 'suspended' && !u.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  }).sort((a, b) => b.user_id - a.user_id); // Default sort: Newest first

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 className="text-title" style={{ fontSize: '28px', marginBottom: '5px' }}>User Management</h1>
        <p className="text-subtitle">View, filter, and manage staff and customer accounts securely.</p>
      </div>

      {/* --- CONTROL BAR: Search & Filters --- */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search size={18} color="var(--text-light)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field" 
            style={{ paddingLeft: '40px' }} 
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Filter size={18} color="var(--text-muted)" />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input-field" style={{ width: '150px', cursor: 'pointer' }}>
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="staff">Staff</option>
            <option value="admin">Admins</option>
            <option value="driver">Drivers</option>
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field" style={{ width: '160px', cursor: 'pointer' }}>
            <option value="all">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="suspended">Suspended Accounts</option>
          </select>
        </div>
      </div>

      {/* --- USERS TABLE --- */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--bg-muted)', borderBottom: '1px solid var(--border-light)' }}>
              <tr>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px' }}>ID</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px' }}>Name</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px' }}>Email</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px' }}>Status</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px' }}>Role</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <UserRowSkeleton key={i} />)
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    <UserIcon size={48} style={{ opacity: 0.5, marginBottom: '15px' }} />
                    <p style={{ fontSize: '16px' }}>No users found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.user_id} style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: user.is_active ? 'transparent' : 'rgba(239, 68, 68, 0.02)' }}>
                    <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: '500' }}>#{user.user_id}</td>
                    
                    {/* User Profile Cell */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', backgroundColor: user.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: user.is_active ? 'var(--color-primary)' : 'var(--color-danger)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                          {(user.first_name?.[0] || 'U').toUpperCase()}
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-main)', fontWeight: '500', display: 'block', textDecoration: user.is_active ? 'none' : 'line-through', opacity: user.is_active ? 1 : 0.6 }}>
                            {user.first_name} {user.last_name}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={14} /> {user.email}
                      </div>
                    </td>
                    
                    {/* Status Badge */}
                    <td style={{ padding: '16px' }}>
                       <span style={{ 
                         padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                         backgroundColor: user.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                         color: user.is_active ? 'var(--color-primary)' : 'var(--color-danger)'
                       }}>
                         {user.is_active ? 'Active' : 'Suspended'}
                       </span>
                    </td>

                    {/* Role Selector */}
                    <td style={{ padding: '16px' }}>
                      <select 
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                        disabled={!user.is_active}
                        className="input-field"
                        style={{ 
                          padding: '6px 12px', borderRadius: '20px', 
                          backgroundColor: user.role === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-app)',
                          color: user.role === 'admin' ? 'var(--color-info)' : 'var(--text-main)',
                          fontWeight: '600', fontSize: '13px', cursor: user.is_active ? 'pointer' : 'not-allowed', width: '110px', opacity: user.is_active ? 1 : 0.5
                        }}
                      >
                        <option value="customer">Customer</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                        <option value="driver">Driver</option>
                      </select>
                    </td>
                    
                    {/* Suspend / Reactivate Action */}
                    <td style={{ padding: '16px' }}>
                      <button 
                        onClick={() => handleToggleStatus(user)}
                        className="btn btn-secondary" 
                        style={{ 
                          padding: '8px', 
                          color: user.is_active ? 'var(--color-warning)' : 'var(--color-primary)', 
                          backgroundColor: 'transparent', 
                          border: '1px solid var(--border-light)' 
                        }}
                        title={user.is_active ? "Suspend Account" : "Reactivate Account"}
                      >
                        {user.is_active ? <Ban size={16} /> : <CheckCircle size={16} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;