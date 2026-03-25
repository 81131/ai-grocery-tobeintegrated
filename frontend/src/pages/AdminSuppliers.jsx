import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Edit, History, Copy, Check, X } from 'lucide-react';

const ContactLink = ({ text, type }) => {
  const [copied, setCopied] = useState(false);
  
  if (!text) return <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>N/A</span>;
  
  const href = type === 'email' ? `mailto:${text}` : `tel:${text}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); 
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <a href={href} style={{ color: 'var(--color-info)', textDecoration: 'none', fontSize: '14px' }}>
        {text}
      </a>
      <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: copied ? 'var(--color-primary)' : 'var(--text-light)', transition: 'color 0.2s' }} title="Copy to clipboard">
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
};

function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [historyLog, setHistoryLog] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const navigate = useNavigate();
  
  const initialFormState = { name: '', contact_email: '', contact_phone: '', contact_person: '', address: '', payment_terms: '' };
  const [formData, setFormData] = useState(initialFormState);

  const fetchSuppliers = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    const res = await fetch('http://localhost:8000/suppliers/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setSuppliers(await res.json());
  };

  useEffect(() => { fetchSuppliers(); }, [navigate]);

  const handleEditClick = (supplier) => {
    setFormData({
      name: supplier.name || '',
      contact_email: supplier.contact_email || '',
      contact_phone: supplier.contact_phone || '',
      contact_person: supplier.contact_person || '',
      address: supplier.address || '',
      payment_terms: supplier.payment_terms || ''
    });
    setEditingId(supplier.id);
    setShowForm(true);
  };

  const handleViewHistory = async (supplierId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:8000/suppliers/${supplierId}/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      setHistoryLog(await res.json());
      setShowHistoryModal(true);
    } else {
      alert("Failed to fetch history");
    }
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const payload = {
      name: formData.name.trim(),
      contact_email: formData.contact_email.trim() || null,
      contact_phone: formData.contact_phone.trim() || null,
      contact_person: formData.contact_person.trim() || null,
      address: formData.address.trim() || null,
      payment_terms: formData.payment_terms.trim() || null,
    };

    const url = editingId ? `http://localhost:8000/suppliers/${editingId}` : 'http://localhost:8000/suppliers/';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      handleCancelForm();
      fetchSuppliers();
    } else {
      const err = await res.json();
      alert("Error: " + err.detail);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="text-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building2 color="var(--color-primary)" /> Supplier Management
        </h2>
        <button onClick={showForm ? handleCancelForm : () => setShowForm(true)} className={`btn ${showForm ? '' : 'btn-primary'}`} style={{ backgroundColor: showForm ? 'var(--color-danger)' : '', color: 'white' }}>
          {showForm ? "Cancel" : <><Plus size={16} /> Add New Supplier</>}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '20px', border: editingId ? '2px solid var(--color-warning)' : '1px solid var(--border-light)' }}>
          <h3 style={{ marginTop: 0, color: editingId ? 'var(--color-warning)' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editingId ? <><Edit size={20} /> Edit Supplier</> : "Register Supplier"}
          </h3>
          <form onSubmit={handleSaveSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <input type="text" className="input-field" placeholder="Company Name *" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ flex: 1 }} />
              <input type="text" className="input-field" placeholder="Contact Person" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} style={{ flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <input type="email" className="input-field" placeholder="Email Address" value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})} style={{ flex: 1 }} />
              <input type="text" className="input-field" placeholder="Phone Number" value={formData.contact_phone} onChange={e => setFormData({...formData, contact_phone: e.target.value})} style={{ flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <input type="text" className="input-field" placeholder="Physical Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ flex: 2 }} />
              <input type="text" className="input-field" placeholder="Payment Terms (e.g., Net 30)" value={formData.payment_terms} onChange={e => setFormData({...formData, payment_terms: e.target.value})} style={{ flex: 1 }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', backgroundColor: editingId ? 'var(--color-warning)' : 'var(--color-primary)' }}>
              {editingId ? "Update Supplier Info" : "Save Supplier"}
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--bg-muted)', borderBottom: '2px solid var(--border-light)' }}>
            <tr>
              <th style={{ padding: '15px', color: 'var(--text-muted)', width: '60px' }}>ID</th>
              <th style={{ padding: '15px', color: 'var(--text-muted)' }}>Company</th>
              <th style={{ padding: '15px', color: 'var(--text-muted)' }}>Contact Person</th>
              <th style={{ padding: '15px', color: 'var(--text-muted)' }}>Email</th>
              <th style={{ padding: '15px', color: 'var(--text-muted)' }}>Phone</th>
              <th style={{ padding: '15px', color: 'var(--text-muted)' }}>Terms</th>
              <th style={{ padding: '15px', color: 'var(--text-muted)', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)' }}>No suppliers registered yet.</td></tr>
            ) : (
              suppliers.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: 'var(--text-main)' }}>#{s.id}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: 'var(--text-main)' }}>{s.name}</td>
                  <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{s.contact_person || <span style={{ color: 'var(--text-light)' }}>-</span>}</td>
                  <td style={{ padding: '15px' }}><ContactLink text={s.contact_email} type="email" /></td>
                  <td style={{ padding: '15px' }}><ContactLink text={s.contact_phone} type="phone" /></td>
                  <td style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '14px' }}>
                    {s.payment_terms ? <span style={{ backgroundColor: 'var(--bg-muted)', padding: '4px 8px', borderRadius: '4px' }}>{s.payment_terms}</span> : <span style={{ color: 'var(--text-light)' }}>-</span>}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button onClick={() => handleEditClick(s)} className="btn" style={{ padding: '6px 10px', backgroundColor: 'var(--color-warning)', color: '#fff', fontSize: '12px' }}>
                      <Edit size={14} /> Edit
                    </button>
                    <button onClick={() => handleViewHistory(s.id)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }}>
                      <History size={14} /> History
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showHistoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <h3 className="text-title">Audit Log</h3>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                <X size={20} />
              </button>
            </div>
            
            {historyLog.length === 0 ? (
              <p style={{ color: 'var(--text-light)', textAlign: 'center' }}>No edits have been made to this supplier.</p>
            ) : (
              historyLog.map(log => {
                const changes = JSON.parse(log.changes);
                return (
                  <div key={log.id} style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-info)' }}>
                    <p className="text-subtitle" style={{ margin: '0 0 8px 0', fontSize: '12px' }}>
                      <strong>Admin ID:</strong> {log.edited_by} • {new Date(log.timestamp).toLocaleString()}
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-main)' }}>
                      {Object.keys(changes).map(field => (
                        <li key={field}>
                          <strong>{field.replace('_', ' ')}:</strong> <span style={{ textDecoration: 'line-through', color: 'var(--color-danger)' }}>{changes[field].old || 'N/A'}</span> ➔ <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{changes[field].new || 'N/A'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSuppliers;