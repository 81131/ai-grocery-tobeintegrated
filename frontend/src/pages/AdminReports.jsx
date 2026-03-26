import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart2, ShoppingBag, DollarSign, Loader2 } from 'lucide-react';

const STATUS_COLORS = {
  Pending:    '#f59e0b',
  Processing: '#3b82f6',
  Shipped:    '#a855f7',
  Delivered:  '#00a247',
  Cancelled:  '#ef4444',
};

function BarChart({ data, maxVal }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '160px', paddingTop: '10px' }}>
      {data.map((d, i) => {
        const pct = maxVal > 0 ? (d.revenue / maxVal) * 100 : 0;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>${d.revenue > 0 ? (d.revenue >= 1000 ? (d.revenue/1000).toFixed(1)+'k' : d.revenue.toFixed(0)) : 0}</span>
            <div style={{ width: '100%', backgroundColor: 'var(--color-primary)', borderRadius: '6px 6px 0 0', height: `${Math.max(pct, 2)}%`, transition: 'height 0.6s ease', opacity: 0.85 + (0.15 * (i / data.length)) }}></div>
            <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

function PieChart({ data }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px 0' }}>No order data yet.</p>;

  const colors = Object.values(STATUS_COLORS);
  let cumAngle = 0;
  const arcs = data.filter(d => d.count > 0).map((d, i) => {
    const angle = (d.count / total) * 360;
    const arc = { status: d.status, count: d.count, pct: ((d.count / total) * 100).toFixed(1), start: cumAngle, angle, color: colors[i % colors.length] };
    cumAngle += angle;
    return arc;
  });

  const describeArc = (cx, cy, r, startAngle, endAngle) => {
    const toRad = a => (a - 90) * Math.PI / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        {arcs.map((arc, i) => (
          <path key={i} d={describeArc(80, 80, 70, arc.start, arc.start + arc.angle)} fill={arc.color} stroke="white" strokeWidth="2" />
        ))}
        <circle cx="80" cy="80" r="30" fill="white" />
        <text x="80" y="84" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text-main)">{total}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {arcs.map((arc) => (
          <div key={arc.status} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: arc.color, flexShrink: 0 }}></div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{arc.status}</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginLeft: 'auto' }}>{arc.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:8000/orders/reports', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <Loader2 size={36} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const maxRevenue = data ? Math.max(...(data.revenue_by_month || []).map(d => d.revenue)) : 0;

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="text-title" style={{ fontSize: '26px', marginBottom: '6px' }}>Reports & Analytics</h1>
        <p className="text-subtitle" style={{ fontSize: '14px' }}>Business performance overview</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Total Revenue</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-main)' }}>${data?.summary?.total_revenue?.toFixed(2) ?? '0.00'}</p>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#eefcf2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={24} color="var(--color-primary)" />
          </div>
        </div>
        <div className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Total Orders</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-main)' }}>{data?.summary?.total_orders ?? 0}</p>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={24} color="#3b82f6" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <TrendingUp size={16} color="var(--color-primary)" />
            <h3 className="text-title" style={{ fontSize: '15px' }}>Revenue by Month</h3>
          </div>
          <p className="text-subtitle" style={{ fontSize: '13px', marginBottom: '20px' }}>Last 6 months</p>
          {data?.revenue_by_month ? <BarChart data={data.revenue_by_month} maxVal={Math.max(maxRevenue, 1)} /> : <p>No data</p>}
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <BarChart2 size={16} color="var(--color-primary)" />
            <h3 className="text-title" style={{ fontSize: '15px' }}>Orders by Status</h3>
          </div>
          <p className="text-subtitle" style={{ fontSize: '13px', marginBottom: '20px' }}>Current distribution</p>
          {data?.orders_by_status ? <PieChart data={data.orders_by_status} /> : <p>No data</p>}
        </div>
      </div>

      {/* Top Products Table */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <ShoppingBag size={16} color="var(--color-primary)" />
          <h3 className="text-title" style={{ fontSize: '15px' }}>Top Selling Products</h3>
        </div>
        <p className="text-subtitle" style={{ fontSize: '13px', marginBottom: '18px' }}>By total quantity sold</p>

        {!data?.top_products || data.top_products.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '30px 0' }}>No sales data yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                {['#', 'Product', 'Qty Sold', 'Revenue'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.top_products.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '14px 12px', fontSize: '13px', color: 'var(--text-light)' }}>#{i + 1}</td>
                  <td style={{ padding: '14px 12px', fontWeight: '500', color: 'var(--text-main)', fontSize: '14px' }}>{p.name}</td>
                  <td style={{ padding: '14px 12px', fontSize: '14px', color: 'var(--text-main)' }}>{p.qty_sold}</td>
                  <td style={{ padding: '14px 12px', fontWeight: '600', color: 'var(--color-primary)', fontSize: '14px' }}>${p.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
