import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Search, Filter } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ProductSkeleton = () => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
    <div className="skeleton skeleton-img"></div>
    <div className="skeleton skeleton-text short" style={{ height: '12px' }}></div>
    <div className="skeleton skeleton-text title"></div>
    <div className="skeleton skeleton-text short" style={{ marginTop: '10px', height: '22px' }}></div>
    <div style={{ display: 'flex', gap: '15px', margin: '15px 0', marginTop: 'auto' }}>
       <div className="skeleton skeleton-btn" style={{ flex: 1 }}></div>
    </div>
    <div style={{ display: 'flex', gap: '10px' }}>
      <div className="skeleton skeleton-btn" style={{ flex: 1 }}></div>
      <div className="skeleton skeleton-btn" style={{ flex: 2 }}></div>
    </div>
  </div>
);

function Home() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [quantities, setQuantities] = useState({});
  const [storeItems, setStoreItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [maxPriceLimit, setMaxPriceLimit] = useState(10000);
  const [currentPriceFilter, setCurrentPriceFilter] = useState(10000);

  useEffect(() => {
    const fetchStorefront = async () => {
      try {
        const res = await fetch('http://localhost:8000/inventory/storefront');
        if (res.ok) {
          const data = await res.json();
          setStoreItems(data);
          
          if (data.length > 0) {
            const highestPrice = Math.max(...data.map(item => item.price));
            setMaxPriceLimit(Math.ceil(highestPrice));
            setCurrentPriceFilter(Math.ceil(highestPrice));
          }
        }
      } catch (error) { 
        console.error("Failed to fetch store items:", error); 
        addToast("Failed to load products. Please try again.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStorefront();
  }, [addToast]);

  const changeQty = (groupKey, delta, maxAvailable) => {
    setQuantities(prev => {
      const current = prev[groupKey] || 1;
      const next = current + delta;
      if (next < 1 || next > maxAvailable) return prev; 
      return { ...prev, [groupKey]: next };
    });
  };

  const handleAddToCart = async (item) => {
    const token = localStorage.getItem('token');
    if (!token) {
      addToast("Please log in to add items to your cart!", "info");
      navigate('/login');
      return;
    }
    const qtyToAdd = quantities[item.group_key] || 1;
    try {
      const response = await fetch('http://localhost:8000/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ batch_id: item.primary_batch_id, quantity: qtyToAdd })
      });
      if (response.ok) {
        addToast(`Added ${qtyToAdd} ${item.product_name} to cart!`, "success");
        setQuantities(prev => ({ ...prev, [item.group_key]: 1 })); 
      } else {
        const err = await response.json();
        addToast("Failed to add to cart: " + err.detail, "error");
      }
    } catch (error) { 
      console.error("Failed to add to cart:", error); 
    }
  };

  const uniqueCategories = [...new Set(storeItems.map(item => item.category).filter(Boolean))];

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const filteredItems = storeItems.filter(item => {
    const term = searchTerm.toLowerCase();
    
    const matchesSearch = 
      item.product_name.toLowerCase().includes(term) ||
      (item.category && item.category.toLowerCase().includes(term)) ||
      (item.keywords && item.keywords.toLowerCase().includes(term));
      
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category);
    
    const matchesPrice = item.price <= currentPriceFilter;

    return matchesSearch && matchesCategory && matchesPrice;
  });

return (
    /* We remove the outer padding here so the sidebar can touch the left edge */
    <div style={{ display: 'flex', alignItems: 'flex-start', textAlign: 'left', width: '100%' }}>
        
      {/* TRUE FLUSH SIDEBAR */}
      <aside className="sidebar">
        <h3 className="text-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', marginBottom: '20px' }}>
          <Filter size={18} /> Filters
        </h3>

        <div style={{ marginBottom: '25px', position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search products, tags..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', backgroundColor: 'var(--bg-muted)', border: 'none' }} 
          />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <h4 className="text-subtitle" style={{ fontWeight: 'bold', marginBottom: '10px', color: 'var(--text-main)' }}>Price Range</h4>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--color-primary)', fontWeight: 'bold' }}>
            Up to Rs. {currentPriceFilter}
          </p>
          <input 
            type="range" 
            min="0" 
            max={maxPriceLimit} 
            value={currentPriceFilter} 
            onChange={(e) => setCurrentPriceFilter(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-primary)' }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <h4 className="text-subtitle" style={{ fontWeight: 'bold', marginBottom: '10px', color: 'var(--text-main)' }}>Categories</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {uniqueCategories.map(cat => (
              <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', color: 'var(--text-main)' }}>
                <input 
                  type="checkbox" 
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                {cat}
              </label>
            ))}
            {uniqueCategories.length === 0 && !isLoading && (
              <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>No categories found.</span>
            )}
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT (Header + Product Grid) */}
      <div style={{ flex: 1, padding: '40px 50px 40px 40px', width: '100%' }}>
        
        <div style={{ marginBottom: '40px' }}>
          <h2 className="text-title" style={{ fontSize: '36px', marginBottom: '10px' }}>Fresh Groceries, Delivered.</h2>
          <p className="text-subtitle" style={{ fontSize: '18px' }}>Quality ingredients for your daily needs.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '25px' }}>          
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => <ProductSkeleton key={index} />)
          ) : filteredItems.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              <Search size={48} style={{ opacity: 0.5, marginBottom: '15px' }} />
              <h3 className="text-title" style={{ fontSize: '20px' }}>No matches found.</h3>
              <p>Try adjusting your filters or search term.</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const currentQty = quantities[item.group_key] || 1;
              return (
                <div key={item.group_key} className="card hover-card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
                  <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/product/${item.primary_batch_id}`, { state: item })}>
                    <img src={item.image} alt={item.product_name} style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '15px', backgroundColor: 'var(--bg-muted)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>{item.category}</span>
                    <h3 className="text-title" style={{ margin: '10px 0 5px 0', fontSize: '18px' }}>{item.product_name}</h3>
                  </div>

                  <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-primary)', margin: '10px 0' }}>
                    Rs. {item.price.toFixed(2)}
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 'normal' }}> / {item.unit}</span>
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', margin: '15px 0', marginTop: 'auto' }}>
                    <button onClick={() => changeQty(item.group_key, -1, item.available_qty)} className="btn btn-secondary" style={{ padding: '8px' }}><Minus size={16} /></button>
                    <span style={{ fontWeight: 'bold', fontSize: '16px', minWidth: '24px', textAlign: 'center', color: 'var(--text-main)' }}>{currentQty}</span>
                    <button onClick={() => changeQty(item.group_key, 1, item.available_qty)} className="btn btn-secondary" style={{ padding: '8px' }}><Plus size={16} /></button>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => navigate(`/product/${item.primary_batch_id}`, { state: item })} className="btn btn-secondary" style={{ flex: 1 }}>View</button>
                    <button onClick={() => handleAddToCart(item)} className="btn btn-primary" style={{ flex: 2 }}>
                      <ShoppingCart size={18} /> Add
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;