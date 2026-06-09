import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import type { ApiMovie } from '@neomovies/api-client'
import {
  HeroBanner,
  Section,
  Eyebrow,
  Text,
  Badge,
  Button,
  Spinner,
} from '@neo-open-source/ui-web'
import { PlayerModal } from './PlayerModal'
import {
  fetchMovieDetails,
  fetchPlayerSource,
  getBackdropUrl,
  getPosterUrl,
} from '../api'
import type { PlayerKey, PlayerResult } from '../api'

const PLAYER_LABELS: Record<PlayerKey, string> = {
  cdn: 'Плеер 1',
  alloha: 'Alloha',
  collaps: 'Collaps',
  lumex: 'Lumex',
}

const DEFAULT_PLAYERS: PlayerKey[] = ['alloha', 'collaps', 'lumex']

export function MoviePage({ id }: { id: string }) {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [movie, setMovie] = useState<ApiMovie | null>(null)

  const [players, setPlayers] = useState<PlayerKey[]>(DEFAULT_PLAYERS)
  const cdnCheckDoneRef = useRef(false)

  const [playerLoading, setPlayerLoading] = useState(false)
  const [playerModalOpen, setPlayerModalOpen] = useState(false)
  const [playerResult, setPlayerResult] = useState<PlayerResult | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchMovieDetails(id)
      .then((m) => {
        if (!cancelled) {
          setMovie(m)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Ошибка загрузки фильма',
          )
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!movie || cdnCheckDoneRef.current) return
    cdnCheckDoneRef.current = true

    fetchPlayerSource(movie, 'cdn').then((result) => {
      if (result.cdnAvailable) {
        setPlayers((prev) => ['cdn', ...prev])
      }
    })
  }, [movie])

  async function handleOpenPlayer(player: PlayerKey) {
    if (!movie) return
    setPlayerModalOpen(false)
    setPlayerLoading(true)
    try {
      const result = await fetchPlayerSource(movie, player)
      setPlayerResult(result)
      setPlayerModalOpen(true)
    } catch {
    } finally {
      setPlayerLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
        <Text className="text-red-400 text-lg">
          {error || 'Фильм не найден'}
        </Text>
        <Button variant="secondary" onClick={() => router.back()}>
          ← Назад
        </Button>
      </div>
    )
  }

  const backdropUrl = movie.backdropUrl || getBackdropUrl(movie.id)
  const posterUrl = getPosterUrl(movie.posterUrl)
  const yearText = movie.year ? String(movie.year) : ''
  const metaParts = [yearText, movie.country].filter(Boolean)
  const metaLine = metaParts.length > 0 ? metaParts.join(' • ') : ''

  const primaryPlayer = players[0]

  return (
    <div className="min-h-screen bg-black">
      <HeroBanner
        title={movie.title}
        tagline={
          movie.originalTitle && movie.originalTitle !== movie.title
            ? movie.originalTitle
            : undefined
        }
        meta={metaLine}
        rating={movie.rating}
        backdrop={backdropUrl}
        poster={posterUrl}
        primaryActionLabel="Смотреть"
        onPrimaryAction={() => handleOpenPlayer(primaryPlayer)}
        secondaryActionLabel="Ещё плееры"
      />

      <Section className="px-8 py-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {movie.rating ? (
            <Badge tone="warning">{movie.rating.toFixed(1)}</Badge>
          ) : null}
          <Badge>{movie.type === 'tv' ? 'Сериал' : 'Фильм'}</Badge>
          {movie.duration ? (
            <Badge>{Math.round(movie.duration / 60) + ' мин'}</Badge>
          ) : null}
          {movie.genres?.map((g) => (
            <Badge key={g.id}>{g.name}</Badge>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          {players.map((player) => (
            <Button
              key={player}
              variant="secondary"
              size="lg"
              onClick={() => handleOpenPlayer(player)}
            >
              {PLAYER_LABELS[player]}
            </Button>
          ))}
        </div>

        <Eyebrow>О фильме</Eyebrow>
        <Text className="text-zinc-400 max-w-2xl mt-2 leading-relaxed">
          {movie.description || 'Описание недоступно.'}
        </Text>
      </Section>

      {playerLoading && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center">
          <Spinner />
          <Text className="text-white mt-3 ml-2">Загружаем плеер...</Text>
        </div>
      )}

      {playerResult ? (
        <PlayerModal
          url={playerResult.playerUrl}
          html={playerResult.playerHtml}
          open={playerModalOpen}
          onClose={() => setPlayerModalOpen(false)}
        />
      ) : null}
    </div>
  )
}
