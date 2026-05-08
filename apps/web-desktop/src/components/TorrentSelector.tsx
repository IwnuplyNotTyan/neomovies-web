import { useMemo, useState } from 'react'
import { BsMagnetFill } from 'react-icons/bs'
import { playersAPI } from '../api'

interface TorrentSelectorProps {
  kpId?: string | number
  type: 'movie' | 'tv'
  title?: string
}

interface Torrent {
  title: string
  magnet: string
  size?: string
  seeds?: number
  peers?: number
  quality?: string
  season?: number
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M6 6 18 18M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M9 9.75A2.25 2.25 0 0 1 11.25 7.5h6A2.25 2.25 0 0 1 19.5 9.75v6A2.25 2.25 0 0 1 17.25 18h-6A2.25 2.25 0 0 1 9 15.75v-6Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 14.25v-7.5A2.25 2.25 0 0 1 8.25 4.5h7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function toQualityString(q: unknown): string {
  return String(q ?? '').trim()
}

function formatQualityLabel(q: unknown): string {
  const raw = toQualityString(q)
  if (!raw) return ''
  const lower = raw.toLowerCase()
  if (lower.endsWith('p') || lower.endsWith('k')) return raw
  if (/^\d+$/.test(raw)) return `${raw}p`
  return raw
}

function formatSizeGb(value: unknown): string {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim())
  if (!Number.isFinite(n) || n <= 0) return String(value ?? '')
  const gb = n / (1024 * 1024 * 1024)
  return `${gb.toFixed(gb >= 10 ? 1 : 2)} GB`
}

export const TorrentSelector = ({ kpId, type, title }: TorrentSelectorProps) => {
  const [open, setOpen] = useState(false)
  const [torrents, setTorrents] = useState<Torrent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [selectedQualities, setSelectedQualities] = useState<string[]>([])
  const [copiedMagnet, setCopiedMagnet] = useState<string | null>(null)

  const seasons = useMemo(() => {
    if (type !== 'tv') return []
    return [...new Set(torrents.map((torrent) => torrent.season).filter(Boolean) as number[])].sort((a, b) => a - b)
  }, [torrents, type])

  const availableQualities = useMemo(() => {
    return Array.from(new Set(torrents.map((t) => toQualityString(t.quality)).filter(Boolean))).sort((a: string, b: string) => {
      const norm = (q: unknown) => String(q ?? '').trim().toLowerCase().replace(/\s+/g, '')
      const qualityOrder: Record<string, number> = {
        '4k': 0,
        '2160': 0,
        '2160p': 0,
        '2k': 1,
        '1440': 1,
        '1440p': 1,
        '1080': 2,
        '1080p': 2,
        '720': 3,
        '720p': 3,
        '480': 4,
        '480p': 4,
        '360': 5,
        '360p': 5,
      }
      const aKey = norm(a)
      const bKey = norm(b)
      return (qualityOrder[aKey] ?? 999) - (qualityOrder[bKey] ?? 999)
    })
  }, [torrents])

  const filteredTorrents = useMemo(() => {
    return torrents.filter((torrent) => {
      const seasonMatch = !selectedSeason || torrent.season === selectedSeason
      const qualityMatch = selectedQualities.length === 0 || selectedQualities.includes(toQualityString(torrent.quality))
      return seasonMatch && qualityMatch
    })
  }, [selectedQualities, selectedSeason, torrents])

  const fetchTorrents = async () => {
    setLoading(true)
    setError(null)
    try {
      if (!kpId) {
        setError('KP ID не найден для этого контента.')
        setLoading(false)
        return
      }

      const numericKpId = String(kpId).replace(/^kp_/, '')
      const response = await playersAPI.getTorrents(numericKpId)
      const data: any[] = Array.isArray(response.data)
        ? response.data
        : response.data?.results || response.data?.data || []

      if (data.length === 0) {
        setError('Торренты не найдены.')
        setLoading(false)
        return
      }

      setTorrents(data)
      setSelectedQualities([])
      if (type === 'tv') {
        const uniqueSeasons = [...new Set(data.map((t: any) => t.season).filter(Boolean))] as number[]
        if (uniqueSeasons.length > 0) {
          setSelectedSeason(uniqueSeasons.sort((a, b) => a - b)[0])
        }
      }
    } catch (err: any) {
      setError(`Ошибка при загрузке торрентов: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setOpen(true)
    if (torrents.length === 0) {
      void fetchTorrents()
    }
  }

  const handleCopyMagnet = async (magnet: string) => {
    try {
      await navigator.clipboard.writeText(magnet)
      setCopiedMagnet(magnet)
      window.setTimeout(() => setCopiedMagnet(null), 1800)
    } catch {
      // noop
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="torrent-trigger inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-white/12 hover:bg-white/[0.05] hover:text-white"
      >
        <BsMagnetFill className="h-3.5 w-3.5" />
        Торренты
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,18,25,0.96),rgba(10,12,18,0.94))] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.36)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xl font-bold text-white">
                  Торренты{title ? ` — ${title}` : ''}
                </div>
                <div className="text-sm text-zinc-500">
                  Скопируй magnet-ссылку или открой её в торрент-клиенте.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:bg-white/[0.07] hover:text-white"
                aria-label="Закрыть"
              >
                <CloseIcon />
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-zinc-500">Загрузка торрентов...</div>
            ) : error ? (
              <div className="rounded-[18px] border border-[#5f2b2b] bg-[#2b1313] px-4 py-3 text-sm text-[#f3b0b0]">
                {error}
              </div>
            ) : (
              <div className="space-y-4">
                {availableQualities.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-zinc-300">Качество</div>
                    <div className="flex flex-wrap gap-2">
                      {availableQualities.map((quality) => (
                        <button
                          key={quality}
                          type="button"
                          onClick={() => {
                            setSelectedQualities((prev) =>
                              prev.includes(quality)
                                ? prev.filter((q) => q !== quality)
                                : [...prev, quality],
                            )
                          }}
                          className={`rounded-full px-3 py-1.5 text-sm transition ${
                            selectedQualities.includes(quality)
                              ? 'bg-white text-[#07090d]'
                              : 'border border-white/8 bg-white/[0.03] text-zinc-300 hover:border-white/12 hover:bg-white/[0.05] hover:text-white'
                          }`}
                        >
                          {formatQualityLabel(quality)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {type === 'tv' && seasons.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-zinc-300">Сезон</div>
                    <div className="flex flex-wrap gap-2">
                      {seasons.map((season) => (
                        <button
                          key={season}
                          type="button"
                          onClick={() => setSelectedSeason(season)}
                          className={`rounded-full px-3 py-1.5 text-sm transition ${
                            selectedSeason === season
                              ? 'bg-white text-[#07090d]'
                              : 'border border-white/8 bg-white/[0.03] text-zinc-300 hover:border-white/12 hover:bg-white/[0.05] hover:text-white'
                          }`}
                        >
                          Сезон {season}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {filteredTorrents.map((torrent, idx) => (
                    <div
                      key={`${torrent.magnet}-${idx}`}
                      className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4"
                    >
                      <div className="space-y-4">
                        <div className="min-w-0 space-y-2">
                          <div className="text-sm font-medium leading-6 text-zinc-100">
                            {torrent.title}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
                            {torrent.quality ? <span>Качество: {formatQualityLabel(torrent.quality)}</span> : null}
                            {torrent.size ? <span>Размер: {formatSizeGb(torrent.size)}</span> : null}
                            {torrent.seeds !== undefined ? <span>Сиды: {torrent.seeds}</span> : null}
                            {torrent.peers !== undefined ? <span>Пиры: {torrent.peers}</span> : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleCopyMagnet(torrent.magnet)}
                            className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300 transition hover:border-white/12 hover:bg-white/[0.05] hover:text-white"
                          >
                            <CopyIcon />
                            {copiedMagnet === torrent.magnet ? 'Скопировано' : 'Копировать'}
                          </button>
                          <a
                            href={torrent.magnet}
                            className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300 transition hover:border-white/12 hover:bg-white/[0.05] hover:text-white"
                          >
                            <BsMagnetFill className="h-3.5 w-3.5" />
                            Открыть
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
