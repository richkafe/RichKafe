import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { tgInterface, getImageUrl } from '../tg-api';

export default function ProductCard({ product, quantity, onAdd, onRemove, lang, t }) {
  const name = lang === 'uz' ? product.name_uz : product.name_ru;
  const description = lang === 'uz' ? product.description_uz : product.description_ru;

  const handleAdd = () => {
    tgInterface.hapticImpact('light');
    onAdd(product.id);
  };

  const handleRemove = () => {
    tgInterface.hapticImpact('light');
    onRemove(product.id);
  };

  return (
    <div className="product-card">
      <div className="product-card-img-wrapper">
        <img
          src={getImageUrl(product.photo_url)}
          alt={name}
          className="product-card-img"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/rich_burger.png';
          }}
        />
      </div>

      <div className="product-card-info">
        <div>
          <h3 className="product-card-title">{name}</h3>
          <p className="product-card-desc" title={description}>{description}</p>
        </div>

        <div className="product-card-footer">
          <span className="product-card-price">
            {product.price.toLocaleString()} UZS
          </span>

          {quantity === 0 ? (
            <button className="btn-add-cart" onClick={handleAdd}>
              <Plus size={14} />
              <span>{t[lang].addToCart}</span>
            </button>
          ) : (
            <div className="counter-controls">
              <button className="counter-btn" onClick={handleRemove}>
                <Minus size={14} />
              </button>
              <span className="counter-value">{quantity}</span>
              <button className="counter-btn" onClick={handleAdd}>
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
