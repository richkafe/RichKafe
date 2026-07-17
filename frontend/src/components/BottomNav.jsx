import React from 'react';
import { Utensils, ShoppingBag, ClipboardList } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, cartCount, lang, t }) {
  return (
    <nav className="bottom-nav">
      <button 
        className={`nav-item ${activeTab === 'menu' ? 'active' : ''}`}
        onClick={() => setActiveTab('menu')}
      >
        <Utensils className="nav-item-icon" />
        <span className="nav-item-label">{t[lang].menu}</span>
      </button>

      <button 
        className={`nav-item ${activeTab === 'cart' || activeTab === 'checkout' ? 'active' : ''}`}
        onClick={() => setActiveTab('cart')}
      >
        <div className="cart-icon-wrapper">
          <ShoppingBag className="nav-item-icon" />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </div>
        <span className="nav-item-label">{t[lang].cart}</span>
      </button>

      <button 
        className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
        onClick={() => setActiveTab('orders')}
      >
        <ClipboardList className="nav-item-icon" />
        <span className="nav-item-label">{t[lang].orders}</span>
      </button>
    </nav>
  );
}
