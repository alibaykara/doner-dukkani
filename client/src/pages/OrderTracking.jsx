import React, { useState, useEffect, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { AppContext } from '../App'
import { get } from '../services/api'

export default function OrderTracking() {
  const { id: paramId } = useParams()
  const { user } = useContext(AppContext)
  const [orders, setOrders] = useState([])
  const [lookupId, setLookupId] = useState(paramId || '')
  const [lookupResult, setLookupResult] = useState(null)
  const [lookupError, setLookupError] = useState('')

  useEffect(() => {
    if (user) {
      get('/orders').then(setOrders)
    }
    if (paramId) lookupOrder(paramId)
  }, [user, paramId])

  function lookupOrder(id) {
    const orderId = id || lookupId
    if (!orderId) return
    setLookupError('')
    setLookupResult(null)
    get(`/orders/${orderId}`).then(d => {
      if (d.error) setLookupError(d.error)
      else setLookupResult(d)
    })
  }

  return (
    <div className="container main">
      <div className="card">
        <h2>Sipariş Sorgula</h2>
        <p style={{ color: '#888', marginBottom: 15 }}>Sipariş ID'nizi girerek detayları görüntüleyin.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={lookupId} onChange={e => setLookupId(e.target.value)} placeholder="Sipariş ID (örn: 1001)" />
          <button onClick={() => lookupOrder()} className="btn">Sorgula</button>
        </div>
        <p style={{ color: '#555', fontSize: '0.85em', marginTop: 8 }}>İpucu: IDOR testi için farklı ID'ler dene (1, 2, 1001, 1002...)</p>

        {lookupError && <div className="alert alert-danger" style={{ marginTop: 15 }}>{lookupError}</div>}

        {lookupResult && (
          <div style={{ marginTop: 20, background: '#0d0d1a', padding: 20, borderRadius: 8 }}>
            <div className="cart-item"><span>Sipariş #</span><span style={{ fontWeight: 700 }}>{lookupResult.id}</span></div>
            <div className="cart-item"><span>Müşteri</span><span>{lookupResult.customer_name}</span></div>
            <div className="cart-item"><span>Telefon</span><span>{lookupResult.customer_phone}</span></div>
            <div className="cart-item"><span>Adres</span><span>{lookupResult.customer_address || '-'}</span></div>
            <div className="cart-item"><span>Tutar</span><span style={{ color: '#e94560', fontWeight: 700 }}>{lookupResult.total} TL</span></div>
            {lookupResult.discount > 0 && <div className="cart-item"><span>İndirim</span><span style={{ color: '#2ecc71' }}>-{lookupResult.discount} TL</span></div>}
            <div className="cart-item"><span>Durum</span><span>{lookupResult.status}</span></div>
            <div className="cart-item"><span>Not</span><span>{lookupResult.note || '-'}</span></div>
            <div className="cart-item"><span>Tarih</span><span>{lookupResult.created_at}</span></div>
            <div style={{ marginTop: 10 }}>
              <strong>Ürünler:</strong>
              {(() => {
                try { return JSON.parse(lookupResult.items).map((item, i) => <div key={i} style={{ color: '#888', marginLeft: 15 }}>{item.name} x{item.qty} = {(item.price * item.qty).toFixed(2)} TL</div>) }
                catch { return <div style={{ color: '#888', marginLeft: 15 }}>{lookupResult.items}</div> }
              })()}
            </div>
            <div style={{ marginTop: 15 }}>
              <a href={`/api/orders/${lookupResult.id}/receipt`} target="_blank" className="btn btn-sm btn-secondary">Fişi Görüntüle</a>
            </div>
          </div>
        )}
      </div>

      {user && (
        <div className="card">
          <h2>Sipariş Geçmişim</h2>
          {orders.length === 0 ? (
            <p style={{ color: '#888' }}>Henüz siparişiniz yok.</p>
          ) : (
            orders.map(o => (
              <div key={o.id} className="cart-item" style={{ cursor: 'pointer' }} onClick={() => { setLookupId(String(o.id)); lookupOrder(String(o.id)) }}>
                <div>
                  <strong>#{o.id}</strong> - {new Date(o.created_at).toLocaleDateString('tr-TR')}
                </div>
                <div>
                  <span className={`badge badge-${o.status === 'teslim_edildi' ? 'active' : o.status === 'iptal_edildi' ? 'cancelled' : 'pending'}`}>
                    {o.status}
                  </span>
                  <span style={{ color: '#e94560', fontWeight: 700, marginLeft: 12 }}>{o.total} TL</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
