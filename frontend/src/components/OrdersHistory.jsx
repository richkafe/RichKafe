import React from 'react';
import { ClipboardList, RotateCcw } from 'lucide-react';
import { tgInterface } from '../tg-api';

export default function OrdersHistory({ orders, onRepeatOrder, setActiveTab, lang, t }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="empty-state">
        <ClipboardList className="empty-icon" />
        <h3 className="empty-title">{t[lang].noOrdersTitle}</h3>
        <p className="empty-desc">{t[lang].noOrdersDesc}</p>
        <button className="btn-shop-now" onClick={() => setActiveTab('menu')}>
          {t[lang].goShop}
        </button>
      </div>
    );
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'pending';
      case 'preparing': return 'preparing';
      case 'delivering': return 'delivering';
      case 'completed': return 'completed';
      case 'cancelled': return 'cancelled';
      default: return 'pending';
    }
  };

  const handleRepeatOrder = (order) => {
    tgInterface.hapticImpact('medium');
    const itemsToRepeat = order.items.map(item => ({
      productId: item.product_id,
      quantity: item.quantity
    }));
    onRepeatOrder(itemsToRepeat);
  };

  return (
    <div className="orders-history-container">
      <h2 className="section-title">
        <ClipboardList size={22} className="brand-icon" />
        <span>{t[lang].orderStatusTitle}</span>
      </h2>

      <div className="cart-items-list">
        {orders.map((order) => {
          const statusClass = getStatusClass(order.status);
          const date = new Date(order.created_at).toLocaleString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
            dateStyle: 'short',
            timeStyle: 'short',
            timeZone: 'Asia/Tashkent'
          });

          return (
            <div key={order.id} className="order-history-card">
              <div className="order-history-header">
                <div className="order-id-date">
                  <span className="order-id-text">#{order.id}</span>
                  <span className="order-date-text">{date}</span>
                </div>
                <span className={`status-badge ${statusClass}`}>
                  {t[lang][`status_${order.status}`] || order.status}
                </span>
              </div>

              <div className="order-history-items">
                {order.items.map((item) => {
                  const name = lang === 'uz' ? item.name_uz : item.name_ru;
                  return (
                    <div key={item.id} className="order-history-item-row">
                      <span className="item-name">
                        {name} <span style={{ color: 'var(--primary)', fontWeight: '600' }}>x{item.quantity}</span>
                      </span>
                      <span>{(item.quantity * item.price_at_order).toLocaleString()} UZS</span>
                    </div>
                  );
                })}
              </div>

              <div className="order-history-footer">
                <div className="order-id-date">
                  <span className="order-date-text">{t[lang].total}</span>
                  <span className="order-history-price">
                    {(order.total_price).toLocaleString()} UZS
                  </span>
                </div>

                <button
                  className="btn-repeat-order"
                  onClick={() => handleRepeatOrder(order)}
                >
                  <RotateCcw size={14} />
                  <span>{t[lang].repeatOrder}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
