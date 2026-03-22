const TTL = 24 * 60 * 60 * 1000 // 24h

export function cacheSet(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }))
  } catch { /* quota dépassé */ }
}

export function cacheGet(key) {
  try {
    const item = JSON.parse(localStorage.getItem(key))
    if (!item) return null
    if (Date.now() - item.ts > TTL) return null
    return item.data
  } catch { return null }
}
