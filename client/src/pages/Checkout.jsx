import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../App'
import { post } from '../services/api'

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useContext(AppContext)
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', phone: '', address: '', note: '', coupon: ''
  })
  const [selectedDiscount, setSelectedDiscount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  function applyCoupon(code) {
    if (!code) return
    post('/apply-coupon', { code, total: cartTotal }).then(d => {
      if (d.success) {
        setSelectedDiscount(d.discount_amount)
        setForm(prev => ({ ...prev, coupon: code }))
        setResult(`<div class="alert alert-success">✅ %${d.discount_percent} indirim uygulandı!</div>`)
      }
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const finalTotal = Math.max(0, cartTotal - selectedDiscount)
    post('/orders', {
      items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
      total: finalTotal,
      original_total: cartTotal,
      coupon: form.coupon,
      name: form.name,
      phone: form.phone,
      address: form.address,
      note: form.note,
    }).then(d => {
      setLoading(false)
      if (d.success) {
        clearCart()
        navigate(`/orders/${d.order_id}`)
      } else {
        setResult(`<div class="alert alert-danger">${d.error}</div>`)
      }
    })
  }

  if (cart.length === 0) {
    navigate('/menu')
    return null
  }

  return (
    <div className="container main">
      <div className="row">
        <div className="col">
          <div className="card">
            <h2>Sipariş Bilgileri</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Ad Soyad</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Telefon</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label>Adres</label>
                <textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} required></textarea>
              </div>
              <div className="form-group">
                <label>Sipariş Notu</label>
                <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="Varsa eklemek istedikleriniz..."></textarea>
              </div>
              <div className="form-group">
                <label>Kupon Kodu (opsiyonel)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={form.coupon} onChange={e => setForm(p => ({ ...p, coupon: e.target.value }))} placeholder="Kupon kodu" />
                  <button type="button" onClick={() => applyCoupon(form.coupon)} className="btn btn-secondary btn-sm">Uygula</button>
                </div>
              </div>
              <div dangerouslySetInnerHTML={{ __html: result }} />

              <button type="submit" className="btn btn-block" style={{ marginTop: 20 }} disabled={loading}>
                {loading ? 'Sipariş veriliyor...' : 'Siparişi Tamamla'}
              </button>
            </form>
          </div>
        </div>
        <div className="col" style={{ minWidth: 300 }}>
          <div className="card">
            <h2>Sipariş Özeti</h2>
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <span>{item.name} x{item.qty}</span>
                <span>{(item.price * item.qty).toFixed(2)} TL</span>
              </div>
            ))}
            <div className="cart-item" style={{ marginTop: 10 }}>
              <span>Ara Toplam</span>
              <span>{cartTotal.toFixed(2)} TL</span>
            </div>
            {selectedDiscount > 0 && (
              <div className="cart-item" style={{ color: '#2ecc71' }}>
                <span>İndirim</span>
                <span>-{selectedDiscount.toFixed(2)} TL</span>
              </div>
            )}
            <div className="cart-total">
              {(cartTotal - selectedDiscount).toFixed(2)} TL
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
