import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Phone, CreditCard, Wallet, ArrowLeft, Loader, CheckCircle2 } from 'lucide-react';
import { tgInterface, api } from '../tg-api';

export default function CheckoutView({
  user,
  cart,
  products,
  settings,
  setActiveTab,
  lang,
  t,
  onOrderSuccess
}) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [phone, setPhone] = useState(user.phone || '+998');
  const [addressText, setAddressText] = useState(user.lastAddressText || '');
  const [latitude, setLatitude] = useState(user.lastLatitude || 41.311081);
  const [longitude, setLongitude] = useState(user.lastLongitude || 69.240562);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const [isPlacing, setIsPlacing] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState(null);

  let itemsSum = 0;
  const orderItems = [];

  Object.keys(cart).forEach(id => {
    const qty = cart[id];
    const prod = products.find(p => p.id === parseInt(id, 10));
    if (prod && qty > 0) {
      orderItems.push({
        productId: prod.id,
        quantity: qty,
        price: prod.price
      });
      itemsSum += qty * prod.price;
    }
  });

  const isFreeDelivery = itemsSum >= settings.freeDeliveryThreshold;
  const deliveryPrice = isFreeDelivery ? 0 : settings.deliveryCost;
  const totalPrice = itemsSum + deliveryPrice;

  useEffect(() => {
    if (!mapRef.current) {
      const orangeIcon = window.L.divIcon({
        html: `
          <div style="
            background-color: #FF6B00;
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid #ffffff;
            box-shadow: 0 4px 12px rgba(255,107,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              background-color: #ffffff;
              width: 10px;
              height: 10px;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `,
        className: 'custom-map-marker-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const map = window.L.map('checkout-map', {
        center: [latitude, longitude],
        zoom: 14,
        zoomControl: false
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      window.L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      const marker = window.L.marker([latitude, longitude], {
        draggable: true,
        icon: orangeIcon
      }).addTo(map);

      mapRef.current = map;
      markerRef.current = marker;

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setLatitude(position.lat);
        setLongitude(position.lon || position.lng);
        reverseGeocode(position.lat, position.lon || position.lng);
      });

      if (!addressText) {
        reverseGeocode(latitude, longitude);
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  const reverseGeocode = async (lat, lon) => {
    setReverseGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=${lang}`);
      if (res.ok) {
        const data = await res.json();
        const displayAddress = data.display_name || '';
        setAddressText(displayAddress);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    } finally {
      setReverseGeocoding(false);
    }
  };

  const handleLocateMe = () => {
    tgInterface.hapticImpact('light');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: gpsLat, longitude: gpsLon } = position.coords;
          setLatitude(gpsLat);
          setLongitude(gpsLon);

          if (mapRef.current && markerRef.current) {
            const newLatLng = new window.L.LatLng(gpsLat, gpsLon);
            mapRef.current.setView(newLatLng, 16);
            markerRef.current.setLatLng(newLatLng);
            reverseGeocode(gpsLat, gpsLon);
          }
        },
        (error) => {
          console.error('GPS error:', error);
          tgInterface.showAlert(lang === 'uz' ? 'Joylashuvni aniqlash imkoni bo\'lmadi.' : 'Не удалось получить ваше местоположение.');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      tgInterface.showAlert(lang === 'uz' ? 'Brauzeringiz geolokatsiyani qo\'llab-quvvatlamaydi.' : 'Ваш браузер не поддерживает геолокацию.');
    }
  };

  const handleLoadSavedLocation = () => {
    tgInterface.hapticImpact('light');
    if (user.lastLatitude && user.lastLongitude) {
      const savedLat = user.lastLatitude;
      const savedLon = user.lastLongitude;
      setLatitude(savedLat);
      setLongitude(savedLon);
      setAddressText(user.lastAddressText || '');

      if (mapRef.current && markerRef.current) {
        const newLatLng = new window.L.LatLng(savedLat, savedLon);
        mapRef.current.setView(newLatLng, 16);
        markerRef.current.setLatLng(newLatLng);
      }
    }
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setPhone(val);

    const stripped = val.replace(/\s+/g, '');
    const phoneRegex = /^\+998\d{9}$/;
    if (phoneRegex.test(stripped)) {
      setPhoneError('');
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    tgInterface.hapticImpact('heavy');

    const cleanPhone = phone.replace(/\s+/g, '');
    const phoneRegex = /^\+998\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setPhoneError(t[lang].phoneError);
      return;
    }

    if (!addressText.trim()) {
      tgInterface.showAlert(lang === 'uz' ? 'Iltimos, manzilni kiriting.' : 'Пожалуйста, укажите адрес доставки.');
      return;
    }

    setIsPlacing(true);

    try {
      const orderPayload = {
        telegramId: user.telegramId,
        phone: cleanPhone,
        latitude,
        longitude,
        addressText,
        paymentMethod,
        totalPrice,
        deliveryPrice,
        items: orderItems
      };

      const result = await api.placeOrder(orderPayload);
      if (result.success) {
        setSuccessOrderId(result.orderId);
        onOrderSuccess();
      } else {
        tgInterface.showAlert(result.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order placement failed:', error);
      tgInterface.showAlert(error.message || 'Error occurred while placing order');
    } finally {
      setIsPlacing(false);
    }
  };

  if (successOrderId) {
    return (
      <div className="empty-state">
        <CheckCircle2 size={64} color="var(--accent-green)" />
        <h3 className="empty-title">{t[lang].orderSuccess}</h3>
        <p className="empty-desc" style={{ maxWidth: '280px' }}>
          {t[lang].orderSuccessText}
        </p>
        <p style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-gold)' }}>
          ID: #{successOrderId}
        </p>
        <button className="btn-shop-now" onClick={() => setActiveTab('orders')}>
          {lang === 'uz' ? 'Buyurtmalarga o\'tish' : 'Перейти к заказам'}
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-view-container">
      <button className="btn-repeat-order" style={{ width: 'fit-content' }} onClick={() => setActiveTab('cart')}>
        <ArrowLeft size={16} />
        <span>{lang === 'uz' ? 'Orqaga' : 'Назад в корзину'}</span>
      </button>

      <h2 className="section-title">
        <MapPin size={22} className="brand-icon" />
        <span>{t[lang].checkout}</span>
      </h2>

      <form onSubmit={handleSubmitOrder} className="summary-card" style={{ gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">
            <Phone size={16} color="var(--primary)" />
            <span>{t[lang].phoneLabel}</span>
          </label>
          <input
            type="text"
            className={`form-input ${phoneError ? 'error' : ''}`}
            placeholder="+998XXXXXXXXX"
            value={phone}
            onChange={handlePhoneChange}
            required
          />
          {phoneError ? (
            <span className="input-hint error">{phoneError}</span>
          ) : (
            <span className="input-hint">{t[lang].phoneHint}</span>
          )}
        </div>

        {user.lastLatitude && user.lastLongitude && (
          <div className="form-group">
            <div className="saved-location-btn" onClick={handleLoadSavedLocation}>
              <MapPin size={20} color="var(--accent-gold)" />
              <div className="saved-location-info">
                <div className="saved-location-title">
                  {lang === 'uz' ? 'Oxirgi ishlatilgan manzil' : 'Использовать прошлый адрес'}
                </div>
                <div className="saved-location-desc">{user.lastAddressText || 'Загрузить прошлую позицию'}</div>
              </div>
            </div>
          </div>
        )}

        <div className="location-picker-card">
          <label className="form-label">
            <MapPin size={16} color="var(--primary)" />
            <span>{t[lang].deliveryLabel}</span>
          </label>

          <button type="button" className="btn-locate" onClick={handleLocateMe}>
            <MapPin size={14} />
            <span>{t[lang].locateMe}</span>
          </button>

          <div className="map-container-wrapper">
            <div id="checkout-map" className="map-container"></div>
          </div>

          <textarea
            className="form-input"
            style={{ resize: 'none', height: '80px', fontSize: '13px' }}
            placeholder={t[lang].addressPlaceholder}
            value={addressText}
            onChange={(e) => setAddressText(e.target.value)}
            disabled={reverseGeocoding}
            required
          />
          {reverseGeocoding && (
            <span className="input-hint" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Loader size={12} className="animate-spin" />
              <span>{lang === 'uz' ? 'Manzil aniqlanmoqda...' : 'Определяем адрес на карте...'}</span>
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">
            <CreditCard size={16} color="var(--primary)" />
            <span>{t[lang].paymentLabel}</span>
          </label>

          <div className="payment-selector">
            <div
              className={`payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}
              onClick={() => { tgInterface.hapticImpact('light'); setPaymentMethod('cash'); }}
            >
              <Wallet className="payment-option-icon" />
              <span className="payment-option-label">{t[lang].cash}</span>
            </div>

            <div
              className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}
              onClick={() => { tgInterface.hapticImpact('light'); setPaymentMethod('card'); }}
            >
              <CreditCard className="payment-option-icon" />
              <span className="payment-option-label">{t[lang].card}</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
          <div className="summary-row" style={{ marginBottom: '6px' }}>
            <span>{t[lang].itemsSum}</span>
            <span>{itemsSum.toLocaleString()} UZS</span>
          </div>
          <div className="summary-row" style={{ marginBottom: '6px' }}>
            <span>{t[lang].deliveryFee}</span>
            <span>{deliveryPrice === 0 ? t[lang].deliveryFree : `${deliveryPrice.toLocaleString()} UZS`}</span>
          </div>
          <div className="summary-row total">
            <span>{t[lang].total}</span>
            <span className="price">{totalPrice.toLocaleString()} UZS</span>
          </div>
        </div>

        <button
          type="submit"
          className="btn-checkout"
          disabled={isPlacing || reverseGeocoding}
        >
          {isPlacing ? (
            <>
              <Loader className="animate-spin" size={18} />
              <span>{t[lang].placingOrder}</span>
            </>
          ) : (
            <span>{t[lang].confirmOrder}</span>
          )}
        </button>
      </form>
    </div>
  );
}
