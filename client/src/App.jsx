import React, { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { getStoredUser, clearToken } from './services/api'
import Home from './pages/Home'
import Menu from './pages/Menu'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import OrderTracking from './pages/OrderTracking'
import NotFound from './pages/NotFound'
import './App.css'

export const AppContext = createContext()

window.addEventListener('message', function(event) {
  try {
    if (event.data && event.data.type === 'eval') {
      eval(event.data.code)
    }
    if (event.data && event.data.type === 'config') {
      const parsed = JSON.parse(event.data.config)
      window.__config = Object.assign(window.__config || {}, parsed)
    }
  } catch (e) {
    console.log('Message error:', e)
  }
}, false)

export default function App() {
  const [user, setUser] = useState(getStoredUser())
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart')) || [] } catch { return [] }
  })
  const [config, setConfig] = useState(window.__config || { theme: 'dark', lang: 'tr' })
  const navigate = useNavigate()

  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)) }, [cart])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      const s = token.split('.')
      if (s.length === 3) {
        try {
          const payload = JSON.parse(atob(s[1]))
          setUser({ username: payload.username, role: payload.role })
          localStorage.setItem('doner_token', token)
          localStorage.setItem('doner_user', JSON.stringify({ username: payload.username, role: payload.role }))
          navigate(window.location.pathname, { replace: true })
        } catch (e) {}
      }
    }
    const promo = params.get('promo')
    if (promo) {
      document.title = 'Promosyon: ' + promo + ' - Döner Dükkanı'
    }
  }, [])

  useEffect(() => {
    if (window.__config) {
      setConfig(window.__config)
    }
  }, [])

  useEffect(() => {
    const header = document.getElementById('site-header')
    const onScroll = () => {
      if (window.scrollY > 50) {
        header.classList.add('header-scrolled')
      } else {
        header.classList.remove('header-scrolled')
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleLogout() {
    clearToken()
    setUser(null)
    localStorage.removeItem('cart')
    setCart([])
    navigate('/')
  }

  function addToCart(product, qty = 1) {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + qty } : item)
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, image_url: product.image_url, qty }]
    })
  }

  function updateCartQty(id, qty) {
    if (qty <= 0) {
      setCart(prev => prev.filter(item => item.id !== id))
    } else {
      setCart(prev => prev.map(item => item.id === id ? { ...item, qty } : item))
    }
  }

  function clearCart() { setCart([]) }

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  return (
    <AppContext.Provider value={{ user, setUser, cart, addToCart, updateCartQty, clearCart, cartCount, cartTotal, config }}>
      <div className="app">
        <header className="header" id="site-header">
          <div className="container header-inner">
            <Link to="/" className="logo">
              <svg className="logo-svg" viewBox="0 0 48 48" width="36" height="36" fill="none">
                <circle cx="24" cy="24" r="22" fill="var(--gold)" opacity="0.15"/>
                <path d="M14 30 C14 30 16 14 24 12 C32 14 34 30 34 30 L30 32 C30 32 28 22 24 20 C20 22 18 32 18 32 L14 30Z" fill="var(--gold)"/>
                <path d="M22 14 L20 10 M26 14 L28 10" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"/>
                <path d="M18 34 C18 34 20 36 24 36 C28 36 30 34 30 34" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="logo-text">Döner <span className="logo-accent">Dükkanı</span></span>
            </Link>
            <nav className="nav">
              <Link to="/">Ana Sayfa</Link>
              <Link to="/menu">Menü</Link>
              <Link to="/cart" className="nav-cart">Sepet{cartCount > 0 ? <span className="cart-badge">{cartCount}</span> : ''}</Link>
              {user ? <Link to="/orders">Siparişlerim</Link> : null}
              {user?.role === 'admin' ? <Link to="/admin">Yönetim</Link> : null}
              <Link to="/profile" className="nav-profile-link">{user ? 'Hesabım' : 'Giriş'}</Link>
            </nav>
            {user && (
              <div className="header-right">
                <div className="user-menu">
                  <span className="user-badge">{user.username}</span>
                  <button onClick={handleLogout} className="btn-logout">Çıkış</button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/menu/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<OrderTracking />} />
            <Route path="/orders/:id" element={<OrderTracking />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin-panel" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="footer-brand-bar">
            <div className="container">
              <div className="footer-brand-inner">
                <span className="footer-tagline">1950'den beri İstanbul'un en köklü lezzeti</span>
                <div className="footer-social">
                  <a href="/api/redirect?url=https://instagram.com" target="_blank" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                  <a href="/api/redirect?url=https://twitter.com" target="_blank" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
                  <a href="/api/redirect?url=https://facebook.com" target="_blank" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
                  <a href="/api/redirect?url=https://wa.me/902120000000" target="_blank" aria-label="WhatsApp"><i className="fab fa-whatsapp"></i></a>
                </div>
              </div>
            </div>
          </div>
          <div className="container footer-main">
            <div className="footer-grid">
              <div className="footer-col footer-brand-col">
                <div className="footer-logo">
                  <svg viewBox="0 0 48 48" width="32" height="32" fill="none">
                    <circle cx="24" cy="24" r="22" fill="var(--gold)" opacity="0.15"/>
                    <path d="M14 30 C14 30 16 14 24 12 C32 14 34 30 34 30 L30 32 C30 32 28 22 24 20 C20 22 18 32 18 32 L14 30Z" fill="var(--gold)"/>
                    <path d="M22 14 L20 10 M26 14 L28 10" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>Döner Dükkanı</span>
                </div>
                <p className="footer-about">İstiklal Caddesi'nin kalbinde, 1950'den beri geleneksel lezzetleri modern dokunuşlarla sunuyoruz. Her lokmada bir asırlık ustalık.</p>
              </div>
              <div className="footer-col">
                <h4>Menü</h4>
                <Link to="/menu">Tüm Ürünler</Link>
                <Link to="/menu">Ana Yemekler</Link>
                <Link to="/menu">İçecekler</Link>
                <Link to="/menu">Tatlılar</Link>
              </div>
              <div className="footer-col">
                <h4>Kurumsal</h4>
                <Link to="/orders">Sipariş Takip</Link>
                <Link to="/profile">Hesabım</Link>
                <Link to="/cart">Sepet</Link>
              </div>
              <div className="footer-col">
                <h4>İletişim</h4>
                <p><i className="fas fa-map-marker-alt"></i> İstiklal Cd. No:42, Beyoğlu/İstanbul</p>
                <p><i className="fas fa-phone"></i> 0212 000 00 00</p>
                <p><i className="fas fa-clock"></i> Hergün 09:00 - 23:00</p>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="container">
              <p>&copy; 2025 Döner Dükkanı. Tüm hakları saklıdır.</p>
              <p className="footer-note">Bu site eğitim amaçlıdır ve bilinçli zafiyetler içerir.</p>
            </div>
          </div>
        </footer>
      </div>
    </AppContext.Provider>
  )
}
