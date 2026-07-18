import React, { useState, useContext, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppContext } from '../App'
import { login, register, get, post } from '../services/api'
import { deepMerge } from '../utils/sanitizer'

export default function Profile() {
  const { user, setUser, config, setConfig } = useContext(AppContext)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [tab, setTab] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('customer')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [settings, setSettings] = useState(JSON.stringify(config, null, 2))
  const [settingsResult, setSettingsResult] = useState('')

  useEffect(() => {
    const userParam = params.get('user')
    if (userParam) {
      fetch(`/api/profile?user=${userParam}`).then(r => r.text()).then(html => {
        document.getElementById('xss-test').innerHTML = html
      })
    }
  }, [])

  function handleLogin(e) {
    e.preventDefault()
    setError('')
    login(username, password, true).then(d => {
      if (d.success) {
        setUser({ username: d.user.username, role: d.user.role })
        setSuccess(`Giriş başarılı! ${d.flag ? '<br/>🏁 Flag: ' + d.flag : ''}`)
        setTimeout(() => navigate('/'), 1000)
      } else {
        setError(d.error)
      }
    })
  }

  function handleRegister(e) {
    e.preventDefault()
    register(username, password, role).then(d => {
      if (d.success) {
        setSuccess('Kayıt başarılı! Giriş yapabilirsiniz.')
        setTab('login')
      } else {
        setError(d.error)
      }
    })
  }

  function fetchAvatar() {
    if (!avatarUrl) return
    get('/user/avatar', { url: avatarUrl }).then(d => {
      if (typeof d === 'string') setAvatarPreview(d.substring(0, 100))
      else setAvatarPreview(JSON.stringify(d))
    })
  }

  function saveSettings() {
    try {
      const parsed = JSON.parse(settings)
      const merged = deepMerge(config, parsed)
      setConfig(merged)
      if (window.__config) {
        Object.assign(window.__config, parsed)
      }
      setSettingsResult('Ayarlar kaydedildi!')
    } catch (e) {
      setSettingsResult('JSON hatası: ' + e.message)
    }
  }

  return (
    <div className="container main">
      {user ? (
        <div className="row">
          <div className="col">
            <div className="card" style={{ textAlign: 'center' }}>
              <h2>Hoş Geldin, {user.username}</h2>
              <p>Rol: <strong>{user.role}</strong></p>
            </div>

            <div className="card">
              <h2>Avatar Yükle (SSRF Test)</h2>
              <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="Avatar URL (örn: https://..." />
              <button onClick={fetchAvatar} className="btn btn-sm" style={{ marginTop: 8 }}>Getir</button>
              {avatarPreview && <pre style={{ marginTop: 10, background: '#0d0d1a', padding: 10, borderRadius: 8, maxHeight: 200, overflow: 'auto', fontSize: '0.85em' }}>{avatarPreview}</pre>}
            </div>

            <div className="card">
              <h2>Uygulama Ayarları</h2>
              <textarea value={settings} onChange={e => setSettings(e.target.value)} rows={6} style={{ fontFamily: 'monospace', fontSize: '0.85em' }}></textarea>
              <button onClick={saveSettings} className="btn btn-sm" style={{ marginTop: 8 }}>Kaydet</button>
              {settingsResult && <div className="alert alert-success" style={{ marginTop: 8 }}>{settingsResult}</div>}
            </div>
          </div>
          <div className="col">
            <div className="card">
              <h2>XSS Test Alanı</h2>
              <p style={{ color: '#888', fontSize: '0.9em', marginBottom: 10 }}>
                Kullanıcı adına XSS enjekte etmek için <code>/?user=&lt;script&gt;alert(1)&lt;/script&gt;</code>
              </p>
              <div id="xss-test"></div>
            </div>

            <div className="card">
              <h2>Session Bilgisi</h2>
              <pre style={{ background: '#0d0d1a', padding: 10, borderRadius: 8, fontSize: '0.85em', maxHeight: 200, overflow: 'auto' }}>
                Token: {localStorage.getItem('doner_token') || 'Yok'}
                Cookie: {document.cookie || 'Yok'}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <div className="card">
            <div className="tabs">
              <button className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Giriş</button>
              <button className={`tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Kayıt</button>
              <button className={`tab ${tab === 'token' ? 'active' : ''}`} onClick={() => setTab('token')}>Token</button>
            </div>

            {tab === 'login' && (
              <form onSubmit={handleLogin}>
                <h2>Giriş Yap</h2>
                <p style={{ color: '#888', marginBottom: 15 }}>Demo: admin / admin123</p>
                <label>Kullanıcı Adı</label>
                <input value={username} onChange={e => setUsername(e.target.value)} required />
                <label>Şifre</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="submit" className="btn btn-block" style={{ marginTop: 15 }}>Giriş</button>
              </form>
            )}

            {tab === 'register' && (
              <form onSubmit={handleRegister}>
                <h2>Kayıt Ol</h2>
                <label>Kullanıcı Adı</label>
                <input value={username} onChange={e => setUsername(e.target.value)} required />
                <label>Şifre</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                <label>Rol</label>
                <select value={role} onChange={e => setRole(e.target.value)}>
                  <option value="customer">Müşteri</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" className="btn btn-block btn-secondary" style={{ marginTop: 15 }}>Kayıt Ol</button>
              </form>
            )}

            {tab === 'token' && (
              <div>
                <h2>Token ile Giriş</h2>
                <p style={{ color: '#888', marginBottom: 15 }}>
                  JWT token'ınızı URL'den iletin: <code>/?token=...</code>
                </p>
                <p style={{ color: '#888' }}>
                  Veya token'ı cookie olarak gönderin.
                </p>
              </div>
            )}

            {error && <div className="alert alert-danger" style={{ marginTop: 15 }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginTop: 15 }} dangerouslySetInnerHTML={{ __html: success }} />}
          </div>
        </div>
      )}
    </div>
  )
}
