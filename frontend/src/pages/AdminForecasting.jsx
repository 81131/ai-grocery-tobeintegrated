import React, { useState, useEffect, useCallback } from 'react';
import {
  BrainCircuit, RefreshCw, TrendingUp, TrendingDown, ShieldAlert,
  CircleDollarSign, Link as LinkIcon, Save, Activity, ChevronDown,
  ChevronUp, BarChart2, Clock, Zap, AlertTriangle
} from 'lucide-react';

// ── Tiny SVG line chart ──────────────────────────────────────────────────────
function LineChart({ data, keyA, keyB, labelA, labelB, colorA = '#6366f1', colorB = '#10b981', height = 120 }) {
  if (!data || data.length < 2) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Not enough data</div>;

  const valA = data.map(d => d[keyA]);
  const valB = data.map(d => d[keyB]);
  const allVals = [...valA, ...valB];
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const range = maxV - minV || 1;
  const w = 500;

  const toY = v => height - 10 - ((v - minV) / range) * (height - 20);
  const toX = i => 10 + (i / (data.length - 1)) * (w - 20);

  const pathFor = vals => vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ');

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 0.5, 1].map((t, i) => (
          <line key={i} x1="10" x2={w - 10}
            y1={10 + t * (height - 20)} y2={10 + t * (height - 20)}
            stroke="#e5e7eb" strokeWidth="0.5" />
        ))}
        <path d={pathFor(valA)} fill="none" stroke={colorA} strokeWidth="2" strokeLinejoin="round" />
        <path d={pathFor(valB)} fill="none" stroke={colorB} strokeWidth="2" strokeLinejoin="round" strokeDasharray="5,3" />
        {/* Dots */}
        {valA.map((v, i) => <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill={colorA} />)}
        {valB.map((v, i) => <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill={colorB} />)}
      </svg>
      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)', marginTop: 4, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 16, height: 2, background: colorA, display: 'inline-block' }} />{labelA}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 16, height: 2, background: colorB, display: 'inline-block', borderTop: `2px dashed ${colorB}` }} />{labelB}</span>
      </div>
    </div>
  );
}

// ── Tiny SVG bar chart ───────────────────────────────────────────────────────
function BarChart({ data, valueKey, color = '#6366f1', height = 100 }) {
  if (!data || data.length === 0) return null;
  const vals = data.map(d => d[valueKey]);
  const maxV = Math.max(...vals, 1);
  const barW = Math.max(4, Math.floor(480 / data.length) - 4);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 500 ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
        {data.map((d, i) => {
          const bH = Math.max(2, (d[valueKey] / maxV) * (height - 16));
          const x = 10 + i * (500 / data.length);
          return (
            <rect key={i} x={x} y={height - bH - 4} width={Math.max(2, barW)} height={bH}
              rx="2" fill={color} opacity="0.85" />
          );
        })}
      </svg>
    </div>
  );
}

// ── Confidence badge ─────────────────────────────────────────────────────────
function ConfidenceBadge({ level }) {
  const map = { High: ['#d1fae5', '#065f46'], Medium: ['#fef9c3', '#854d0e'], Low: ['#fee2e2', '#991b1b'] };
  const [bg, color] = map[level] || map.Medium;
  return (
    <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Zap size={10} /> {level} Confidence
    </span>
  );
}

// ── Expiry risk bar ──────────────────────────────────────────────────────────
function ExpiryRisk({ score }) {
  const color = score > 0.6 ? '#ef4444' : score > 0.3 ? '#f59e0b' : '#10b981';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score * 100}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{Math.round(score * 100)}%</span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
function AdminForecasting() {
  const [insights, setInsights] = useState([]);
  const [lastTrained, setLastTrained] = useState(null);
  const [loading, setLoading] = useState(false);
  const [metabaseUrl, setMetabaseUrl] = useState('');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);

  useEffect(() => {
    fetchInsights();
    const saved = localStorage.getItem('ransara_metabase_url');
    if (saved) setMetabaseUrl(saved);
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/ml/insights', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights || []);
        setLastTrained(data.last_trained);
      }
    } catch (err) {
      console.error('Error fetching ML insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const trainModel = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/ml/train', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLastTrained(data.timestamp);
        fetchInsights();
      } else {
        alert('Failed to retrain model.');
      }
    } catch (err) {
      console.error('Error training model:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveMetabaseUrl = () => {
    localStorage.setItem('ransara_metabase_url', metabaseUrl);
    setIsEditingUrl(false);
  };

  const toggleCard = (idx) => setExpandedCard(prev => prev === idx ? null : idx);

  const getRecStyle = (rec) => {
    if (!rec) return {};
    if (rec.includes('BUY AND HOLD')) return { bg: '#eefcf2', color: '#166534' };
    if (rec.includes('CAUTIOUSLY')) return { bg: '#fef3c7', color: '#b45309' };
    if (rec.includes('RISK') || rec.includes('NOT RESTOCK')) return { bg: '#fef2f2', color: '#991b1b' };
    if (rec.includes('CLEARANCE')) return { bg: '#fff7ed', color: '#9a3412' };
    return { bg: '#f1f5f9', color: '#475569' };
  };

  return (
    <div style={{ padding: '0', maxWidth: 1400, margin: '0 auto' }}>
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .forecast-card { cursor: pointer; transition: box-shadow 0.2s, transform 0.15s; }
        .forecast-card:hover { box-shadow: 0 6px 24px rgba(99,102,241,0.12) !important; transform: translateY(-1px); }
        .chart-panel { animation: slideDown 0.22s ease; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .horizon-badge { display: inline-flex; flex-direction: column; align-items: center; padding: 10px 16px; border-radius: 10px; background: var(--bg-subtle, #f8fafc); border: 1px solid var(--border-light, #e5e7eb); min-width: 80px; }
      `}</style>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="text-title" style={{ fontSize: 24, display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <BrainCircuit size={28} color="var(--color-primary)" />
            AI Profit Forecasting
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
            Shelf-life–aware machine learning engine with multi-horizon demand predictions and expiry risk scoring.
          </p>
          {lastTrained && (
            <p style={{ color: 'var(--text-light)', fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Activity size={14} /> Last trained: {new Date(lastTrained).toLocaleString()}
            </p>
          )}
        </div>
        <button
          onClick={trainModel}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            backgroundColor: 'var(--color-primary)', color: 'white', border: 'none',
            padding: '10px 22px', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600, opacity: loading ? 0.7 : 1, whiteSpace: 'nowrap'
          }}
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
          {loading ? 'Training Model...' : 'Refresh ML Model'}
        </button>
      </div>

      {/* ── Metabase Section ─────────────────────────────────────────────── */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border-light)', padding: 24, marginBottom: 32, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 className="text-title" style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <BarChart2 size={20} />
              Visual Analytics (Metabase)
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              Embed a public Metabase dashboard. Visit <strong>localhost:4000</strong> to create charts connected to your live database, then copy the public share URL below.
            </p>
          </div>
          {metabaseUrl && !isEditingUrl && (
            <button onClick={() => setIsEditingUrl(true)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <LinkIcon size={14} /> Change Source
            </button>
          )}
        </div>

        {(!metabaseUrl || isEditingUrl) ? (
          <div>
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#0c4a6e' }}>
              <strong>Setup guide:</strong> Open <a href="http://localhost:4000" target="_blank" rel="noreferrer" style={{ color: '#0369a1' }}>localhost:4000</a> → Connect Postgres → Create a question → Click <strong>Sharing → Public link</strong> → Copy the URL and paste below.
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <LinkIcon size={16} color="var(--text-light)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={metabaseUrl}
                  onChange={e => setMetabaseUrl(e.target.value)}
                  placeholder="http://localhost:4000/public/dashboard/..."
                  style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: 8, border: '1px solid var(--border-light)', outline: 'none', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <button onClick={saveMetabaseUrl} style={{ background: 'var(--text-main)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                <Save size={16} /> Embed Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-light)', height: 560 }}>
            <iframe title="Metabase Analytics Dashboard" width="100%" height="100%" src={metabaseUrl} frameBorder="0" allowFullScreen />
          </div>
        )}
      </div>

      {/* ── AI Forecast Cards ─────────────────────────────────────────────── */}
      <div>
        <h2 className="text-title" style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <BrainCircuit size={20} />
          AI Forecast Directives
          <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>Click a card to view charts</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {insights.length === 0 && !loading && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', background: 'white', borderRadius: 12, border: '1px solid var(--border-light)', gridColumn: '1/-1' }}>
              No insights yet. Click <strong>Refresh ML Model</strong> to generate forecasts.
            </div>
          )}

          {loading && insights.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', background: 'white', borderRadius: 12, border: '1px solid var(--border-light)', gridColumn: '1/-1' }}>
              <RefreshCw size={24} className="spin" style={{ marginBottom: 12, color: 'var(--color-primary)' }} />
              <p>Training model on historical data...</p>
            </div>
          )}

          {insights.map((item, idx) => {
            const recStyle = getRecStyle(item.recommendation);
            const isExpanded = expandedCard === idx;
            const isInsufficient = item.status !== 'Active Forecast';

            if (isInsufficient) {
              return (
                <div key={idx} style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border-light)', padding: 24, opacity: 0.7 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>{item.product_name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
                    <ShieldAlert size={14} /> {item.status} — not enough historical data.
                  </div>
                </div>
              );
            }

            return (
              <div key={idx}>
                {/* ── Card Header ── */}
                <div
                  className="forecast-card"
                  onClick={() => toggleCard(idx)}
                  style={{ background: 'white', borderRadius: isExpanded ? '12px 12px 0 0' : 12, border: '1px solid var(--border-light)', borderBottom: isExpanded ? 'none' : undefined, padding: '20px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
                >
                  {/* Product name + recommendation */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, flex: 1, paddingRight: 10 }}>{item.product_name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                    </div>
                  </div>

                  <span style={{ background: recStyle.bg, color: recStyle.color, fontSize: 11, fontWeight: 800, padding: '5px 10px', borderRadius: 20 }}>
                    {item.recommendation}
                  </span>

                  {/* 30d/90d/180d horizons */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                    {[
                      { label: '30 Days', val: item.predicted_demand_30d },
                      { label: '90 Days', val: item.predicted_demand_90d },
                      { label: '180 Days', val: item.predicted_demand_180d },
                    ].map(h => (
                      <div key={h.label} className="horizon-badge">
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{h.label}</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>{h.val ?? '—'}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>units</span>
                      </div>
                    ))}
                  </div>

                  {/* Financials row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><CircleDollarSign size={12} /> Est. Profit (30d)</div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: '#16a34a' }}>+Rs. {item.expected_profit}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}><TrendingDown size={12} /> Worst-Case Risk</div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: '#dc2626' }}>
                        {item.theoretical_loss_risk > 0 ? `-Rs. ${item.theoretical_loss_risk}` : 'Minimal'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Expanded Chart Panel ── */}
                {isExpanded && (
                  <div className="chart-panel" style={{ background: 'white', borderRadius: '0 0 12px 12px', border: '1px solid var(--border-light)', borderTop: '1px dashed var(--border-light)', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Shelf-life stats row */}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> Avg Shelf Life</div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{item.avg_shelf_life_days}d</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={11} /> Expiry Risk Score</div>
                        <ExpiryRisk score={item.expiry_risk_score ?? 0} />
                      </div>
                      <div style={{ flex: 1, minWidth: 100 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Demand Volatility</div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>±{item.demand_volatility}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <ConfidenceBadge level={item.confidence ?? 'Medium'} />
                      </div>
                    </div>

                    {/* Price history chart */}
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TrendingUp size={14} color="var(--color-primary)" /> Buying Price vs Retail Price
                      </h4>
                      <LineChart
                        data={item.history}
                        keyA="buy_price"
                        keyB="retail_price"
                        labelA="Buying Price (Rs.)"
                        labelB="Retail Price (Rs.)"
                        colorA="#6366f1"
                        colorB="#10b981"
                      />
                    </div>

                    {/* Demand chart */}
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <BarChart2 size={14} color="#f59e0b" /> Monthly Demand (units sold)
                      </h4>
                      <BarChart data={item.history} valueKey="demand" color="#6366f1" height={90} />
                      {item.history && item.history.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                          <span>{item.history[0]?.label}</span>
                          <span>{item.history[item.history.length - 1]?.label}</span>
                        </div>
                      )}
                    </div>

                    {/* Optimal pricing row */}
                    <div style={{ display: 'flex', gap: 16, paddingTop: 12, borderTop: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Calculated Optimal Wholesale</div>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>Rs. {item.optimal_buy_price}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Expected Retail</div>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>Rs. {item.expected_retail}</div>
                      </div>
                      {item.outliers_removed > 0 && (
                        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ShieldAlert size={12} /> {item.outliers_removed} outlier(s) removed
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AdminForecasting;
