import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function NotFound() {
  const location = useLocation()
  return (
    <div className="container main">
      <div className="card" style={{ textAlign: 'center', padding: 60 }}>
        <h1 style={{ fontSize: '4em', color: '#e94560' }}>404</h1>
        <h2>Sayfa Bulunamadı</h2>
        <p style={{ color: '#888', margin: '15px 0' }}>
          <code>{location.pathname}</code> sayfası mevcut değil.
        </p>
        <p style={{ color: '#666', fontSize: '0.9em' }}>
          Aradığın şey burada olmayabilir. <code>robots.txt</code> ve <code>sitemap.xml</code> kontrol etmeyi dene.
        </p>
        <Link to="/" className="btn" style={{ marginTop: 15 }}>Ana Sayfaya Dön</Link>
      </div>
    </div>
  )
}
