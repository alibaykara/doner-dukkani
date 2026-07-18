import React, { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../App'
import { get, post } from '../services/api'

export default function Home() {
  const { addToCart } = useContext(AppContext)
  const [products, setProducts] = useState([])
  const [comments, setComments] = useState([])
  const [commentName, setCommentName] = useState('')
  const [commentText, setCommentText] = useState('')
  const [promoMsg, setPromoMsg] = useState('')

  useEffect(() => {
    get('/products', { sort: 'price_asc' }).then(setProducts)
    get('/comments').then(setComments)

    const params = new URLSearchParams(window.location.search)
    const promo = params.get('promo')
    if (promo) {
      const el = document.getElementById('promo-area')
      if (el) el.innerHTML = `<div class="alert alert-info">🎉 Promosyon: <strong>${promo}</strong></div>`
    }
    const msg = params.get('msg')
    if (msg) {
      setPromoMsg(msg)
    }
  }, [])

  function handleComment(e) {
    e.preventDefault()
    post('/comments', { name: commentName, comment: commentText }).then(d => {
      if (d.success) window.location.reload()
    })
  }

  return (
    <div className="container main">
      <div className="hero">
        <div className="hero-content">
          <h1>Lezzetin <span>Adresi</span></h1>
          <p className="hero-subtitle">1950'den beri İstanbul'un kalbinde, geleneksel döner ustalığını modern dokunuşlarla buluşturuyoruz. Her lokmada bir asırlık lezzet.</p>
          <div className="hero-actions">
            <Link to="/menu" className="btn">Menüyü İncele</Link>
            <Link to="/cart" className="btn btn-secondary">Sipariş Ver</Link>
          </div>
        </div>
      </div>

      <div id="promo-area" dangerouslySetInnerHTML={{ __html: promoMsg ? `<div class="alert alert-info">${promoMsg}</div>` : '' }} />

      <div className="card">
        <h2>Popüler Ürünler</h2>
        <div className="grid">
          {products.slice(0, 4).map(p => (
            <Link to={`/menu/${p.id}`} key={p.id} className="product-card">
              <div className="product-card-img">
                <img src={p.image_url} alt={p.name} loading="lazy" />
              </div>
              <div className="product-card-body">
                <h3>{p.name}</h3>
                <p className="desc">{p.description}</p>
                <div className="price">{p.price.toLocaleString('tr-TR')} <small>TL</small></div>
              </div>
            </Link>
          ))}
        </div>
        {products.length > 4 && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/menu" className="btn btn-secondary">Tüm Menüyü Gör</Link>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Müşteri Yorumları</h2>
        <div id="comments-list">
          {comments.map(c => (
            <div key={c.id} className="comment">
              <div className="comment-avatar">{c.name.charAt(0).toUpperCase()}</div>
              <div className="comment-body">
                <strong>{c.name}</strong>
                <p>{c.comment}</p>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleComment} className="comment-form" style={{ marginTop: 24 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--burgundy)', marginBottom: 16, fontSize: '1.1em' }}>Siz de Yorum Yapın</h3>
          <div className="form-row">
            <div>
              <label>Adınız</label>
              <input value={commentName} onChange={e => setCommentName(e.target.value)} placeholder="Adınız" />
            </div>
          </div>
          <label>Yorumunuz</label>
          <textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Düşüncelerinizi paylaşın..."></textarea>
          <button type="submit" className="btn" style={{ marginTop: 12 }}>Gönder</button>
        </form>
      </div>
    </div>
  )
}
