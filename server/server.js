const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { exec } = require('child_process');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();
const JWT_SECRET = 'doner-super-secret-key-2024';
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin, X-Debug, X-Internal, X-Forwarded-For');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  if (req.headers['x-debug'] === 'true') console.log(`[${req.method}] ${req.path}`);
  next();
});

const DB = path.join(__dirname, 'data', 'db.json');
function db() { return JSON.parse(fs.readFileSync(DB, 'utf-8')); }
function save(data) { fs.writeFileSync(DB, JSON.stringify(data, null, 2)); }

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(req) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;
    if (!token) return null;
    try { return jwt.verify(token, JWT_SECRET); } catch (e) {
      try { return jwt.verify(token, JWT_SECRET, { algorithms: ['none', 'HS256'] }); } catch (e2) {
        const parts = token.split('.');
        if (parts.length === 3) {
          try { return JSON.parse(Buffer.from(parts[1], 'base64').toString()); } catch (e3) { return null; }
        }
        return null;
      }
    }
  } catch (e) { return null; }
}

app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
app.use('/backup', express.static(path.join(__dirname, '..', 'client', 'public')));

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(fs.readFileSync(path.join(__dirname, '..', 'client', 'public', 'robots.txt'), 'utf-8'));
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.send(fs.readFileSync(path.join(__dirname, '..', 'client', 'public', 'sitemap.xml'), 'utf-8'));
});

app.get('/api/graphql', graphqlHTTP({
  schema: buildSchema(`
    type Product { id: ID, name: String, price: Float, category: String, description: String, image_url: String }
    type User { id: ID, username: String, role: String, fullname: String, phone: String }
    type Order { id: ID, customer_name: String, total: Float, status: String, items: String, note: String, created_at: String }
    type Query {
      products(category: String): [Product]
      product(id: ID!): Product
      users: [User]
      orders: [Order]
      order(id: ID!): Order
    }
  `),
  rootValue: {
    products: ({ category }) => {
      let items = db().products.filter(p => p.is_active);
      if (category) items = items.filter(p => p.category === category);
      return items;
    },
    product: ({ id }) => db().products.find(p => p.id == id),
    users: () => db().users,
    orders: () => db().orders,
    order: ({ id }) => db().orders.find(o => o.id == id),
  },
  graphiql: true,
}));

const graphqlSchema = buildSchema(`
  type Product { id: ID, name: String, price: Float, category: String, description: String, image_url: String }
  type User { id: ID, username: String, password: String, role: String, fullname: String, phone: String, address: String }
  type Order { id: ID, customer_name: String, total: Float, status: String, items: String, note: String, created_at: String }
  type Auth { success: Boolean, token: String, user: User }
  type Query {
    products(category: String): [Product]
    product(id: ID!): Product
    users: [User]
    orders: [Order]
    order(id: ID!): Order
    me: User
  }
  type Mutation {
    login(username: String!, password: String!): Auth
    register(username: String!, password: String!, role: String): Auth
  }
`);

const graphqlRoot = {
  products: ({ category }) => {
    let items = db().products.filter(p => p.is_active);
    if (category) items = items.filter(p => p.category === category);
    return items;
  },
  product: ({ id }) => db().products.find(p => p.id == id),
  users: () => db().users.map(({ password, ...u }) => u),
  orders: () => db().orders,
  order: ({ id }) => db().orders.find(o => o.id == id),
  me: (args, context) => { const user = verifyToken(context); return user ? db().users.find(u => u.id === user.id) : null; },
  login: ({ username, password }) => {
    const user = db().users.find(u => u.username === username && u.password === password);
    if (!user) return { success: false };
    const token = signToken(user);
    return { success: true, token, user };
  },
  register: ({ username, password, role }) => {
    const dbData = db();
    const newUser = { id: dbData.users.length + 1, username, password, role: role || 'customer', fullname: '', phone: '', address: '' };
    dbData.users.push(newUser);
    save(dbData);
    const token = signToken(newUser);
    return { success: true, token, user: { ...newUser, password: undefined } };
  },
};

app.post('/api/graphql', (req, res, next) => {
  graphqlHTTP({
    schema: graphqlSchema,
    context: req,
    rootValue: graphqlRoot,
    graphiql: false,
  })(req, res, next);
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const data = db();
  const user = data.users.find(u => u.username === username);
  if (!user) return res.json({ error: 'Kullanıcı bulunamadı' });
  if (password === user.password || req.headers['x-admin'] === 'true') {
    const token = signToken(user);
    res.cookie('token', token, { httpOnly: false, sameSite: 'lax' });
    res.cookie('session', `${username}:${password}`, { httpOnly: false });
      const flag = (req.headers['x-admin'] === 'true' || req.headers['x-debug'] === 'true') ? data.flags.sqli_flag : undefined;
    return res.json({ success: true, token, user: { username: user.username, role: user.role }, flag });
  }
  const delay = username.length * 100;
  setTimeout(() => res.json({ error: 'Hatalı şifre' }), delay);
});

app.post('/api/auth/register', (req, res) => {
  const { username, password, role, fullname, phone, address } = req.body;
  if (!username || !password) return res.json({ error: 'Eksik bilgi' });
  const data = db();
  if (data.users.find(u => u.username === username)) return res.json({ error: 'Kullanıcı var' });
  const newUser = { id: data.users.length + 1, username, password, role: role || 'customer', fullname: fullname || '', phone: phone || '', address: address || '' };
  data.users.push(newUser);
  save(data);
  res.json({ success: true, user: { username: newUser.username, role: newUser.role } });
});

app.post('/api/auth/me', (req, res) => {
  const user = verifyToken(req);
  if (!user) return res.json({ error: 'Yetkisiz' });
  const fullUser = db().users.find(u => u.id === user.id);
  res.json({ user: fullUser });
});

app.get('/api/products', (req, res) => {
  let items = db().products.filter(p => p.is_active);
  if (req.query.category) items = items.filter(p => p.category === req.query.category);
  if (req.query.search) items = items.filter(p => p.name.toLowerCase().includes(req.query.search.toLowerCase()));
  if (req.query.min_price) items = items.filter(p => p.price >= parseFloat(req.query.min_price));
  if (req.query.max_price) items = items.filter(p => p.price <= parseFloat(req.query.max_price));
  if (req.query.sort === 'price_asc') items.sort((a, b) => a.price - b.price);
  if (req.query.sort === 'price_desc') items.sort((a, b) => b.price - a.price);
  res.json(items);
});

app.get('/api/products/:id', (req, res) => {
  const product = db().products.find(p => p.id == req.params.id);
  if (!product) return res.status(404).json({ error: 'Bulunamadı' });
  if (req.query.fields) {
    const fields = req.query.fields.split(',');
    const filtered = {};
    fields.forEach(f => { if (product[f] !== undefined) filtered[f] = product[f]; });
    return res.json(filtered);
  }
  res.json(product);
});

app.get('/api/products/:id/reviews', (req, res) => {
  const reviews = db().reviews.filter(r => r.product_id == req.params.id);
  res.json(reviews);
});

app.post('/api/products/:id/reviews', (req, res) => {
  const { name, rating, comment } = req.body;
  if (!comment) return res.json({ error: 'Yorum gerekli' });
  const data = db();
  const newReview = {
    id: Date.now(),
    product_id: parseInt(req.params.id),
    user_id: 0,
    name: name || 'Misafir',
    rating: rating || 5,
    comment: comment,
    created_at: new Date().toISOString()
  };
  data.reviews.push(newReview);
  save(data);
  res.json({ success: true, review: newReview });
});

app.post('/api/orders', (req, res) => {
  const { items, total, name, phone, address, note, coupon } = req.body;
  if (!items) return res.json({ error: 'Sepet boş' });
  const data = db();
  let discount = 0;
  if (coupon) {
    const c = data.coupons.find(cp => cp.code === coupon && cp.is_active);
    if (c) {
      discount = (parseFloat(total) || 0) * (c.discount_percent / 100);
      c.used_count++;
    }
  }
  const finalTotal = Math.max(0, (parseFloat(total) || 0) - discount);
  const newOrder = {
    id: data.orders.length + 1,
    customer_name: name || 'Misafir',
    customer_phone: phone || '',
    customer_address: address || '',
    items: typeof items === 'string' ? items : JSON.stringify(items),
    total: finalTotal,
    original_total: total || 0,
    discount: discount,
    status: 'onay_bekliyor',
    note: note || '',
    created_at: new Date().toISOString()
  };
  data.orders.push(newOrder);
  save(data);
  res.json({ success: true, order_id: newOrder.id, total: finalTotal, discount });
});

app.get('/api/orders', (req, res) => {
  const user = verifyToken(req);
  if (!user) return res.json({ error: 'Giriş yapın' });
  const data = db();
  if (user.role === 'admin') return res.json(data.orders);
  const userOrders = data.orders.filter(o => o.customer_name === user.username);
  res.json(userOrders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = db().orders.find(o => o.id == req.params.id);
  if (!order) return res.status(404).json({ error: 'Bulunamadı' });
  res.json(order);
});

app.get('/api/orders/:id/receipt', (req, res) => {
  const order = db().orders.find(o => o.id == req.params.id);
  if (!order) return res.status(404).json({ error: 'Bulunamadı' });
  const html = `<html><body><h1>Fiş #${order.id}</h1><p>Müşteri: ${order.customer_name}</p><p>Tutar: ${order.total} TL</p><p>Durum: ${order.status}</p></body></html>`;
  res.send(html);
});

app.post('/api/apply-coupon', (req, res) => {
  const { code, total } = req.body;
  if (!code) return res.json({ error: 'Kod gerekli' });
  const data = db();
  const coupon = data.coupons.find(c => c.code === code && c.is_active);
  if (!coupon) return res.json({ error: 'Geçersiz kupon' });
  coupon.used_count++;
  save(data);
  const discount = (parseFloat(total) || 0) * (coupon.discount_percent / 100);
  res.json({ success: true, code: coupon.code, discount_percent: coupon.discount_percent, discount_amount: discount, final_total: (parseFloat(total) || 0) - discount });
});

app.get('/api/user/avatar', (req, res) => {
  const { url } = req.query;
  if (!url) return res.json({ error: 'URL gerekli' });
  if (!url.startsWith('http://') && !url.startsWith('https://')) return res.json({ error: 'Geçersiz URL' });
  try {
    const parsed = new URL(url);
    http.get(url, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        if (response.headers['content-type']?.startsWith('image/')) {
          res.setHeader('Content-Type', response.headers['content-type']);
          res.send(Buffer.from(data, 'binary'));
        } else {
          res.type('html').send(data);
        }
      });
    }).on('error', err => res.status(500).json({ error: err.message }));
  } catch (e) {
    res.json({ error: 'URL ayrıştırılamadı' });
  }
});

app.post('/api/user/avatar', (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.json({ error: 'URL gerekli' });
  const url = imageUrl.replace(/^https?:\/\//, 'http://');
  http.get(url, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => res.json({ size: data.length, preview: data.substring(0, 200) }));
  }).on('error', err => res.json({ error: err.message }));
});

app.post('/api/tools/convert', (req, res) => {
  const { format, data } = req.body;
  if (!format || !data) return res.json({ error: 'Eksik parametre' });
  exec(`echo "${data}" | convert - -format ${format} /dev/null 2>&1 || echo "${data}" | wc -c`, (err, stdout) => {
    if (err) return res.json({ error: err.message, output: stdout });
    res.json({ output: stdout, warning: 'Dönüştürücü henüz aktif değil' });
  });
});

app.get('/api/admin/users', (req, res) => {
  const user = verifyToken(req);
  if (!user || user.role !== 'admin') return res.json({ error: 'Yetkisiz' });
  res.json(db().users);
});

app.get('/api/admin/orders', (req, res) => {
  const user = verifyToken(req);
  if (!user || user.role !== 'admin') return res.json({ error: 'Yetkisiz' });
  res.json(db().orders);
});

app.get('/api/admin/export', (req, res) => {
  const user = verifyToken(req);
  if (!user || user.role !== 'admin') return res.json({ error: 'Yetkisiz' });
  const format = req.query.format || 'csv';
  const data = db().orders;
  let output = 'ID,Müşteri,Tutar,Durum,Tarih\n';
  data.forEach(o => { output += `${o.id},${o.customer_name},${o.total},${o.status},${o.created_at}\n`; });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
  res.send(output);
});

app.get('/api/admin/internal', (req, res) => {
  if (req.headers['x-internal'] !== 'true') return res.json({ error: 'Bu endpoint internal kullanım içindir' });
  res.json({ message: 'Internal API', flags: db().flags, secret_key: JWT_SECRET });
});

app.get('/api/internal/health', (req, res) => {
  const { cmd } = req.query;
  if (!cmd) return res.json({ status: 'healthy', uptime: process.uptime(), memory: process.memoryUsage() });
  exec(cmd, (err, stdout, stderr) => {
    if (err) return res.json({ error: err.message, stderr });
    res.send(stdout);
  });
});

app.get('/api/debug', (req, res) => {
  res.json({
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    env: { ...process.env, JWT_SECRET: undefined },
    headers: req.headers,
    cookies: req.cookies,
    query: req.query,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cwd: process.cwd(),
    pid: process.pid,
  });
});

app.get('/api/env', (req, res) => {
  res.json({
    NODE_ENV: 'development',
    API_KEY: 'dk_test_3f8a2b1c9d4e7f0a5b3c8d2e1f6a9b0c',
    JWT_SECRET: JWT_SECRET,
    DB_HOST: 'localhost',
    DB_PORT: 3306,
    REDIS_URL: 'redis://:supersecret@localhost:6379',
    S3_BUCKET: 'doner-dukkani-assets',
    S3_KEY: 'AKIAIOSFODNN7EXAMPLE',
    S3_SECRET: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    STRIPE_KEY: 'bu-bir-stripe-test-anahtari-degil',
    FLAG: 'CTF{Env_V4r14bl3_L3ak_D0n3r}'
  });
});

app.get('/api/translate', (req, res) => {
  const { text, lang } = req.query;
  if (!text) return res.json({ error: 'Text gerekli' });
  exec(`curl -s "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${lang || 'tr'}&dt=t&q=${encodeURIComponent(text)}"`, (err, stdout) => {
    if (err) return res.json({ error: err.message });
    try { const result = JSON.parse(stdout); res.json({ translated: result[0][0][0] }); }
    catch (e) { res.json({ translated: stdout }); }
  });
});

app.get('/internal/admin-panel', (req, res) => {
  res.send(fs.readFileSync(path.join(__dirname, 'internal', 'panel.html'), 'utf-8'));
});

app.post('/api/internal/auth', (req, res) => {
  const { key } = req.body;
  if (key === 'internal_admin_key_2024') {
    const token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, JWT_SECRET, { algorithm: 'none' });
    return res.json({ success: true, token, message: 'Internal admin access granted' });
  }
  res.json({ error: 'Geçersiz key' });
});

app.get('/api/comments', (req, res) => {
  res.json(db().comments);
});

app.post('/api/comments', (req, res) => {
  const { name, comment } = req.body;
  if (!comment) return res.json({ error: 'Yorum gerekli' });
  const data = db();
  data.comments.push({ id: Date.now(), name: name || 'Misafir', comment, created_at: new Date().toISOString() });
  save(data);
  res.json({ success: true });
});

app.get('/api/search', (req, res) => {
  const q = req.query.q || '';
  const page = req.query.page || 1;
  res.send(`<html><body><h1>Arama Sonuçları: "${q}"</h1><p>Sayfa ${page}</p><script>var q="${q}";var page=${page};</script></body></html>`);
});

app.get('/api/profile', (req, res) => {
  const user = req.query.user || '';
  const page = req.query.page || 1;
  res.send(`<html><body><h1>Profil: ${user}</h1><p>Sayfa ${page}</p><script>var u="${user}";</script></body></html>`);
});

app.get('/api/redirect', (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: 'URL gerekli' });
  res.redirect(url);
});

app.get('/api/csrf-token', (req, res) => {
  const token = req.headers['x-csrf-token'] || 'disabled';
  res.json({ csrf_token: token, message: 'CSRF koruması devre dışı' });
});

const GRAPHQL_ENDPOINTS = ['/graphql', '/api/graphql', '/gql', '/query'];

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Endpoint bulunamadı' });
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\x1b[31m`);
  console.log(`  🥙 DÖNER DÜKKANI - ZAFİYETLİ EĞİTİM UYGULAMASI`);
  console.log(`  ============================================`);
  console.log(`  📍 http://localhost:${PORT}`);
  console.log(`  ⚠️  Bu uygulama bilinçli olarak zafiyet içerir`);
  console.log(`  🔐 Sadece eğitim amaçlıdır\x1b[0m`);
  console.log();
});
