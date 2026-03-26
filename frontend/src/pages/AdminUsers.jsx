import React, { useState, useEffect } from 'react';
import { User, Shield, Users, UserCheck, Search, ToggleLeft, ToggleRight } from 'lucide-react';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, admins: 0, customers: 0 });
  const token = localStorage.getItem('token');

  const fetchUsers = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch('http://localhost:8000/users/', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:8000/users/stats', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) { console.error(error); }
  };

  const handleToggleStatus = async (userId) => {
    await fetch(`http://localhost:8000/users/${userId}/status`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    fetchUsers();
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = users.filter(u => {
    const searchString = `${u.name || ''} ${u.email}`.toLowerCase();
    return searchString.includes(searchQuery.toLowerCase());
  }).sort((a, b) => b.user_id - a.user_id);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
        <div>
          <h1 className="text-title" style={{ fontSize: '28px', marginBottom: '6px' }}>User Management</h1>
          <p className="text-subtitle" style={{ fontSize: '14px', margin: 0 }}>Manage system users and access controls</p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {[
          { label: 'Total Users',    value: stats.total,     icon: Users,     color: '#3b82f6' },
          { label: 'Active Users',   value: stats.active,    icon: UserCheck, color: 'var(--color-primary)' },
          { label: 'Administrators', value: stats.admins,    icon: Shield,    color: '#a855f7' },
          { label: 'Customers',      value: stats.customers, icon: User,      color: '#f97316' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</p>
              <h2 style={{ fontSize: '28px', margin: 0, color: 'var(--text-main)' }}>{value}</h2>
            </div>
            <Icon size={22} color={color} />
          </div>
        ))}
      </div>

      {/* TABLE CARD */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '38px', fontSize: '14px' }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                {['ID', 'Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)' }}>No users found.</td></tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.user_id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '14px 10px', fontSize: '13px', color: 'var(--text-muted)' }}>U{String(u.user_id).padStart(3, '0')}</td>
                    <td style={{ padding: '14px 10px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>{u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || '—'}</td>
                    <td style={{ padding: '14px 10px', fontSize: '13px', color: 'var(--text-muted)' }}>{u.email}</td>

                    <td style={{ padding: '14px 10px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', backgroundColor: u.role === 'admin' ? '#f3e8ff' : '#eff6ff', color: u.role === 'admin' ? '#a855f7' : '#3b82f6' }}>
                        {u.role === 'admin' && <Shield size={11} style={{ marginRight: '3px', verticalAlign: 'middle' }} />}{u.role?.charAt(0).toUpperCase() + u.role?.slice(1)}
                      </span>
                    </td>

                    <td style={{ padding: '14px 10px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', backgroundColor: u.is_active ? '#eefcf2' : '#fef2f2', color: u.is_active ? 'var(--color-primary)' : '#ef4444' }}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button title={u.is_active ? 'Suspend' : 'Activate'} onClick={() => handleToggleStatus(u.user_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: u.is_active ? '#f59e0b' : 'var(--color-primary)' }}>
                        {u.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
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