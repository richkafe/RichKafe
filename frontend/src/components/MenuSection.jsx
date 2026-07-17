import React, { useState } from 'react';
import ProductCard from './ProductCard';
import { ShoppingBag, ArrowLeft, ChevronRight } from 'lucide-react';

// Category emoji/icon mapping for visual display
const CATEGORY_ICONS = {
  burgers: '🍔',
  lavash: '🌯',
  fries: '🍟',
  drinks: '🥤',
  desserts: '🍰',
  default: '🍽️'
};

export default function MenuSection({ products, categories, cart, onAdd, onRemove, setActiveTab, lang, t, settings }) {
  const [selectedCategory, setSelectedCategory] = useState(null); // null = show category grid

  // Cart totals calculation
  let cartCount = 0;
  let cartTotal = 0;
  Object.keys(cart).forEach(id => {
    const qty = cart[id];
    const prod = products.find(p => p.id === parseInt(id, 10));
    if (prod && qty > 0) {
      cartCount += qty;
      cartTotal += qty * prod.price;
    }
  });

  // Build category list - merge DB categories with products info
  const categoryList = categories && categories.length > 0
    ? categories
    : buildCategoriesFromProducts(products);

  function buildCategoriesFromProducts(prods) {
    const map = {};
    prods.forEach(p => {
      if (!map[p.category]) {
        map[p.category] = {
          slug: p.category,
          name_ru: getCategoryNameRu(p.category),
          name_uz: getCategoryNameUz(p.category),
          emoji: CATEGORY_ICONS[p.category] || CATEGORY_ICONS.default,
          image_url: null,
          sort_order: 0
        };
      }
    });
    return Object.values(map);
  }

  function getCategoryNameRu(slug) {
    const names = { burgers: 'Бургеры', lavash: 'Лаваш', fries: 'Картофель', drinks: 'Напитки', desserts: 'Десерты' };
    return names[slug] || slug;
  }
  function getCategoryNameUz(slug) {
    const names = { burgers: 'Burgerlar', lavash: 'Lavash', fries: 'Kartoshka', drinks: 'Ichimliklar', desserts: 'Desertlar' };
    return names[slug] || slug;
  }

  // Filter products in selected category
  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory.slug)
    : [];

  const selectedCategoryName = selectedCategory
    ? (lang === 'uz' ? selectedCategory.name_uz : selectedCategory.name_ru)
    : '';

  // Count products per category
  const countByCategory = {};
  products.forEach(p => {
    countByCategory[p.category] = (countByCategory[p.category] || 0) + 1;
  });

  return (
    <div className="menu-section-container">
      {/* ---- Category Grid View ---- */}
      {!selectedCategory && (
        <div className="category-grid-view">
          <p className="category-grid-subtitle">
            {lang === 'uz' ? 'Kategoriyani tanlang' : 'Выберите категорию'}
          </p>
          <div className="category-cards-grid">
            {categoryList.map(cat => {
              const count = countByCategory[cat.slug] || 0;
              if (count === 0) return null;
              const catName = lang === 'uz' ? cat.name_uz : cat.name_ru;
              const emoji = cat.emoji || CATEGORY_ICONS[cat.slug] || CATEGORY_ICONS.default;

              return (
                <button
                  key={cat.slug}
                  className="category-card"
                  onClick={() => setSelectedCategory(cat)}
                >
                  <div className="category-card-img-wrapper">
                    {cat.image_url ? (
                      <img
                        src={cat.image_url}
                        alt={catName}
                        className="category-card-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="category-card-emoji" style={{ display: cat.image_url ? 'none' : 'flex' }}>
                      {emoji}
                    </div>
                  </div>
                  <div className="category-card-info">
                    <span className="category-card-name">{catName}</span>
                    <div className="category-card-meta">
                      <span className="category-card-count">
                        {count} {lang === 'uz' ? 'ta' : 'позиций'}
                      </span>
                      <ChevronRight size={14} color="var(--primary)" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ---- Products in Category View ---- */}
      {selectedCategory && (
        <div className="category-products-view">
          {/* Back button header */}
          <div className="category-products-header">
            <button
              className="btn-back-category"
              onClick={() => setSelectedCategory(null)}
            >
              <ArrowLeft size={18} />
              <span>{lang === 'uz' ? 'Orqaga' : 'Назад'}</span>
            </button>
            <h2 className="category-products-title">
              {selectedCategory.emoji || CATEGORY_ICONS[selectedCategory.slug] || '🍽️'} {selectedCategoryName}
            </h2>
          </div>

          {/* Products Grid */}
          <div className="products-grid">
            {filteredProducts.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  {lang === 'uz' ? 'Bu kategoriyada mahsulot yo\'q' : 'В этой категории нет продуктов'}
                </p>
              </div>
            ) : (
              filteredProducts.map(prod => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  quantity={cart[prod.id] || 0}
                  onAdd={onAdd}
                  onRemove={onRemove}
                  lang={lang}
                  t={t}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {cartCount > 0 && (
        <div className="floating-cart-bar" onClick={() => setActiveTab('cart')}>
          <div className="floating-cart-info">
            <div className="cart-icon-wrapper">
              <ShoppingBag size={20} color="#ffffff" />
              <span className="cart-badge">{cartCount}</span>
            </div>
            <span className="floating-cart-text">
              {lang === 'uz' ? 'Savatni ko\'rish' : 'Посмотреть корзину'}
            </span>
          </div>
          <span className="floating-cart-price">
            {cartTotal.toLocaleString()} UZS
          </span>
        </div>
      )}
    </div>
  );
}
