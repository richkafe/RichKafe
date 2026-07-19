import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Package, Tag, ShoppingBag,
  Plus, Edit2, Trash2, Save, X, Image,
  BarChart3, AlertCircle, Check, LogIn, Eye, EyeOff,
  ToggleLeft, ToggleRight, ArrowLeft, Settings, Upload,
  MapPin, Phone, CreditCard, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { getImageUrl } from '../tg-api';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/admin`
  : '/api/admin';

const adminT = {
  ru: {
    imageLabel: "Фото (URL или файл)",
    upload: "Загрузить",
    categories: "Категории",
    add: "Добавить",
    loading: "Загрузка...",
    noCategories: "Нет категорий. Добавьте первую!",
    order: "порядок",
    hasImage: "есть фото",
    close: "Закрыть",
    open: "Открыть",
    edit: "Редактировать",
    delete: "Удалить",
    editCategory: "Редактировать категорию",
    newCategory: "Новая категория",
    slug: "Slug (латиница, без пробелов)",
    nameRu: "Название (RU)",
    nameUz: "Название (UZ)",
    emoji: "Эмодзи",
    sortOrder: "Порядковый номер",
    active: "Активен",
    cancel: "Отмена",
    saving: "Сохранение...",
    save: "Сохранить",
    products: "Товары",
    all: "Все",
    noProducts: "В этой категории нет товаров",
    newProduct: "Новый товар",
    editProduct: "Редактировать товар",
    category: "Категория",
    descRu: "Описание (RU)",
    descUz: "Описание (UZ)",
    priceUzs: "Цена (UZS)",
    productImage: "Фото товара (URL или файл)",
    orders: "Заказы",
    refresh: "Обновить",
    noOrders: "Нет заказов",
    cash: "Наличные",
    card: "Карта",
    viewOnMap: "Смотреть на карте",
    orderItems: "Состав заказа",
    deliveryFee: "Доставка",
    statusPending: "Ожидает",
    statusPreparing: "Готовится",
    statusDelivering: "В пути",
    statusCompleted: "Доставлен",
    statusCancelled: "Отменен",
    settings: "Настройки",
    mainSettings: "Основные настройки",
    deliveryCost: "Стоимость доставки (UZS)",
    freeDeliveryThreshold: "Бесплатная доставка от (UZS)",
    workHours: "Время работы (напр. 10:00-23:00)",
    cafeOpenStatus: "Статус работы кафе",
    cafeOpen: "Кафе открыто (принимает заказы)",
    cafeClosed: "Кафе закрыто (только предзаказ)",
    security: "Безопасность",
    newPassword: "Новый пароль",
    updatePassword: "Обновить пароль",
    adminPanelTitle: "Панель Администратора",
    logout: "Выйти",
    loginTitle: "Вход в админ панель",
    passwordLabel: "Пароль",
    enterPassword: "Введите пароль...",
    loginBtn: "Войти",
    stats: "Статистика",
    totalOrders: "Всего заказов",
    totalRevenue: "Выручка",
    totalProducts: "Всего товаров",
    pendingOrders: "Ожидают подтверждения",
    confirmDeleteCat: "Вы уверены, что хотите удалить категорию?",
    confirmDeleteProd: "Вы уверены, что хотите удалить товар?",
    errorReqCat: "Слуг и названия обязательны",
    errorReqProd: "Категория, названия и цена обязательны",
    errorPrice: "Цена должна быть числом"
  },
  uz: {
    imageLabel: "Rasm (URL yoki fayl)",
    upload: "Yuklash",
    categories: "Kategoriyalar",
    add: "Qo'shish",
    loading: "{t.loading}",
    noCategories: "{t.noCategories}",
    order: "tartib",
    hasImage: "rasm bor",
    close: "Yopish",
    open: "Ochish",
    edit: "Tahrirlash",
    delete: "O'chirish",
    editCategory: "Kategoriyani tahrirlash",
    newCategory: "Yangi kategoriya",
    slug: "Slug (lotin harflari, bo'shliqsiz)",
    nameRu: "{t.nameRu}",
    nameUz: "{t.nameUz}",
    emoji: "{t.emoji}",
    sortOrder: "{t.sortOrder}",
    active: "Faol",
    cancel: "Bekor qilish",
    saving: "Saqlanmoqda...",
    save: "Saqlash",
    products: "Mahsulotlar",
    all: "Barchasi",
    noProducts: "{t.noProducts}",
    newProduct: "Yangi mahsulot",
    editProduct: "Mahsulotni tahrirlash",
    category: "Kategoriya",
    descRu: "{t.descRu}",
    descUz: "{t.descUz}",
    priceUzs: "{t.priceUzs}",
    productImage: "Mahsulot rasmi (fayl yoki URL)",
    orders: "Buyurtmalar",
    refresh: "Yangilash",
    noOrders: "{t.noOrders}",
    cash: "Naqd",
    card: "Karta",
    viewOnMap: "{t.viewOnMap}",
    orderItems: "{t.orderItems}",
    deliveryFee: "Yetkazib berish",
    statusPending: "Kutilmoqda",
    statusPreparing: "Tayyorlanmoqda",
    statusDelivering: "Yo'lda",
    statusCompleted: "Yetkazildi",
    statusCancelled: "Bekor qilindi",
    settings: "Sozlamalar",
    mainSettings: "{t.mainSettings}",
    deliveryCost: "{t.deliveryCost}",
    freeDeliveryThreshold: "{t.freeDeliveryThreshold}",
    workHours: "{t.workHours} (masalan, 10:00-23:00)",
    cafeOpenStatus: "{t.cafeOpenStatus}",
    cafeOpen: "{t.cafeOpen}",
    cafeClosed: "{t.cafeClosed}",
    security: "{t.security}",
    newPassword: "{t.newPassword}",
    updatePassword: "{t.updatePassword}",
    adminPanelTitle: "Admin Panel",
    logout: "Chiqish",
    loginTitle: "{t.loginTitle}",
    passwordLabel: "Parol",
    enterPassword: "{t.enterPassword}",
    loginBtn: "Kirish",
    stats: "Statistika",
    totalOrders: "{t.totalOrders}",
    totalRevenue: "{t.totalRevenue}",
    totalProducts: "{t.totalProducts}",
    pendingOrders: "{t.pendingOrders}",
    confirmDeleteCat: "kategoriyasini o'chirishni tasdiqlaysizmi?",
    confirmDeleteProd: "mahsulotini o'chirishni tasdiqlaysizmi?",
    errorReqCat: "t.errorReqCat",
    errorReqProd: "t.errorReqProd",
    errorPrice: "t.errorPrice"
  }
};


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
function ImageUploadField({ value, onChange, token, label, lang = 'ru' }) {
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
            src={getImageUrl(preview)}
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
function CategoryManager({ token, lang, t }) {
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
      setError('t.errorReqCat');
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
    if (!window.confirm(`"${name}" ${t.confirmDeleteCat}`)) return;
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
        <h3 className="admin-section-title"><Tag size={18} /> {t.categories}</h3>
        <button className="admin-btn-primary" onClick={openCreate}>
          <Plus size={16} /> Qo'shish
        </button>
      </div>
      {error && <div className="admin-error">{error}</div>}
      {loading ? <p className="admin-loading">{t.loading}</p> : (
        <div className="admin-list">
          {categories.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
              {t.noCategories}
            </p>
          )}
          {categories.map(cat => (
            <div key={cat.id} className={`admin-list-item ${!cat.is_active ? 'inactive' : ''}`}>
              {/* Category image preview */}
              {cat.image_url ? (
                <img
                  src={getImageUrl(cat.image_url)} alt={cat.name_ru}
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
                  slug: {cat.slug} · {t.order}: {cat.sort_order}
                  {cat.image_url && ` · 🖼️ ${t.hasImage}`}
                </span>
              </div>
              <div className="admin-list-actions">
                <button
                  className={`admin-toggle-btn ${cat.is_active ? 'on' : 'off'}`}
                  onClick={() => toggleActive(cat)}
                  title={cat.is_active ? t.close : t.open}
                >
                  {cat.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button className="admin-icon-btn edit" onClick={() => openEdit(cat)} title={t.edit}>
                  <Edit2 size={16} />
                </button>
                <button className="admin-icon-btn delete" onClick={() => handleDelete(cat.id, cat.name_ru)} title={t.delete}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editItem ? t.editCategory : t.newCategory} onClose={() => setShowForm(false)}>
          <div className="admin-form">
            {error && <div className="admin-error">{error}</div>}
            <div className="admin-form-row">
              <label>{t.slug}</label>
              <input
                className="admin-input"
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') })}
                placeholder="burgers"
              />
            </div>
            <div className="admin-form-row">
              <label>{t.nameRu}</label>
              <input className="admin-input" value={form.name_ru} onChange={e => setForm({ ...form, name_ru: e.target.value })} placeholder="Бургеры" />
            </div>
            <div className="admin-form-row">
              <label>{t.nameUz}</label>
              <input className="admin-input" value={form.name_uz} onChange={e => setForm({ ...form, name_uz: e.target.value })} placeholder="Burgerlar" />
            </div>
            <div className="admin-form-row">
              <label>{t.emoji}</label>
              <input className="admin-input" value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} placeholder="🍔" style={{ fontSize: '20px', width: '80px' }} />
            </div>
            <ImageUploadField
              label={t.imageLabel} lang={lang}
              value={form.image_url}
              onChange={url => setForm({ ...form, image_url: url })}
              token={token}
            />
            <div className="admin-form-row">
              <label>{t.sortOrder}</label>
              <input className="admin-input" type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} />
            </div>
            {editItem && (
              <div className="admin-form-row admin-form-toggle">
                <label>{t.active}</label>
                <button
                  className={`admin-toggle-btn ${form.is_active ? 'on' : 'off'}`}
                  onClick={() => setForm({ ...form, is_active: form.is_active ? 0 : 1 })}
                >
                  {form.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
              </div>
            )}
            <div className="admin-form-actions">
              <button className="admin-btn-secondary" onClick={() => setShowForm(false)}>{t.cancel}</button>
              <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? t.saving : <><Save size={16} /> {t.save}</>}
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
function ProductManager({ token, lang, t }) {
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
      setError('t.errorReqProd');
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
    if (!window.confirm(`"${name}" ${t.confirmDeleteProd}`)) return;
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
        <h3 className="admin-section-title"><Package size={18} /> {t.products}</h3>
        <button className="admin-btn-primary" onClick={openCreate}>
          <Plus size={16} /> Qo'shish
        </button>
      </div>

      {/* Category Filter */}
      <div className="admin-filter-tabs">
        <button className={`admin-filter-btn ${filterCat === 'all' ? 'active' : ''}`} onClick={() => setFilterCat('all')}>{t.all}</button>
        {categories.map(cat => (
          <button key={cat.slug} className={`admin-filter-btn ${filterCat === cat.slug ? 'active' : ''}`} onClick={() => setFilterCat(cat.slug)}>
            {cat.emoji} {cat.name_ru}
          </button>
        ))}
      </div>

      {error && <div className="admin-error">{error}</div>}
      {loading ? <p className="admin-loading">{t.loading}</p> : (
        <div className="admin-list">
          {visibleProducts.map(prod => (
            <div key={prod.id} className={`admin-list-item ${!prod.is_active ? 'inactive' : ''}`}>
              {prod.photo_url ? (
                <img src={getImageUrl(prod.photo_url)} alt={prod.name_ru} className="admin-list-thumb"
                  onError={e => { e.target.style.display = 'none'; }} />
              ) : (
                <div className="admin-list-thumb" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🍔</div>
              )}
              <div className="admin-list-info">
                <span className="admin-list-name">{prod.name_ru}</span>
                <span className="admin-list-meta">{prod.category} · {Number(prod.price).toLocaleString()} UZS{!prod.is_active ? ' · 🔴 {t.close}' : ''}</span>
              </div>
              <div className="admin-list-actions">
                <button
                  className={`admin-toggle-btn ${prod.is_active ? 'on' : 'off'}`}
                  onClick={() => toggleActive(prod)}
                  title={prod.is_active ? 'Yopish' : 'Ochish'}
                >
                  {prod.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button className="admin-icon-btn edit" onClick={() => openEdit(prod)} title={t.edit}><Edit2 size={16} /></button>
                <button className="admin-icon-btn delete" onClick={() => handleDelete(prod.id, prod.name_ru)} title={t.delete}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {visibleProducts.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>{t.noProducts}</p>
          )}
        </div>
      )}

      {showForm && (
        <Modal title={editItem ? t.editProduct : t.newProduct} onClose={() => setShowForm(false)}>
          <div className="admin-form">
            {error && <div className="admin-error">{error}</div>}
            <div className="admin-form-row">
              <label>{t.category}</label>
              <select className="admin-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(cat => <option key={cat.slug} value={cat.slug}>{cat.emoji} {cat.name_ru}</option>)}
              </select>
            </div>
            <div className="admin-form-row">
              <label>{t.nameRu}</label>
              <input className="admin-input" value={form.name_ru} onChange={e => setForm({ ...form, name_ru: e.target.value })} placeholder="Рич Бургер" />
            </div>
            <div className="admin-form-row">
              <label>{t.nameUz}</label>
              <input className="admin-input" value={form.name_uz} onChange={e => setForm({ ...form, name_uz: e.target.value })} placeholder="Rich Burger" />
            </div>
            <div className="admin-form-row">
              <label>{t.descRu}</label>
              <textarea className="admin-input admin-textarea" value={form.description_ru} onChange={e => setForm({ ...form, description_ru: e.target.value })} placeholder="Tavsif..." />
            </div>
            <div className="admin-form-row">
              <label>{t.descUz}</label>
              <textarea className="admin-input admin-textarea" value={form.description_uz} onChange={e => setForm({ ...form, description_uz: e.target.value })} placeholder="Tavsif..." />
            </div>
            <div className="admin-form-row">
              <label>{t.priceUzs}</label>
              <input className="admin-input" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="32000" />
            </div>
            <ImageUploadField
              label={t.productImage} lang={lang}
              value={form.photo_url}
              onChange={url => setForm({ ...form, photo_url: url })}
              token={token}
            />
            <div className="admin-form-row">
              <label>{t.sortOrder}</label>
              <input className="admin-input" type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} />
            </div>
            {editItem && (
              <div className="admin-form-row admin-form-toggle">
                <label>{t.active}</label>
                <button
                  className={`admin-toggle-btn ${form.is_active ? 'on' : 'off'}`}
                  onClick={() => setForm({ ...form, is_active: form.is_active ? 0 : 1 })}
                >
                  {form.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
              </div>
            )}
            <div className="admin-form-actions">
              <button className="admin-btn-secondary" onClick={() => setShowForm(false)}>{t.cancel}</button>
              <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? t.saving : <><Save size={16} /> {t.save}</>}
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
function OrdersManager({ token, lang, t }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const STATUS_LABELS = {
    pending: '⏳ ' + t.statusPending,
    preparing: '👨‍🍳 ' + t.statusPreparing,
    delivering: '🚴 ' + t.statusDelivering,
    completed: '✅ ' + t.statusCompleted,
    cancelled: '❌ ' + t.statusCancelled
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
        <h3 className="admin-section-title"><ShoppingBag size={18} /> {t.orders}</h3>
        <button className="admin-btn-secondary" onClick={load} style={{ gap: '6px' }}>
          <RefreshCw size={14} /> Yangilash
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="admin-filter-tabs">
        <button className={`admin-filter-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
          {t.all} ({orders.length})
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
      {loading ? <p className="admin-loading">{t.loading}</p> : (
        <div className="admin-list">
          {filteredOrders.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>{t.noOrders}</p>
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
                  <span><CreditCard size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />{order.payment_method === 'cash' ? t.cash : t.card}</span>
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
                      🗺️ {t.viewOnMap}
                    </a>

                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px' }}>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.orderItems}</p>
                        {order.items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderBottom: i < order.items.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                            <span style={{ color: 'var(--text-main)' }}>{item.name_ru} <span style={{ color: 'var(--text-muted)' }}>x{item.quantity}</span></span>
                            <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{(item.price_at_order * item.quantity).toLocaleString()} UZS</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.deliveryFee}</span>
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
function SettingsManager({ token, lang, t }) {
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
          <label>{t.deliveryCost}</label>
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
          <label>{t.workHours}</label>
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

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '8px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>🛒 Savat eslatmasi (Abandoned Cart)</h4>

          <div
            className="admin-form-row admin-form-toggle"
            style={{ border: '1px solid var(--border-color)', padding: '14px', borderRadius: '12px', marginBottom: '10px' }}
          >
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'var(--text-main)' }}>Eslatma yoqilgan</label>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {settings.abandonedCartReminderEnabled ? '🟢 Faol — buyurtma qilmagan mijozlarga eslatma yuboriladi' : '🔴 O\'chirilgan — eslatmalar yuborilmaydi'}
              </span>
            </div>
            <button
              className={`admin-toggle-btn ${settings.abandonedCartReminderEnabled ? 'on' : 'off'}`}
              onClick={() => handleSaveSetting('abandonedCartReminderEnabled', !settings.abandonedCartReminderEnabled)}
              disabled={saving}
            >
              {settings.abandonedCartReminderEnabled ? <ToggleRight size={32} style={{ color: 'var(--accent-green)' }} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          <div className="admin-form-row">
            <label>Eslatma kechikishi (daqiqa)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="admin-input"
                type="number"
                min="1"
                max="1440"
                value={settings.abandonedCartReminderMinutes || 5}
                onChange={e => setSettings({ ...settings, abandonedCartReminderMinutes: Math.min(1440, Math.max(1, parseInt(e.target.value, 10) || 5)) })}
              />
              <button className="admin-btn-primary" onClick={() => handleSaveSetting('abandonedCartReminderMinutes', settings.abandonedCartReminderMinutes || 5)} disabled={saving}>
                <Save size={14} />
              </button>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Savat to'ldirilgandan keyin eslatma yuborishgacha kutish vaqti (1–1440 daqiqa)
            </span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '8px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>📍 Yetkazib berish hududi (Delivery Area)</h4>

          <div
            className="admin-form-row admin-form-toggle"
            style={{ border: '1px solid var(--border-color)', padding: '14px', borderRadius: '12px', marginBottom: '10px' }}
          >
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'var(--text-main)' }}>Hudud tekshiruvi yoqilgan</label>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {settings.deliveryAreaEnabled ? '🟢 Faol — buyurtmalar faqat hudud ichida qabul qilinadi' : '🔴 O\'chirilgan — istalgan manzilga yetkazib beriladi'}
              </span>
            </div>
            <button
              className={`admin-toggle-btn ${settings.deliveryAreaEnabled ? 'on' : 'off'}`}
              onClick={() => handleSaveSetting('deliveryAreaEnabled', !settings.deliveryAreaEnabled)}
              disabled={saving}
            >
              {settings.deliveryAreaEnabled ? <ToggleRight size={32} style={{ color: 'var(--accent-green)' }} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          <div className="admin-form-row">
            <label>Restoran kenglik (Latitude)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="admin-input"
                type="number"
                step="0.000001"
                min="-90"
                max="90"
                value={settings.restaurantLat || ''}
                onChange={e => setSettings({ ...settings, restaurantLat: parseFloat(e.target.value) || '' })}
              />
              <button className="admin-btn-primary" onClick={() => handleSaveSetting('restaurantLat', settings.restaurantLat)} disabled={saving}>
                <Save size={14} />
              </button>
            </div>
          </div>

          <div className="admin-form-row">
            <label>Restoran uzunlik (Longitude)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="admin-input"
                type="number"
                step="0.000001"
                min="-180"
                max="180"
                value={settings.restaurantLng || ''}
                onChange={e => setSettings({ ...settings, restaurantLng: parseFloat(e.target.value) || '' })}
              />
              <button className="admin-btn-primary" onClick={() => handleSaveSetting('restaurantLng', settings.restaurantLng)} disabled={saving}>
                <Save size={14} />
              </button>
            </div>
          </div>

          <div className="admin-form-row">
            <label>Yetkazib berish radiusi (km)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="admin-input"
                type="number"
                step="0.5"
                min="0.5"
                max="100"
                value={settings.deliveryRadiusKm || 30}
                onChange={e => setSettings({ ...settings, deliveryRadiusKm: Math.min(100, Math.max(0.5, parseFloat(e.target.value) || 30)) })}
              />
              <button className="admin-btn-primary" onClick={() => handleSaveSetting('deliveryRadiusKm', settings.deliveryRadiusKm || 30)} disabled={saving}>
                <Save size={14} />
              </button>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              0.5 – 100 km radius
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================
// MAIN ADMIN PANEL
// =====================
export default function AdminPanel({ onBack, lang = 'ru', toggleLanguage }) {
  const t = adminT[lang] || adminT.ru;
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
      const loginBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${loginBase}/api/admin/login`, {
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
              {t.loginTitle} uchun parolni kiriting
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
        <button className="admin-logout-btn" onClick={handleLogout}>{t.logout}</button>
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
            {statsLoading ? <p className="admin-loading" style={{ gridColumn: '1/-1' }}>{t.loading}</p> : stats ? (
              <>
                <StatCard icon={ShoppingBag} label="{t.totalOrders}" value={stats.totalOrders} color="#ff6200" />
                <StatCard icon={BarChart3} label="Daromad (UZS)" value={stats.totalRevenue.toLocaleString()} color="#10b981" />
                <StatCard icon={Package} label="Mahsulotlar" value={stats.totalProducts} color="#3b82f6" />
                <StatCard icon={Tag} label="Kategoriyalar" value={stats.totalCategories} color="#ffb800" />
                <StatCard icon={AlertCircle} label="Kutilmoqda" value={stats.pendingOrders} color="#f43f5e" />
              </>
            ) : <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center' }}>Ma'lumot yo'q</p>}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && <OrdersManager token={token} lang={lang} t={t} />}

        {/* Categories Tab */}
        {activeTab === 'categories' && <CategoryManager token={token} lang={lang} t={t} />}

        {/* Products Tab */}
        {activeTab === 'products' && <ProductManager token={token} lang={lang} t={t} />}

        {/* Settings Tab */}
        {activeTab === 'settings' && <SettingsManager token={token} lang={lang} t={t} />}
      </div>
    </div>
  );
}

