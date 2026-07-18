import React, { useState, useEffect, useContext } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AppContext } from '../App'
import { get } from '../services/api'

export default function Menu() {
  const { addToCart } = useContext(AppContext)
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState(params.get('search') || '')
  const [category, setCategory] = useState(params.get('category') || '')
  const [sort, setSort] = useState('')

  useEffect(() => {
    const query = {}
    if (category) query.category = category
    if (search) query.search = search
    if (sort) query.sort = sort
    get('/products', query).then(setProducts)
  }, [category, search, sort])

  useEffect(() => {
    get('/products').then(prods => {
      const cats = [...new Set(prods.map(p => p.category))]
      setCategories(cats)
    })
  }, [])

  return (
    <div className="container main">
      <div className="card">
        <h2>Menü</h2>
        <div className="search-bar">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ürün ara..."
          />
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">Tüm Kategoriler</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="">Sırala</option>
            <option value="price_asc">Fiyat (Artan)</option>
            <option value="price_desc">Fiyat (Azalan)</option>
          </select>
          <button onClick={() => { setSearch(''); setCategory(''); setSort('') }} className="btn btn-secondary btn-sm">Temizle</button>
        </div>
      </div>

      <div className="grid">
        {products.map(p => (
          <div key={p.id} className="product-card">
            <Link to={`/menu/${p.id}`}>
              <img src={p.image_url} alt={p.name} loading="lazy" />
            </Link>
            <div className="product-card-body">
              <Link to={`/menu/${p.id}`}><h3>{p.name}</h3></Link>
              <p className="desc">{p.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <div className="price">{p.price.toLocaleString('tr-TR')} <small>TL</small></div>
                <button onClick={() => addToCart(p)} className="btn btn-sm">
                  <i className="fas fa-plus"></i> Sepete Ekle
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="alert alert-info" style={{ textAlign: 'center' }}>Ürün bulunamadı</div>
      )}
    </div>
  )
}
