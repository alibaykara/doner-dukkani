const API = '/api'

const TOKEN_KEY = 'doner_token'
const USER_KEY = 'doner_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || getCookie('token')
}

export function setToken(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  document.cookie = 'token=; path=/; max-age=0'
}

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export function headers(extra = {}) {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

export async function get(path, params = {}) {
  const qs = new URLSearchParams(params).toString()
  const url = qs ? `${API}${path}?${qs}` : `${API}${path}`
  const res = await fetch(url, { headers: headers(), credentials: 'include' })
  return res.json()
}

export async function post(path, data = {}, extra = {}) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: headers(extra),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function graphql(query, variables = {}) {
  const res = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ query, variables }),
  })
  return res.json()
}

export async function login(username, password, xadmin) {
  const extra = xadmin ? { 'X-Admin': 'true', 'X-Debug': 'true' } : {}
  const data = await post('/auth/login', { username, password }, extra)
  if (data.success) {
    setToken(data.token, data.user)
  }
  return data
}

export async function register(username, password, role) {
  return post('/auth/register', { username, password, role })
}
