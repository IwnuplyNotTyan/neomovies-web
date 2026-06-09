import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import type { ApiMovie } from '@neomovies/api-client'
import {
  HeroBanner,
  Text,
  Badge,
  Button,
  Spinner,
} from '@neo-open-source/ui-web'
import {
  fetchMovieDetails,
  fetchPlayerSource,
  getBackdropUrl,
  getPosterUrl,
} from '../api'
import type { PlayerKey, PlayerResult } from '../api'

const PLAYER_LABELS: Record<PlayerKey, string> = {
  cdn: '',
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

  const [players] = useState<PlayerKey[]>(DEFAULT_PLAYERS)

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

  const autoOpened = useRef(false)

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

  useEffect(() => {
    if (movie && !autoOpened.current) {
      autoOpened.current = true
      handleOpenPlayer('alloha')
    }
  }, [movie])

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

  return (
    <div className="min-h-screen bg-black">
      <HeroBanner
        title={movie.title}
        meta={metaLine}
        rating={movie.rating}
        backdrop={backdropUrl}
        poster={posterUrl}
      />

      <div style={{ padding: '24px 32px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {movie.genres?.map((g) => (
            <div key={g.id} style={{ marginRight: 8, marginBottom: 8 }}>
              <Badge>{g.name}</Badge>
            </div>
          ))}
          <div style={{ marginRight: 8, marginBottom: 8 }}>
            <Badge>{movie.type === 'tv' ? 'Сериал' : 'Фильм'}</Badge>
          </div>

        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 16 }}>
          {players.map((player) => (
            <div key={player} style={{ marginRight: 8, marginBottom: 8 }}>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => handleOpenPlayer(player)}
              >
                {PLAYER_LABELS[player]}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#fff',
            margin: 0,
            marginBottom: 16,
          }}
        >
          О фильме
        </h2>
        <p
          style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: 17,
            lineHeight: 1.7,
            maxWidth: 700,
            margin: 0,
            marginBottom: 24,
          }}
        >
          {movie.description || 'Описание недоступно.'}
        </p>

        {playerLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 48,
            }}
          >
            <Spinner />
            <Text style={{ color: '#fff', marginLeft: 12 }}>
              Загружаем плеер...
            </Text>
          </div>
        )}

        {playerResult && playerModalOpen && (
          <div
            style={{
              width: '100%',
              maxWidth: 1024,
              aspectRatio: 16 / 9,
              borderRadius: 12,
              overflow: 'hidden',
              marginBottom: 0,
            }}
          >
            {playerResult.playerUrl && (
              <iframe
                src={playerResult.playerUrl}
                allowFullScreen
                allow="autoplay; fullscreen"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 0,
                }}
              />
            )}
            {playerResult.playerHtml && !playerResult.playerUrl && (
              <div
                dangerouslySetInnerHTML={{ __html: playerResult.playerHtml }}
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
