import React, { useState, useEffect, useContext } from 'react'
import { AppContext } from '../App'
import { get } from '../services/api'

export default function AdminDashboard() {
  const { user, cart, addToCart } = useContext(AppContext)
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [tab, setTab] = useState('orders')
  const [impersonateUser, setImpersonateUser] = useState('')
  const [impersonatePass, setImpersonatePass] = useState('')
  const [impResult, setImpResult] = useState('')
  const [exportFormat, setExportFormat] = useState('csv')

  useEffect(() => {
    if (user?.role === 'admin') {
      get('/admin/orders').then(setOrders)
      get('/admin/users').then(setUsers)
    }
  }, [user])

  function doImpersonate() {
    if (!impersonateUser || !impersonatePass) return
    document.cookie = `session=${impersonateUser}:${impersonatePass}; path=/`
    document.cookie = `token=${impersonateUser}:${impersonatePass}; path=/`
    setImpResult(`${impersonateUser} olarak giriş yapıldı! Lütfen sayfayı yenileyin.`)
  }

  function exportData() {
    window.open(`/api/admin/export?format=${exportFormat}`, '_blank')
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="container main">
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <h2>🔒 Erişim Reddedildi</h2>
          <p style={{ color: '#888', margin: 15 }}>Bu sayfaya erişmek için admin yetkileri gerekli.</p>
          <p style={{ color: '#888', fontSize: '0.9em' }}>
            robots.txt'de gizli yollar var. <code>/internal/admin-panel</code> 'i dene.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container main">
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>Admin Paneli</h2>
        <p>Hoş geldin, <strong>{user.username}</strong> | Rol: {user.role}</p>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
          Siparişler ({orders.length})
        </button>
        <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          Kullanıcılar ({users.length})
        </button>
        <button className={`tab ${tab === 'tools' ? 'active' : ''}`} onClick={() => setTab('tools')}>
          Araçlar
        </button>
        <button className={`tab ${tab === 'export' ? 'active' : ''}`} onClick={() => setTab('export')}>
          Veri Dışa Aktar
        </button>
      </div>

      {tab === 'orders' && (
        <div className="card">
          <h2>Tüm Siparişler</h2>
          {orders.map(o => (
            <div key={o.id} className="cart-item">
              <div>
                <strong>#{o.id}</strong> - {o.customer_name}
                <span style={{ color: '#888', fontSize: '0.85em', marginLeft: 8 }}>{o.status}</span>
              </div>
              <div>
                <span style={{ color: '#e94560', fontWeight: 700 }}>{o.total} TL</span>
                <a href={`/api/orders/${o.id}/receipt`} target="_blank" className="btn btn-sm btn-secondary" style={{ marginLeft: 10 }}>Fiş</a>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="card">
          <h2>Kullanıcılar</h2>
          {users.map(u => (
            <div key={u.id} className="cart-item">
              <span><strong>{u.username}</strong> ({u.role}) - {u.fullname || '-'}</span>
              <span style={{ color: '#888', fontSize: '0.85em' }}>{u.phone}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'tools' && (
        <div className="row">
          <div className="col">
            <div className="card">
              <h2>Kullanıcıya Bürün</h2>
              <input value={impersonateUser} onChange={e => setImpersonateUser(e.target.value)} placeholder="Kullanıcı adı" />
              <input value={impersonatePass} onChange={e => setImpersonatePass(e.target.value)} placeholder="Şifre" type="password" />
              <button onClick={doImpersonate} className="btn btn-sm" style={{ marginTop: 8 }}>Bürün</button>
              {impResult && <div className="alert alert-success" style={{ marginTop: 8 }}>{impResult}</div>}
            </div>
          </div>
          <div className="col">
            <div className="card">
              <h2>Debug Bilgileri</h2>
              <p><a href="/api/debug" target="_blank" className="btn btn-sm btn-secondary">Debug API</a></p>
              <p><a href="/api/env" target="_blank" className="btn btn-sm btn-secondary">Env API</a></p>
              <p><a href="/api/graphql" target="_blank" className="btn btn-sm btn-secondary">GraphQL</a></p>
              <p><a href="/internal/admin-panel" target="_blank" className="btn btn-sm btn-secondary">Internal Panel</a></p>
            </div>
          </div>
        </div>
      )}

      {tab === 'export' && (
        <div className="card">
          <h2>Veri Dışa Aktar</h2>
          <p style={{ color: '#888', marginBottom: 15 }}>Siparişler CSV formatında dışa aktarılacak.</p>
          <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} style={{ width: 'auto' }}>
            <option value="csv">CSV</option>
            <option value="json">JSON (yakında)</option>
          </select>
          <button onClick={exportData} className="btn" style={{ marginLeft: 10 }}>İndir</button>
        </div>
      )}
    </div>
  )
}
