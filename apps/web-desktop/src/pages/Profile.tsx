import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogRoot,
  DialogTitle,
} from '@neomovies/ui'
import { apiClient } from '../api'
import { clearAuthState } from '../api/client'
import { favoritesAPI, type FavoriteItem } from '../api'

interface UserProfile {
  id: string
  name: string
  email: string
  avatar: string
  neo_id?: string
  is_admin?: boolean
  created_at?: string
}

function compactNeoId(value?: string) {
  if (!value) return '—'
  if (value.length <= 22) return value
  return `${value.slice(0, 10)}...${value.slice(-8)}`
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function ExitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

function StatCard({ label, value, meta }: { label: string; value: string; meta?: string }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">{label}</div>
      <div className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">{value}</div>
      {meta ? <div className="mt-2 text-sm text-zinc-500">{meta}</div> : null}
    </div>
  )
}

function ProfileRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-2 rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">{label}</div>
      <div className={`text-[15px] text-zinc-100 ${mono ? 'font-mono break-all text-[14px]' : ''}`}>{value || '—'}</div>
    </div>
  )
}

export const Profile = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [favoritesCount, setFavoritesCount] = useState(0)

  const isLoggedIn = useMemo(() => Boolean(localStorage.getItem('token')), [])

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/auth')
      return
    }

    let cancelled = false

    const loadProfile = async () => {
      setLoading(true)
      setError('')

      try {
        const [profileResp, favorites] = await Promise.all([
          apiClient.get('/api/v1/auth/profile'),
          favoritesAPI.getFavorites(true).catch(() => [] as FavoriteItem[]),
        ])

        if (cancelled) return

        const user = profileResp.data as UserProfile
        setProfile(user)
        setFavoritesCount(favorites.length)

        if (user.name) localStorage.setItem('userName', user.name)
        if (user.email) localStorage.setItem('userEmail', user.email)
        if (user.avatar) localStorage.setItem('userAvatar', user.avatar)
      } catch {
        if (cancelled) return

        setProfile({
          id: '',
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || '',
          avatar: localStorage.getItem('userAvatar') || '',
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void favoritesAPI.initialize().catch(() => undefined)
    void loadProfile()

    const unsubscribe = favoritesAPI.subscribe((items) => {
      if (!cancelled) setFavoritesCount(items.length)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [isLoggedIn, navigate])

  const initials = useMemo(() => {
    if (profile?.name) {
      return profile.name
        .split(' ')
        .map((chunk) => chunk[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    return profile?.email?.[0]?.toUpperCase() || '?'
  }, [profile])

  const handleLogout = () => {
    clearAuthState()
    navigate('/')
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setError('')

    try {
      await apiClient.delete('/api/v1/auth/delete-account')
      clearAuthState()
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Не удалось удалить аккаунт')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (!isLoggedIn) return null

  return (
    <section className="profile-shell space-y-8">
      <header className="space-y-4 rounded-[30px] border border-white/8 bg-white/[0.02] px-6 py-6">
        <span className="text-[12px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
          NeoMovies
        </span>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-[44px] font-black tracking-[-0.05em] text-white">Профиль</h1>
            <p className="max-w-3xl text-[15px] leading-7 text-zinc-500">
              Данные Neo ID, состояние аккаунта и быстрый доступ к управлению профилем.
            </p>
          </div>
          <div className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-400">
            {loading ? 'Загрузка...' : profile?.email || 'Neo ID'}
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-[24px] border border-[#5f2b2b] bg-[#2b1313] px-5 py-4 text-sm text-[#f3b0b0]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
        <div className="space-y-6">
          <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name || 'Профиль'}
                    referrerPolicy="no-referrer"
                    className="h-20 w-20 rounded-full border border-white/10 object-cover"
                  />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-2xl font-black text-white">
                    {initials}
                  </div>
                )}

                <div className="min-w-0 space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
                    <UserIcon />
                    Secure Neo ID
                  </div>
                  <div className="space-y-1">
                    <h2 className="truncate text-[34px] font-black tracking-[-0.05em] text-white">
                      {loading ? 'Загрузка профиля...' : profile?.name || profile?.email?.split('@')[0] || 'Пользователь'}
                    </h2>
                    <p className="text-sm text-zinc-500">
                      {loading ? 'Подтягиваем информацию аккаунта' : 'Аккаунт синхронизирует избранное и просмотр между устройствами.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="profile-action-btn inline-flex h-12 items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-5 text-sm font-medium text-zinc-200 transition hover:border-white/12 hover:bg-white/[0.05] hover:text-white"
                >
                  <ExitIcon />
                  Выйти
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-[#5f2b2b] bg-[#2b1313] px-5 text-sm font-medium text-[#f0b0b0] transition hover:border-[#784040] hover:bg-[#351717] hover:text-[#ffd0d0]"
                >
                  <TrashIcon />
                  Удалить аккаунт
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <StatCard label="Избранное" value={String(favoritesCount)} meta="Фильмы и сериалы в коллекции" />
            <StatCard label="Статус" value={profile?.is_admin ? 'Администратор' : 'Пользователь'} meta={profile?.is_admin ? 'Права администратора включены' : 'Обычный пользователь NeoMovies'} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ProfileRow label="Email" value={loading ? 'Загрузка...' : profile?.email || '—'} />
            <ProfileRow label="Имя" value={loading ? 'Загрузка...' : profile?.name || '—'} />
            <ProfileRow label="Neo ID" value={loading ? 'Загрузка...' : compactNeoId(profile?.neo_id)} mono />
            <ProfileRow label="Статус" value={profile?.is_admin ? 'Администратор' : 'Пользователь'} />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6">
            <div className="space-y-4">
              <div className="text-[12px] font-semibold uppercase tracking-[0.28em] text-zinc-500">Синхронизация</div>
              <h3 className="profile-heading text-xl font-bold text-white">Что хранится в профиле</h3>
              <p className="text-sm leading-7 text-zinc-500">
                Neo ID подтягивает имя, email и аватар. Избранное хранится на аккаунте, а продолжение просмотра пока локально на устройстве.
              </p>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-start gap-2"><span className="mt-0.5 text-zinc-600">✓</span> Избранное синхронизируется между устройствами</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-zinc-600">○</span> Продолжить просмотр — локальный кеш браузера</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-zinc-600">!</span> Для удаления данных используй кнопку ниже</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      <DialogRoot open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-[460px]">
          <div className="space-y-4">
            <DialogTitle className="text-2xl font-black tracking-[-0.04em] text-white">
              Удалить аккаунт?
            </DialogTitle>
            <DialogDescription className="text-sm leading-7 text-zinc-400">
              Это действие необратимо. Профиль NeoMovies и сохранённые серверные данные будут удалены.
            </DialogDescription>
            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <DialogClose asChild>
                <button
                  type="button"
                  disabled={deleting}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] px-5 text-sm font-medium text-zinc-300 transition hover:border-white/12 hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
                >
                  Отмена
                </button>
              </DialogClose>
              <button
                type="button"
                onClick={() => void handleDeleteAccount()}
                disabled={deleting}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#5f2b2b] bg-[#2b1313] px-5 text-sm font-medium text-[#ffd0d0] transition hover:border-[#784040] hover:bg-[#351717] disabled:opacity-50"
              >
                {deleting ? 'Удаляем...' : 'Удалить'}
              </button>
            </div>
          </div>
        </DialogContent>
      </DialogRoot>
    </section>
  )
}
