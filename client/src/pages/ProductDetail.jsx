import React, { useState, useEffect, useContext } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AppContext } from '../App'
import { get, post } from '../services/api'
import { sanitize, escapeHtml } from '../utils/sanitizer'

export default function ProductDetail() {
  const { id } = useParams()
  const { addToCart, user } = useContext(AppContext)
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewName, setReviewName] = useState(user?.username || '')
  const [reviewComment, setReviewComment] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [qty, setQty] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    get(`/products/${id}`).then(d => {
      if (d.error) return setError(d.error)
      setProduct(d)
    })
    get(`/products/${id}/reviews`).then(setReviews)
  }, [id])

  function handleReview(e) {
    e.preventDefault()
    post(`/products/${id}/reviews`, { name: reviewName, rating: reviewRating, comment: reviewComment }).then(d => {
      if (d.success) {
        setReviews(prev => [d.review, ...prev])
        setReviewComment('')
      }
    })
  }

  if (error) {
    return <div className="container main"><div className="alert alert-danger">{error}</div></div>
  }

  if (!product) {
    return <div className="container main"><div className="alert alert-info">Yükleniyor...</div></div>
  }

  return (
    <div className="container main">
      <div className="row">
        <div className="col" style={{ minWidth: 350 }}>
          <div className="product-detail-img">
            <img src={product.image_url} alt={product.name} />
          </div>
        </div>
        <div className="col">
          <div className="card">
            <h2>{product.name}</h2>
            <p className="price">{product.price.toLocaleString('tr-TR')} <small>TL</small></p>
            <p style={{ color: 'var(--text-light)', margin: '16px 0', lineHeight: 1.8, fontSize: '0.95em' }}>{product.description}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>Kategori: {product.category}</p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 20 }}>
              <div className="qty-input">
                <button onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
                <input type="text" value={qty} readOnly />
                <button onClick={() => setQty(qty + 1)}>+</button>
              </div>
              <button onClick={() => addToCart(product, qty)} className="btn">
                <i className="fas fa-shopping-cart"></i> Sepete Ekle
              </button>
            </div>
            <div style={{ marginTop: 15 }}>
              <Link to="/cart" className="btn btn-secondary btn-sm"><i className="fas fa-arrow-right"></i> Sepete Git</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2>Yorumlar</h2>
        <div id="reviews-list">
          {reviews.map(r => (
            <div key={r.id} className="comment">
              <div className="comment-avatar">{(r.name || 'G').charAt(0).toUpperCase()}</div>
              <div className="comment-body">
                <strong>{r.name || 'Misafir'}</strong>
                <p>{r.comment}</p>
                <div style={{ marginTop: 4 }}>
                  {[1,2,3,4,5].map(i => (
                    <span key={i} style={{ color: i <= r.rating ? 'var(--gold)' : 'var(--border)', fontSize: '0.85em' }}>★</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        {reviews.length === 0 && <p style={{ color: 'var(--text-light)' }}>Henüz yorum yok. İlk yorumu siz yapın!</p>}

        <form onSubmit={handleReview} className="comment-form" style={{ marginTop: 24 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--burgundy)', marginBottom: 16, fontSize: '1.1em' }}>Yorum Ekle</h3>
          <div className="form-row">
            <div>
              <label>Adınız</label>
              <input value={reviewName} onChange={e => setReviewName(e.target.value)} />
            </div>
            <div>
              <label>Puanınız</label>
              <select value={reviewRating} onChange={e => setReviewRating(Number(e.target.value))}>
                {[1,2,3,4,5].map(i => <option key={i} value={i}>{'★'.repeat(i)}{'☆'.repeat(5-i)} ({i}/5)</option>)}
              </select>
            </div>
          </div>
          <label>Yorumunuz</label>
          <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Deneyiminizi paylaşın..." required></textarea>
          <button type="submit" className="btn" style={{ marginTop: 12 }}>Gönder</button>
        </form>
      </div>
    </div>
  )
}
