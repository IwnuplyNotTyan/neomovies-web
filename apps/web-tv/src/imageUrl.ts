const env = import.meta.env
const rawApiBase = env.VITE_API_URL || env.VITE_API_BASE_URL
const API_BASE_URL = rawApiBase && rawApiBase.trim().length > 0
  ? rawApiBase.trim().replace(/\/$/, '')
  : 'https://api.neomovies.ru'

export function getBackdropPageImageUrl(kpId: string | number, size: 'small' | 'medium' | 'large' = 'small') {
  const id = String(kpId).replace(/^[a-z_]+/i, '')
  return `${API_BASE_URL}/api/v1/images/backdrops/page/${id}/${size}`
}

export function getPosterImageUrl(path: string | null | undefined) {
  if (!path) return ''

  const kpPattern = /kinopoiskapiunofficial\.tech\/images\/posters\/(kp|kp_small|kp_big)\/(\d+)\.jpg/i
  const kpMatch = path.match(kpPattern)
  if (kpMatch) {
    const kind = kpMatch[1].toLowerCase()
    const id = kpMatch[2]
    return `${API_BASE_URL}/api/v1/images/${kind}/${id}`
  }

  if (path.includes('/api/v1/images/')) {
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return `${API_BASE_URL}${path}`
  }

  if (path.startsWith('/images/')) {
    const parts = path.split('/').filter(Boolean)
    const kind = parts[1] || ''
    const rawId = parts.slice(2).join('/')
    const id = rawId.replace(/\.jpg$/i, '')
    if (kind && id) {
      return `${API_BASE_URL}/api/v1/images/${kind}/${id}`
    }
  }

  return path.startsWith('http://') || path.startsWith('https://') ? path : ''
}
