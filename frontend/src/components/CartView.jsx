import React from 'react';
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight } from 'lucide-react';
import { tgInterface, getImageUrl } from '../tg-api';

export default function CartView({ products, cart, onAdd, onRemove, onRemoveEntirely, setActiveTab, lang, t, settings }) {
  // Find cart items
  const cartItems = [];
  let itemsSum = 0;

  Object.keys(cart).forEach(id => {
    const qty = cart[id];
    const prod = products.find(p => p.id === parseInt(id, 10));
    if (prod && qty > 0) {
      cartItems.push({
        product: prod,
        quantity: qty,
        sum: qty * prod.price
      });
      itemsSum += qty * prod.price;
    }
  });

  if (cartItems.length === 0) {
    return (
      <div className="empty-state">
        <ShoppingBag className="empty-icon" />
        <h3 className="empty-title">{t[lang].emptyCartTitle}</h3>
        <p className="empty-desc">{t[lang].emptyCartDesc}</p>
        <button className="btn-shop-now" onClick={() => setActiveTab('menu')}>
          {t[lang].goShop}
        </button>
      </div>
    );
  }

  // Delivery Calculations
  const isFreeDelivery = itemsSum >= settings.freeDeliveryThreshold;
  const deliveryCost = isFreeDelivery ? 0 : settings.deliveryCost;
  const grandTotal = itemsSum + deliveryCost;
  const missingForFreeDelivery = settings.freeDeliveryThreshold - itemsSum;

  const handleCheckoutClick = () => {
    tgInterface.hapticImpact('medium');
    setActiveTab('checkout');
  };

  return (
    <div className="cart-view-container animate-fade-in">
      <h2 className="section-title">
        <ShoppingBag size={22} className="brand-icon" />
        <span>{t[lang].cart}</span>
      </h2>

      {/* Cart Items List */}
      <div className="cart-items-list">
        {cartItems.map(({ product, quantity, sum }) => {
          const name = lang === 'uz' ? product.name_uz : product.name_ru;
          return (
            <div key={product.id} className="cart-item-row">
              <img 
                src={getImageUrl(product.photo_url)}
                alt={name} 
                className="cart-item-thumb" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/rich_burger.png';
                }}
              />
              
              <div className="cart-item-details">
                <div className="cart-item-name">{name}</div>
                <div className="cart-item-price">{product.price.toLocaleString()} UZS</div>
              </div>

              <div className="cart-item-actions">
                <div className="counter-controls">
                  <button className="counter-btn" onClick={() => { tgInterface.hapticImpact('light'); onRemove(product.id); }}>
                    <Minus size={12} />
                  </button>
                  <span className="counter-value">{quantity}</span>
                  <button className="counter-btn" onClick={() => { tgInterface.hapticImpact('light'); onAdd(product.id); }}>
                    <Plus size={12} />
                  </button>
                </div>

                <button 
                  className="btn-remove-item"
                  onClick={() => {
                    tgInterface.hapticImpact('medium');
                    onRemoveEntirely(product.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Summary Card */}
      <div className="summary-card">
        <h3 className="product-card-title">{t[lang].summaryTitle}</h3>
        
        <div className="summary-row">
          <span>{t[lang].itemsSum}</span>
          <span>{itemsSum.toLocaleString()} UZS</span>
        </div>

        <div className="summary-row">
          <span>{t[lang].deliveryFee}</span>
          <span>{isFreeDelivery ? t[lang].deliveryFree : `${deliveryCost.toLocaleString()} UZS`}</span>
        </div>

        {/* Free Delivery Marketing Upsell */}
        {!isFreeDelivery && missingForFreeDelivery > 0 && (
          <div className="delivery-hint">
            {lang === 'uz' 
              ? `Yana ${missingForFreeDelivery.toLocaleString()} UZS lik mahsulot qo'shing va bepul yetkazib berishga ega bo'ling!` 
              : `Добавьте товары еще на ${missingForFreeDelivery.toLocaleString()} UZS для бесплатной доставки!`}
          </div>
        )}

        <div className="summary-row total">
          <span>{t[lang].total}</span>
          <span className="price">{grandTotal.toLocaleString()} UZS</span>
        </div>

        <button className="btn-checkout" onClick={handleCheckoutClick}>
          <span>{t[lang].placeOrder}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
