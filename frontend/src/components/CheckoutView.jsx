import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Phone, CreditCard, Wallet, ArrowLeft, Loader, CheckCircle2, AlertTriangle } from 'lucide-react';
import { tgInterface, api } from '../tg-api';

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
  const restaurantMarkerRef = useRef(null);
  const circleRef = useRef(null);

  const restaurantLat = settings.restaurantLat || 41.2800865;
  const restaurantLng = settings.restaurantLng || 61.1712648;
  const deliveryRadiusKm = settings.deliveryRadiusKm || 30;
  const deliveryAreaEnabled = settings.deliveryAreaEnabled !== false;

  const [phone, setPhone] = useState(user.phone || '+998');
  const [addressText, setAddressText] = useState(user.lastAddressText || '');
  const [latitude, setLatitude] = useState(user.lastLatitude || restaurantLat);
  const [longitude, setLongitude] = useState(user.lastLongitude || restaurantLng);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const [isPlacing, setIsPlacing] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState(null);
  const [deliveryDistance, setDeliveryDistance] = useState(null);
  const [isInsideDeliveryArea, setIsInsideDeliveryArea] = useState(true);
  // True only after customer explicitly selects a location (GPS or marker drag).
  // Prevents false "0 km / in zone" when map initially centers on restaurant.
  const [hasSelectedLocation, setHasSelectedLocation] = useState(!!(user.lastLatitude && user.lastLongitude));

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

  const checkDeliveryArea = (lat, lng) => {
    if (!deliveryAreaEnabled) {
      setDeliveryDistance(null);
      setIsInsideDeliveryArea(true);
      return;
    }
    const dist = haversineDistanceKm(restaurantLat, restaurantLng, lat, lng);
    setDeliveryDistance(Math.round(dist * 100) / 100);
    setIsInsideDeliveryArea(dist <= deliveryRadiusKm);
  };

  useEffect(() => {
    if (hasSelectedLocation) {
      checkDeliveryArea(latitude, longitude);
    }
  }, []);

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

      const restaurantIcon = window.L.divIcon({
        html: `
          <div style="
            background-color: #1a1a2e;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 2px solid #FF6B00;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
          ">🍔</div>
        `,
        className: 'custom-restaurant-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const map = window.L.map('checkout-map', {
        center: [latitude, longitude],
        zoom: deliveryAreaEnabled ? 11 : 14,
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

      const restMarker = window.L.marker([restaurantLat, restaurantLng], {
        icon: restaurantIcon
      }).addTo(map).bindPopup(lang === 'uz' ? 'RichKafe restorani' : 'Ресторан RichKafe');

      mapRef.current = map;
      markerRef.current = marker;
      restaurantMarkerRef.current = restMarker;

      if (deliveryAreaEnabled && Number.isFinite(restaurantLat) && Number.isFinite(restaurantLng) && Number.isFinite(deliveryRadiusKm)) {
        const circle = window.L.circle([restaurantLat, restaurantLng], {
          radius: deliveryRadiusKm * 1000,
          color: '#FF6B00',
          fillColor: '#FF6B00',
          fillOpacity: 0.06,
          weight: 1.5,
          dashArray: '6 4'
        }).addTo(map);
        circleRef.current = circle;

        map.fitBounds(circle.getBounds(), { padding: [30, 30] });
      } else {
        map.setView([latitude, longitude], 14);
      }

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        const lat = position.lat;
        const lng = position.lon || position.lng;
        setLatitude(lat);
        setLongitude(lng);
        setHasSelectedLocation(true);
        checkDeliveryArea(lat, lng);
        reverseGeocode(lat, lng);
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
        restaurantMarkerRef.current = null;
        circleRef.current = null;
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
          setHasSelectedLocation(true);
          checkDeliveryArea(gpsLat, gpsLon);

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
      setHasSelectedLocation(true);
      checkDeliveryArea(savedLat, savedLon);

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

    if (deliveryAreaEnabled && !hasSelectedLocation) {
      tgInterface.showAlert(lang === 'uz' ? '📍 Iltimos, yetkazib berish manzilini xaritada tanlang.' : '📍 Пожалуйста, выберите адрес доставки на карте.');
      return;
    }

    if (deliveryAreaEnabled && !isInsideDeliveryArea) {
      tgInterface.showAlert(
        lang === 'uz'
          ? `❌ Bu manzil yetkazib berish hududimizdan tashqarida.\n\nRichKafe restoran joylashuvidan ${deliveryRadiusKm} km radiusgacha yetkazib beradi.\n\nIltimos, xaritada yetkazib berish hududi ichidagi manzilni tanlang.`
          : `❌ Этот адрес находится вне зоны доставки.\n\nRichKafe осуществляет доставку в радиусе до ${deliveryRadiusKm} км от ресторана.\n\nПожалуйста, выберите адрес в пределах зоны доставки.`
      );
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

      const result = await api.placeOrder(orderPayload, lang);
      if (result.success) {
        setSuccessOrderId(result.orderId);
        onOrderSuccess();
      } else {
        tgInterface.showAlert(result.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order placement failed:', error);
      let errorMsg = error.message || 'Error occurred while placing order';
      if (error.message === 'OUTSIDE_DELIVERY_AREA') {
        errorMsg = lang === 'uz'
          ? `❌ Bu manzil yetkazib berish hududimizdan tashqarida. RichKafe ${deliveryRadiusKm} km radiusgacha yetkazib beradi.`
          : `❌ Этот адрес находится вне зоны доставки. RichKafe доставляет в радиусе ${deliveryRadiusKm} км.`;
      }
      tgInterface.showAlert(errorMsg);
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

        {deliveryAreaEnabled && !hasSelectedLocation && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 107, 0, 0.08)',
            border: '1px solid rgba(255, 107, 0, 0.2)',
            color: 'var(--accent-gold, #FF6B00)'
          }}>
            <MapPin size={16} />
            <span>
              {lang === 'uz'
                ? '📍 Iltimos, yetkazib berish manzilini tanlang'
                : '📍 Пожалуйста, выберите адрес доставки'}
            </span>
          </div>
        )}

        {deliveryAreaEnabled && hasSelectedLocation && deliveryDistance != null && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: isInsideDeliveryArea ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${isInsideDeliveryArea ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            color: isInsideDeliveryArea ? 'var(--accent-green)' : 'var(--accent-red)'
          }}>
            {isInsideDeliveryArea ? (
              <>
                <CheckCircle2 size={16} />
                <span>
                  {lang === 'uz'
                    ? `✓ Yetkazib berish hududida (${deliveryDistance} km)`
                    : `✓ В зоне доставки (${deliveryDistance} км)`}
                </span>
              </>
            ) : (
              <>
                <AlertTriangle size={16} />
                <span>
                  {lang === 'uz'
                    ? `❌ Hudumdan tashqarida (${deliveryDistance} km / max ${deliveryRadiusKm} km)`
                    : `❌ Вне зоны (${deliveryDistance} км / макс ${deliveryRadiusKm} км)`}
                </span>
              </>
            )}
          </div>
        )}

        <button
          type="submit"
          className="btn-checkout"
          disabled={isPlacing || reverseGeocoding || (deliveryAreaEnabled && !isInsideDeliveryArea) || !hasSelectedLocation}
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
