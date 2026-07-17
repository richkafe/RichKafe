import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Package, Tag, ShoppingBag,
  Plus, Edit2, Trash2, Save, X, Image,
  BarChart3, AlertCircle, Check, LogIn, Eye, EyeOff,
  ToggleLeft, ToggleRight, ArrowLeft, Settings, Upload,
  MapPin, Phone, CreditCard, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';

const API_BASE = '/api/admin';

// =====================
// API HELPERS
// =====================
async function adminFetch(path, options = {}, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': token,
      ...(options.headers || {})
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API Error');
  return data;
}

// Upload image via multipart form
async function uploadImage(file, token) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { 'x-admin-key': token },
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

// =====================
// IMAGE UPLOAD INPUT
// =====================
function ImageUploadField({ value, onChange, token, label = 'Rasm (URL yoki fayl)' }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [preview, setPreview] = useState(value || '');
  const fileInputRef = useRef(null);

  useEffect(() => { setPreview(value || ''); }, [value]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const result = await uploadImage(file, token);
      onChange(result.url);
      setPreview(result.url);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="admin-form-row">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
        <input
          className="admin-input"
          value={value || ''}
          onChange={e => { onChange(e.target.value); setPreview(e.target.value); }}
          placeholder="/images/cat_burgers.png yoki https://..."
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="admin-btn-secondary"
          style={{ padding: '8px 12px', flexShrink: 0 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Fayl yuklash"
        >
          {uploading ? '...' : <Upload size={16} />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      {uploadError && <span style={{ fontSize: '11px', color: 'var(--accent-red)' }}>{uploadError}</span>}
      {preview && (
        <div style={{ marginTop: '8px', position: 'relative', display: 'inline-block' }}>
          <img
            src={preview}
            alt="preview"
            style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <button
            type="button"
            onClick={() => { onChange(''); setPreview(''); }}
            style={{
              position: 'absolute', top: '-6px', right: '-6px',
              background: 'var(--accent-red)', border: 'none', borderRadius: '50%',
              width: '18px', height: '18px', cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X size={10} />
          </button>
        </div>
      )}
    </div>
  );
}

// =====================
// SUBCOMPONENTS
// =====================

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon" style={{ background: color + '22', color }}>
        <Icon size={20} />
      </div>
      <div>
        <p className="admin-stat-label">{label}</p>
        <p className="admin-stat-value">{value}</p>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-box" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>{title}</h3>
          <button className="admin-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="admin-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

// =====================
// CATEGORY MANAGER
// =====================
function CategoryManager({ token }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    slug: '', name_ru: '', name_uz: '', emoji: '🍽️', image_url: '', sort_order: 0, is_active: 1
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminFetch('/categories', {}, token);
      setCategories(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({
      slug: '', name_ru: '', name_uz: '', emoji: '🍽️',
      image_url: '', sort_order: categories.length + 1, is_active: 1
    });
    setShowForm(true);
    setError('');
  };

  const openEdit = (cat) => {
    setEditItem(cat);
    setForm({
      slug: cat.slug,
      name_ru: cat.name_ru,
      name_uz: cat.name_uz,
      emoji: cat.emoji || '🍽️',
      image_url: cat.image_url || '',
      sort_order: cat.sort_order || 0,
      is_active: cat.is_active ?? 1
    });
    setShowForm(true);
    setError('');
  };

  const handleSave = async () => {
    if (!form.slug || !form.name_ru || !form.name_uz) {
      setError('Slug, RU va UZ nomlar majburiy');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editItem) {
        await adminFetch(`/categories/${editItem.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...form,
            sort_order: Number(form.sort_order),
            is_active: Number(form.is_active)
          })
        }, token);
      } else {
        await adminFetch('/categories', {
          method: 'POST',
          body: JSON.stringify({ ...form, sort_order: Number(form.sort_order) })
        }, token);
      }
      setShowForm(false);
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" kategoriyasini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await adminFetch(`/categories/${id}`, { method: 'DELETE' }, token);
      load();
    } catch (e) { setError(e.message); }
  };

  const toggleActive = async (cat) => {
    try {
      await adminFetch(`/categories/${cat.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...cat, is_active: cat.is_active ? 0 : 1 })
      }, token);
      load();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h3 className="admin-section-title"><Tag size={18} /> Kategoriyalar</h3>
        <button className="admin-btn-primary" onClick={openCreate}>
          <Plus size={16} /> Qo'shish
        </button>
      </div>
      {error && <div className="admin-error">{error}</div>}
      {loading ? <p className="admin-loading">Yuklanmoqda...</p> : (
        <div className="admin-list">
          {categories.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
              Kategoriyalar yo'q. Birinchisini qo'shing!
            </p>
          )}
          {categories.map(cat => (
            <div key={cat.id} className={`admin-list-item ${!cat.is_active ? 'inactive' : ''}`}>
              {/* Category image preview */}
              {cat.image_url ? (
                <img
                  src={cat.image_url} alt={cat.name_ru}
                  className="admin-list-thumb"
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div className="admin-list-emoji" style={{ display: cat.image_url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cat.emoji}
              </div>
              <div className="admin-list-info">
                <span className="admin-list-name">{cat.name_ru} / {cat.name_uz}</span>
                <span className="admin-list-meta">
                  slug: {cat.slug} · tartib: {cat.sort_order}
                  {cat.image_url && ' · 🖼️ rasm bor'}
                </span>
              </div>
              <div className="admin-list-actions">
                <button
                  className={`admin-toggle-btn ${cat.is_active ? 'on' : 'off'}`}
                  onClick={() => toggleActive(cat)}
                  title={cat.is_active ? 'Yopish' : 'Ochish'}
                >
                  {cat.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button className="admin-icon-btn edit" onClick={() => openEdit(cat)} title="Tahrirlash">
                  <Edit2 size={16} />
                </button>
                <button className="admin-icon-btn delete" onClick={() => handleDelete(cat.id, cat.name_ru)} title="O'chirish">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editItem ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'} onClose={() => setShowForm(false)}>
          <div className="admin-form">
            {error && <div className="admin-error">{error}</div>}
            <div className="admin-form-row">
              <label>Slug (lotin harflari, bo'shliqs iz)</label>
              <input
                className="admin-input"
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') })}
                placeholder="burgers"
              />
            </div>
            <div className="admin-form-row">
              <label>Nomi (RU)</label>
              <input className="admin-input" value={form.name_ru} onChange={e => setForm({ ...form, name_ru: e.target.value })} placeholder="Бургеры" />
            </div>
            <div className="admin-form-row">
              <label>Nomi (UZ)</label>
              <input className="admin-input" value={form.name_uz} onChange={e => setForm({ ...form, name_uz: e.target.value })} placeholder="Burgerlar" />
            </div>
            <div className="admin-form-row">
              <label>Emoji</label>
              <input className="admin-input" value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} placeholder="🍔" style={{ fontSize: '20px', width: '80px' }} />
            </div>
            <ImageUploadField
              label="Kategoriya rasmi (fayl yoki URL)"
              value={form.image_url}
              onChange={url => setForm({ ...form, image_url: url })}
              token={token}
            />
            <div className="admin-form-row">
              <label>Tartib raqami</label>
              <input className="admin-input" type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} />
            </div>
            {editItem && (
              <div className="admin-form-row admin-form-toggle">
                <label>Faol</label>
                <button
                  className={`admin-toggle-btn ${form.is_active ? 'on' : 'off'}`}
                  onClick={() => setForm({ ...form, is_active: form.is_active ? 0 : 1 })}
                >
                  {form.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
              </div>
            )}
            <div className="admin-form-actions">
              <button className="admin-btn-secondary" onClick={() => setShowForm(false)}>Bekor qilish</button>
              <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saqlanmoqda...' : <><Save size={16} /> Saqlash</>}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// =====================
// PRODUCT MANAGER
// =====================
function ProductManager({ token }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [form, setForm] = useState({
    category: '', name_ru: '', name_uz: '', description_ru: '', description_uz: '',
    price: '', photo_url: '', sort_order: 0, is_active: 1
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        adminFetch('/products', {}, token),
        adminFetch('/categories', {}, token)
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({
      category: categories[0]?.slug || '',
      name_ru: '', name_uz: '', description_ru: '', description_uz: '',
      price: '', photo_url: '', sort_order: products.length + 1, is_active: 1
    });
    setShowForm(true);
    setError('');
  };

  const openEdit = (prod) => {
    setEditItem(prod);
    setForm({ ...prod, photo_url: prod.photo_url || '', price: String(prod.price) });
    setShowForm(true);
    setError('');
  };

  const handleSave = async () => {
    if (!form.category || !form.name_ru || !form.name_uz || !form.price) {
      setError('Kategoriya, RU/UZ nomlar va narx majburiy');
      return;
    }
    if (isNaN(parseInt(form.price, 10)) || parseInt(form.price, 10) <= 0) {
      setError('Narx to\'g\'ri son bo\'lishi kerak');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editItem) {
        await adminFetch(`/products/${editItem.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...form,
            price: parseInt(form.price, 10),
            sort_order: Number(form.sort_order),
            is_active: Number(form.is_active)
          })
        }, token);
      } else {
        await adminFetch('/products', {
          method: 'POST',
          body: JSON.stringify({
            ...form,
            price: parseInt(form.price, 10),
            sort_order: Number(form.sort_order)
          })
        }, token);
      }
      setShowForm(false);
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" mahsulotini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await adminFetch(`/products/${id}`, { method: 'DELETE' }, token);
      load();
    } catch (e) { setError(e.message); }
  };

  const toggleActive = async (prod) => {
    try {
      await adminFetch(`/products/${prod.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...prod, is_active: prod.is_active ? 0 : 1 })
      }, token);
      load();
    } catch (e) { setError(e.message); }
  };

  const visibleProducts = filterCat === 'all' ? products : products.filter(p => p.category === filterCat);

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h3 className="admin-section-title"><Package size={18} /> Mahsulotlar</h3>
        <button className="admin-btn-primary" onClick={openCreate}>
          <Plus size={16} /> Qo'shish
        </button>
      </div>

      {/* Category Filter */}
      <div className="admin-filter-tabs">
        <button className={`admin-filter-btn ${filterCat === 'all' ? 'active' : ''}`} onClick={() => setFilterCat('all')}>Barchasi</button>
        {categories.map(cat => (
          <button key={cat.slug} className={`admin-filter-btn ${filterCat === cat.slug ? 'active' : ''}`} onClick={() => setFilterCat(cat.slug)}>
            {cat.emoji} {cat.name_ru}
          </button>
        ))}
      </div>

      {error && <div className="admin-error">{error}</div>}
      {loading ? <p className="admin-loading">Yuklanmoqda...</p> : (
        <div className="admin-list">
          {visibleProducts.map(prod => (
            <div key={prod.id} className={`admin-list-item ${!prod.is_active ? 'inactive' : ''}`}>
              {prod.photo_url ? (
                <img src={prod.photo_url} alt={prod.name_ru} className="admin-list-thumb"
                  onError={e => { e.target.style.display = 'none'; }} />
              ) : (
                <div className="admin-list-thumb" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🍔</div>
              )}
              <div className="admin-list-info">
                <span className="admin-list-name">{prod.name_ru}</span>
                <span className="admin-list-meta">{prod.category} · {Number(prod.price).toLocaleString()} UZS{!prod.is_active ? ' · 🔴 Yopiq' : ''}</span>
              </div>
              <div className="admin-list-actions">
                <button
                  className={`admin-toggle-btn ${prod.is_active ? 'on' : 'off'}`}
                  onClick={() => toggleActive(prod)}
                  title={prod.is_active ? 'Yopish' : 'Ochish'}
                >
                  {prod.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button className="admin-icon-btn edit" onClick={() => openEdit(prod)} title="Tahrirlash"><Edit2 size={16} /></button>
                <button className="admin-icon-btn delete" onClick={() => handleDelete(prod.id, prod.name_ru)} title="O'chirish"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {visibleProducts.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>Bu kategoriyada mahsulot yo'q</p>
          )}
        </div>
      )}

      {showForm && (
        <Modal title={editItem ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'} onClose={() => setShowForm(false)}>
          <div className="admin-form">
            {error && <div className="admin-error">{error}</div>}
            <div className="admin-form-row">
              <label>Kategoriya</label>
              <select className="admin-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(cat => <option key={cat.slug} value={cat.slug}>{cat.emoji} {cat.name_ru}</option>)}
              </select>
            </div>
            <div className="admin-form-row">
              <label>Nomi (RU)</label>
              <input className="admin-input" value={form.name_ru} onChange={e => setForm({ ...form, name_ru: e.target.value })} placeholder="Рич Бургер" />
            </div>
            <div className="admin-form-row">
              <label>Nomi (UZ)</label>
              <input className="admin-input" value={form.name_uz} onChange={e => setForm({ ...form, name_uz: e.target.value })} placeholder="Rich Burger" />
            </div>
            <div className="admin-form-row">
              <label>Tavsif (RU)</label>
              <textarea className="admin-input admin-textarea" value={form.description_ru} onChange={e => setForm({ ...form, description_ru: e.target.value })} placeholder="Tavsif..." />
            </div>
            <div className="admin-form-row">
              <label>Tavsif (UZ)</label>
              <textarea className="admin-input admin-textarea" value={form.description_uz} onChange={e => setForm({ ...form, description_uz: e.target.value })} placeholder="Tavsif..." />
            </div>
            <div className="admin-form-row">
              <label>Narx (UZS)</label>
              <input className="admin-input" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="32000" />
            </div>
            <ImageUploadField
              label="Mahsulot rasmi (fayl yoki URL)"
              value={form.photo_url}
              onChange={url => setForm({ ...form, photo_url: url })}
              token={token}
            />
            <div className="admin-form-row">
              <label>Tartib raqami</label>
              <input className="admin-input" type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} />
            </div>
            {editItem && (
              <div className="admin-form-row admin-form-toggle">
                <label>Faol</label>
                <button
                  className={`admin-toggle-btn ${form.is_active ? 'on' : 'off'}`}
                  onClick={() => setForm({ ...form, is_active: form.is_active ? 0 : 1 })}
                >
                  {form.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
              </div>
            )}
            <div className="admin-form-actions">
              <button className="admin-btn-secondary" onClick={() => setShowForm(false)}>Bekor qilish</button>
              <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saqlanmoqda...' : <><Save size={16} /> Saqlash</>}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// =====================
// ORDERS MANAGER
// =====================
function OrdersManager({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const STATUS_LABELS = {
    pending: '⏳ Kutilmoqda',
    preparing: '👨‍🍳 Tayyorlanmoqda',
    delivering: '🚴 Yo\'lda',
    completed: '✅ Yetkazildi',
    cancelled: '❌ Bekor qilindi'
  };

  const STATUS_COLORS = {
    pending: '#ffb800',
    preparing: '#ff6200',
    delivering: '#3b82f6',
    completed: '#10b981',
    cancelled: '#f43f5e'
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminFetch('/orders', {}, token);
      setOrders(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await adminFetch(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }, token);
      load();
    } catch (e) { setError(e.message); }
    finally { setUpdatingId(null); }
  };

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.status === filterStatus);

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h3 className="admin-section-title"><ShoppingBag size={18} /> Buyurtmalar</h3>
        <button className="admin-btn-secondary" onClick={load} style={{ gap: '6px' }}>
          <RefreshCw size={14} /> Yangilash
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="admin-filter-tabs">
        <button className={`admin-filter-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
          Barchasi ({orders.length})
        </button>
        {Object.entries(STATUS_LABELS).map(([val, label]) => {
          const count = orders.filter(o => o.status === val).length;
          if (count === 0) return null;
          return (
            <button key={val} className={`admin-filter-btn ${filterStatus === val ? 'active' : ''}`} onClick={() => setFilterStatus(val)}>
              {label.split(' ')[0]} {count}
            </button>
          );
        })}
      </div>

      {error && <div className="admin-error">{error}</div>}
      {loading ? <p className="admin-loading">Yuklanmoqda...</p> : (
        <div className="admin-list">
          {filteredOrders.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>Buyurtmalar yo'q</p>
          )}
          {filteredOrders.map(order => {
            const isExpanded = expandedId === order.id;
            return (
              <div key={order.id} className="admin-order-card">
                {/* Order Header */}
                <div className="admin-order-header" style={{ cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                  <div>
                    <span className="admin-order-id">#{order.id}</span>
                    <span className="admin-order-date">{new Date(order.created_at).toLocaleString('ru-RU')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="admin-order-price">{Number(order.total_price).toLocaleString()} UZS</span>
                    {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Quick Info */}
                <div className="admin-order-info">
                  <span><Phone size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />{order.phone}</span>
                  <span><CreditCard size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />{order.payment_method === 'cash' ? 'Naqd' : 'Karta'}</span>
                  {order.username && <span>@{order.username}</span>}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Customer info */}
                    {(order.first_name || order.username) && (
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        👤 {order.first_name || ''}{order.username ? ` (@${order.username})` : ''}
                      </div>
                    )}

                    {/* Address */}
                    {order.address_text && (
                      <div style={{ fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        <MapPin size={14} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--primary)' }} />
                        <span style={{ color: 'var(--text-main)' }}>{order.address_text}</span>
                      </div>
                    )}
                    <a
                      href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      🗺️ Xaritada ko'rish
                    </a>

                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px' }}>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Buyurtma tarkibi</p>
                        {order.items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderBottom: i < order.items.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                            <span style={{ color: 'var(--text-main)' }}>{item.name_ru} <span style={{ color: 'var(--text-muted)' }}>x{item.quantity}</span></span>
                            <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{(item.price_at_order * item.quantity).toLocaleString()} UZS</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Yetkazib berish</span>
                          <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>{Number(order.delivery_price).toLocaleString()} UZS</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Row */}
                <div className="admin-order-status-row">
                  <span className="admin-order-status" style={{ color: STATUS_COLORS[order.status] }}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                  <select
                    className="admin-status-select"
                    value={order.status}
                    disabled={updatingId === order.id || order.status === 'completed' || order.status === 'cancelled'}
                    onChange={e => updateStatus(order.id, e.target.value)}
                    style={{ borderColor: STATUS_COLORS[order.status] + '44' }}
                  >
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =====================
// SETTINGS MANAGER
// =====================
function SettingsManager({ token }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminFetch('/settings', {}, token);
      setSettings(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSaveSetting = async (key, val) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify({ key, value: String(val) })
      }, token);
      setSuccess('Sozlama muvaffaqiyatli saqlandi!');
      setTimeout(() => setSuccess(''), 3000);
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <p className="admin-loading">Sozlamalar yuklanmoqda...</p>;

  return (
    <div className="admin-section">
      <h3 className="admin-section-title"><Settings size={18} /> Kafe Sozlamalari</h3>
      {error && <div className="admin-error">{error}</div>}
      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={14} /> {success}
        </div>
      )}

      <div className="admin-form" style={{ marginTop: '8px' }}>
        <div className="admin-form-row">
          <label>Yetkazib berish narxi (UZS)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="admin-input"
              type="number"
              value={settings.deliveryCost}
              onChange={e => setSettings({ ...settings, deliveryCost: parseInt(e.target.value, 10) || 0 })}
            />
            <button className="admin-btn-primary" onClick={() => handleSaveSetting('deliveryCost', settings.deliveryCost)} disabled={saving}>
              <Save size={14} />
            </button>
          </div>
        </div>

        <div className="admin-form-row">
          <label>Bepul yetkazib berish chegarasi (UZS)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="admin-input"
              type="number"
              value={settings.freeDeliveryThreshold}
              onChange={e => setSettings({ ...settings, freeDeliveryThreshold: parseInt(e.target.value, 10) || 0 })}
            />
            <button className="admin-btn-primary" onClick={() => handleSaveSetting('freeDeliveryThreshold', settings.freeDeliveryThreshold)} disabled={saving}>
              <Save size={14} />
            </button>
          </div>
        </div>

        <div className="admin-form-row">
          <label>Ish vaqti</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="admin-input"
              value={settings.workHours}
              onChange={e => setSettings({ ...settings, workHours: e.target.value })}
              placeholder="10:00-23:00"
            />
            <button className="admin-btn-primary" onClick={() => handleSaveSetting('workHours', settings.workHours)} disabled={saving}>
              <Save size={14} />
            </button>
          </div>
        </div>

        <div
          className="admin-form-row admin-form-toggle"
          style={{ border: '1px solid var(--border-color)', padding: '14px', borderRadius: '12px', marginTop: '4px' }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'var(--text-main)' }}>Kafeni vaqtincha yopish</label>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {settings.blockOffHours ? '🛑 Hozir YOPIQ — mijozlar ogohlantirishni ko\'radi' : '🟢 Hozir OCHIQ — mijozlar buyurtma bera oladi'}
            </span>
          </div>
          <button
            className={`admin-toggle-btn ${settings.blockOffHours ? 'on' : 'off'}`}
            onClick={() => handleSaveSetting('blockOffHours', !settings.blockOffHours)}
            disabled={saving}
          >
            {settings.blockOffHours ? <ToggleRight size={32} style={{ color: 'var(--accent-red)' }} /> : <ToggleLeft size={32} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================
// MAIN ADMIN PANEL
// =====================
export default function AdminPanel({ onBack }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('admin_token') || '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [logging, setLogging] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const isLoggedIn = !!token;

  const handleLogin = async () => {
    if (!password) return;
    setLogging(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Noto\'g\'ri parol');
      sessionStorage.setItem('admin_token', data.token);
      setToken(data.token);
    } catch (e) {
      setLoginError(e.message);
    } finally { setLogging(false); }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    setToken('');
    setPassword('');
  };

  useEffect(() => {
    if (isLoggedIn && activeTab === 'stats') {
      setStatsLoading(true);
      adminFetch('/stats', {}, token)
        .then(data => setStats(data))
        .catch(() => {})
        .finally(() => setStatsLoading(false));
    }
  }, [isLoggedIn, activeTab, token]);

  // ---- Login Screen ----
  if (!isLoggedIn) {
    return (
      <div className="admin-panel">
        <div className="admin-topbar">
          <button className="admin-back-btn" onClick={onBack}><ArrowLeft size={18} /> Orqaga</button>
          <h2 className="admin-topbar-title">Admin Panel</h2>
          <div style={{ width: '60px' }} />
        </div>
        <div className="admin-login-screen">
          <div className="admin-login-card">
            <div className="admin-login-icon">🔐</div>
            <h3>Kirish</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
              Admin panelga kirish uchun parolni kiriting
            </p>
            {loginError && <div className="admin-error">{loginError}</div>}
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                className="admin-input"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Admin paroli"
                autoComplete="current-password"
              />
              <button
                onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button className="admin-btn-primary" style={{ width: '100%' }} onClick={handleLogin} disabled={logging}>
              {logging ? 'Kirish...' : <><LogIn size={16} /> Kirish</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Dashboard ----
  return (
    <div className="admin-panel">
      <div className="admin-topbar">
        <button className="admin-back-btn" onClick={onBack}><ArrowLeft size={18} /> Menyuga</button>
        <h2 className="admin-topbar-title">Admin Panel</h2>
        <button className="admin-logout-btn" onClick={handleLogout}>Chiqish</button>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
          <BarChart3 size={15} /> Statistika
        </button>
        <button className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          <ShoppingBag size={15} /> Buyurtmalar
        </button>
        <button className={`admin-tab ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
          <Tag size={15} /> Kategoriyalar
        </button>
        <button className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
          <Package size={15} /> Mahsulotlar
        </button>
        <button className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={15} /> Sozlamalar
        </button>
      </div>

      <div className="admin-content">
        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="admin-stats-grid">
            {statsLoading ? <p className="admin-loading" style={{ gridColumn: '1/-1' }}>Yuklanmoqda...</p> : stats ? (
              <>
                <StatCard icon={ShoppingBag} label="Jami buyurtmalar" value={stats.totalOrders} color="#ff6200" />
                <StatCard icon={BarChart3} label="Daromad (UZS)" value={stats.totalRevenue.toLocaleString()} color="#10b981" />
                <StatCard icon={Package} label="Mahsulotlar" value={stats.totalProducts} color="#3b82f6" />
                <StatCard icon={Tag} label="Kategoriyalar" value={stats.totalCategories} color="#ffb800" />
                <StatCard icon={AlertCircle} label="Kutilmoqda" value={stats.pendingOrders} color="#f43f5e" />
              </>
            ) : <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center' }}>Ma'lumot yo'q</p>}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && <OrdersManager token={token} />}

        {/* Categories Tab */}
        {activeTab === 'categories' && <CategoryManager token={token} />}

        {/* Products Tab */}
        {activeTab === 'products' && <ProductManager token={token} />}

        {/* Settings Tab */}
        {activeTab === 'settings' && <SettingsManager token={token} />}
      </div>
    </div>
  );
}

