import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient, favoritesAPI, type FavoriteItem } from '../api'
import { clearAuthState } from '../api/client'

type UserProfile = {
  name: string
  email: string
  avatar: string
  neo_id?: string
  is_admin?: boolean
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CONTINUE_KEY = 'neo_continue_watching_v1'

function readContinueCount() {
  try {
    const items = JSON.parse(localStorage.getItem(CONTINUE_KEY) || '[]') as Array<{ id: string }>
    return items.length
  } catch {
    return 0
  }
}

function compactNeoId(value?: string) {
  if (!value) return '—'
  if (value.length <= 22) return value
  return `${value.slice(0, 10)}...${value.slice(-8)}`
}

export function ProfileModal({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [continueCount, setContinueCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const isLoggedIn = useMemo(() => Boolean(localStorage.getItem('token')), [])

  useEffect(() => {
    if (!open || !isLoggedIn) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const [profileResp, favorites] = await Promise.all([
          apiClient.get('/api/v1/auth/profile'),
          favoritesAPI.getFavorites(true).catch(() => [] as FavoriteItem[]),
        ])

        if (cancelled) return
        const user = profileResp.data as UserProfile
        setProfile(user)
        setFavoritesCount(favorites.length)
        setContinueCount(readContinueCount())

        if (user.name) localStorage.setItem('userName', user.name)
        if (user.email) localStorage.setItem('userEmail', user.email)
        if (user.avatar) localStorage.setItem('userAvatar', user.avatar)
        window.dispatchEvent(new Event('auth-changed'))
      } catch {
        if (cancelled) return
        setProfile({
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || '',
          avatar: localStorage.getItem('userAvatar') || '',
        })
        setContinueCount(readContinueCount())
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void favoritesAPI.initialize().catch(() => undefined)
    void load()

    const unsubscribe = favoritesAPI.subscribe((items) => {
      if (!cancelled) setFavoritesCount(items.length)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [open, isLoggedIn])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  const displayName = profile?.name || profile?.email?.split('@')[0] || 'Пользователь'

  const handleLogout = () => {
    clearAuthState()
    onOpenChange(false)
    navigate('/')
  }

  const handleDelete = async () => {
    try {
      await apiClient.delete('/api/v1/auth/delete-account')
      clearAuthState()
      onOpenChange(false)
      navigate('/')
    } catch {}
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        aria-label="Закрыть профиль"
        className="absolute inset-0 bg-black/55"
        onClick={() => onOpenChange(false)}
      />
      <div className="profile-modal absolute left-1/2 top-1/2 w-[min(700px,94vw)] -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,20,28,0.98),rgba(11,13,19,0.99))] p-6 text-zinc-100 shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[28px] font-black tracking-[-0.04em]">Профиль</h2>
            <p className="mt-1 text-sm text-zinc-400">Neo ID и статус синхронизации</p>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} className="profile-modal-close inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-zinc-300 transition hover:bg-white/10" aria-label="Закрыть">✕</button>
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          {profile?.avatar ? <img src={profile.avatar} alt={displayName} className="h-14 w-14 rounded-full object-cover" referrerPolicy="no-referrer" /> : <div className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-lg font-bold">{displayName[0]?.toUpperCase()}</div>}
          <div className="min-w-0 flex-1">
            <div className="truncate text-xl font-bold">{loading ? 'Загрузка...' : displayName}</div>
            <div className="truncate text-sm text-zinc-400">{profile?.email || '—'}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"><div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Избранное</div><div className="mt-2 text-2xl font-bold">{favoritesCount}</div></div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"><div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Продолжить просмотр</div><div className="mt-2 text-2xl font-bold">{continueCount}</div></div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"><div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Neo ID</div><div className="mt-2 font-mono text-sm">{compactNeoId(profile?.neo_id)}</div></div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"><div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Статус</div><div className="mt-2 font-semibold">{profile?.is_admin ? 'Администратор' : 'Пользователь'}</div></div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleLogout} className="profile-modal-action inline-flex h-11 items-center rounded-full border border-white/15 bg-white/[0.06] px-5 text-sm font-medium transition">Выйти</button>
          <button onClick={handleDelete} className="inline-flex h-11 items-center rounded-full border border-[#7d2a2a] bg-[#3f1515] px-5 text-sm font-medium text-[#ffc8c8]">Удалить аккаунт</button>
        </div>
      </div>
    </div>
  )
}
