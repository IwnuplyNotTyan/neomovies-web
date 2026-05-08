import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient, setAuthTokens } from '../api/client'

const NEO_ID_URL = (import.meta.env.VITE_NEO_ID_URL || 'https://id.neomovies.ru').replace(/\/$/, '')

function SecurityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M12 3.75 18.25 6v5.56c0 4.03-2.64 7.74-6.25 8.94-3.61-1.2-6.25-4.9-6.25-8.94V6L12 3.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m9.75 11.75 1.45 1.45 3.05-3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M7 17 17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowBackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M15 18 9 12l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Spinner() {
  return <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
}

function storeTokens(token: string, refreshToken: string, user: any) {
  setAuthTokens(token, refreshToken)
  if (user?.email) localStorage.setItem('userEmail', user.email)
  if (user?.name) localStorage.setItem('userName', user.name)
  if (user?.avatar) localStorage.setItem('userAvatar', user.avatar)
  localStorage.setItem('acceptedTerms', 'true')
  window.dispatchEvent(new Event('auth-changed'))
}

const humanizeError = (err: any): string => {
  const serverMessage = err?.response?.data?.error || err?.response?.data?.message
  if (serverMessage) return String(serverMessage)

  if (err?.message === 'Network Error') {
    return 'API недоступен. Если тестируешь локально с другого устройства, проверь VITE_API_URL и доступность backend.'
  }

  return err?.message || 'Не удалось завершить вход через Neo ID'
}

async function exchangeNeoToken(neoToken: string, neoRefresh: string): Promise<void> {
  const resp = await apiClient.post('/api/v1/auth/neo-id/callback', {
    access_token: neoToken,
    refresh_token: neoRefresh || '',
  })
  const data = resp.data?.data || resp.data
  if (data.neoAccess) localStorage.setItem('neo_id_access_token', data.neoAccess)
  if (data.neoRefresh) localStorage.setItem('neo_id_refresh_token', data.neoRefresh)
  const accessToken = data.accessToken || data.token
  const refreshToken = data.refreshToken || data.refresh_token
  if (!accessToken || !refreshToken) throw new Error('Invalid token payload from API')
  storeTokens(accessToken, refreshToken, data.user)
}

export const NeoIDAuth = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'idle' | 'opening' | 'waiting' | 'error'>('idle')
  const [error, setError] = useState('')
  const popupRef = useRef<Window | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (localStorage.getItem('token')) navigate('/', { replace: true })
  }, [navigate])

  useEffect(() => {
    const onMessage = async (e: MessageEvent) => {
      if (e.data?.type !== 'neo_id_auth') return
      const { access_token, refresh_token } = e.data
      if (!access_token) {
        setError('Neo ID не вернул access token')
        setStatus('error')
        return
      }

      try {
        setStatus('idle')
        await exchangeNeoToken(access_token, refresh_token || '')
        navigate('/', { replace: true })
      } catch (err: any) {
        setError(humanizeError(err))
        setStatus('error')
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigate])

  useEffect(() => {
    const pending = localStorage.getItem('neo_id_pending_token')
    const pendingRefresh = localStorage.getItem('neo_id_pending_refresh')
    if (!pending) return

    localStorage.removeItem('neo_id_pending_token')
    localStorage.removeItem('neo_id_pending_refresh')
    exchangeNeoToken(pending, pendingRefresh || '')
      .then(() => navigate('/', { replace: true }))
      .catch((err: any) => {
        setError(humanizeError(err))
        setStatus('error')
      })
  }, [navigate])

  useEffect(() => {
    const hash = window.location.hash
    const search = window.location.search

    const fromHash = hash ? new URLSearchParams(hash.slice(1)) : null
    const fromQuery = search ? new URLSearchParams(search) : null

    const token =
      fromHash?.get('access_token') ||
      fromHash?.get('token') ||
      fromQuery?.get('access_token') ||
      fromQuery?.get('token')
    const refresh =
      fromHash?.get('refresh_token') ||
      fromQuery?.get('refresh_token') ||
      ''

    if (!token) return

    window.history.replaceState({}, '', window.location.pathname)
    exchangeNeoToken(token, refresh)
      .then(() => navigate('/', { replace: true }))
      .catch((err: any) => {
        setError(humanizeError(err))
        setStatus('error')
      })
  }, [navigate])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const openPopup = async () => {
    setStatus('opening')
    setError('')

    try {
      const state = Math.random().toString(36).slice(2)
      localStorage.setItem('neo_id_state', state)
      const callbackURL = `${window.location.origin}/auth/neo-id/callback`

      const resp = await apiClient.post('/api/v1/auth/neo-id/login', {
        redirect_url: callbackURL,
        state,
        mode: 'popup',
      })
      const data = resp.data?.data || resp.data
      const rawURL: string = data.login_url || ''
      if (!rawURL) throw new Error('No login_url returned')

      const loginURL = rawURL.startsWith('/') ? `${NEO_ID_URL}${rawURL}` : rawURL

      const w = 480
      const h = 680
      const left = window.screenX + (window.outerWidth - w) / 2
      const top = window.screenY + (window.outerHeight - h) / 2

      const popup = window.open(
        loginURL,
        'neo_id_auth',
        `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`,
      )

      if (!popup) {
        window.location.href = loginURL
        return
      }

      popupRef.current = popup
      setStatus('waiting')

      timerRef.current = setInterval(() => {
        if (!popup.closed) return
        clearInterval(timerRef.current!)
        setStatus((s) => (s === 'waiting' ? 'idle' : s))
      }, 500)
    } catch (err: any) {
      setError(humanizeError(err))
      setStatus('error')
    }
  }

  return (
    <div className="auth-page grid min-h-[calc(100vh-96px)] place-items-center px-4 py-8">
      <div className="auth-card w-full max-w-[460px] rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,16,24,0.94),rgba(8,12,19,0.9))] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.34)] backdrop-blur-md">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:bg-white/[0.07] hover:text-white"
              aria-label="Назад"
            >
              <ArrowBackIcon />
            </button>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
              <SecurityIcon />
              Secure Neo ID
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-[42px] font-black leading-[0.96] tracking-[-0.055em] text-white">
              Вход в NeoMovies
            </h1>
            <p className="max-w-[360px] text-[15px] leading-7 text-zinc-400">
              Используй аккаунт Neo ID, чтобы синхронизировать избранное, продолжить просмотр и получить доступ к профилю.
            </p>
          </div>

          {error ? (
            <div className="rounded-[18px] border border-[#5f2b2b] bg-[#2b1313] px-4 py-3 text-sm text-[#f3b0b0]">
              {error}
            </div>
          ) : null}

          {status === 'waiting' ? (
            <div className="space-y-4 rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3 text-white">
                <Spinner />
                <span className="text-sm font-medium">Заверши вход во всплывающем окне Neo ID</span>
              </div>
              <button
                type="button"
                onClick={() => popupRef.current?.focus()}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                Вернуть фокус на popup
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={openPopup}
              disabled={status === 'opening'}
              className="inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#f3f4f6] px-5 text-[15px] font-semibold text-[#111827] transition hover:bg-white disabled:cursor-wait disabled:opacity-80"
            >
              {status === 'opening' ? <Spinner /> : <ArrowOutIcon />}
              {status === 'opening' ? 'Открываем Neo ID' : 'Продолжить с Neo ID'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
