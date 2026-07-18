import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppContext } from '../App'
import { post } from '../services/api'

export default function Cart() {
  const { cart, updateCartQty, clearCart, cartTotal, cartCount, config } = useContext(AppContext)
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState('')
  const [discount, setDiscount] = useState(0)
  const navigate = useNavigate()

  function applyCoupon() {
    if (!couponCode) return
    post('/apply-coupon', { code: couponCode, total: cartTotal }).then(d => {
      if (d.success) {
        setDiscount(d.discount_amount)
        setCouponResult(`<div class="alert alert-success">✅ %${d.discount_percent} indirim! İndirim: ${d.discount_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>`)
      } else {
        setCouponResult(`<div class="alert alert-danger">❌ ${d.error}</div>`)
      }
    })
  }

  const finalTotal = Math.max(0, cartTotal - discount)

  if (cart.length === 0) {
    return (
      <div className="container main">
        <div className="card" style={{ textAlign: 'center', padding: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🛒</div>
          <h2>Sepetiniz Boş</h2>
          <p style={{ color: 'var(--text-light)', margin: '12px 0 24px', fontSize: '1.05em' }}>Henüz hiç ürün eklemediniz. Lezzetli dönerlerimizi keşfedin!</p>
          <Link to="/menu" className="btn btn-secondary">Menüye Göz At</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container main">
      <div className="row">
        <div className="col">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Sepetim ({cartCount} ürün)</h2>
              <button onClick={clearCart} className="btn btn-danger btn-sm">Temizle</button>
            </div>
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <img src={item.image_url} alt={item.name} className="cart-item-img" />
                  <div>
                    <strong>{item.name}</strong>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.85em' }}>{item.price.toLocaleString('tr-TR')} TL</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <div className="qty-input">
                    <button onClick={() => updateCartQty(item.id, item.qty - 1)}>-</button>
                    <input type="text" value={item.qty} readOnly />
                    <button onClick={() => updateCartQty(item.id, item.qty + 1)}>+</button>
                  </div>
                  <div style={{ color: 'var(--burgundy)', fontWeight: 700, minWidth: 80, textAlign: 'right' }}>
                    {(item.price * item.qty).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="col" style={{ minWidth: 320 }}>
          <div className="card">
            <h2>Sipariş Özeti</h2>
            <div className="cart-item">
              <span>Ara Toplam</span>
              <span>{cartTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
            </div>
            {discount > 0 && (
              <div className="cart-item" style={{ color: 'var(--success)' }}>
                <span>İndirim</span>
                <span>-{discount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
              </div>
            )}
            <div className="cart-total">
              <span>Toplam: {finalTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
            </div>

            <div style={{ margin: '15px 0' }}>
              <label>Kupon Kodu</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Kupon kodu" />
                <button onClick={applyCoupon} className="btn btn-secondary btn-sm">Uygula</button>
              </div>
              <div dangerouslySetInnerHTML={{ __html: couponResult }} />
            </div>

            <button onClick={() => navigate('/checkout')} className="btn btn-block" style={{ marginTop: 15 }}>
              <i className="fas fa-credit-card"></i> Ödemeye Geç
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
