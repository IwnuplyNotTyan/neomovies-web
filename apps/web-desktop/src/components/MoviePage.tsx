import { useEffect, useRef, useState } from 'react'
import { View, Text, Image, ScrollView, ActivityIndicator, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import type { ApiMovie } from '@neomovies/api-client'
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

function MoviePageSkeleton() {
  return (
    <ScrollView className="flex-1">
      <View className="flex-row p-8">
        <View className="w-72 aspect-2/3 rounded-2xl bg-white/5 mr-8" />
        <View className="flex-1 pt-4">
          <View className="h-4 w-32 rounded bg-white/5 mb-4" />
          <View className="h-12 w-3/4 rounded bg-white/5 mb-4" />
          <View className="h-8 w-1/2 rounded bg-white/5 mb-4" />
          <View className="h-6 w-48 rounded bg-white/5 mb-4" />
          <View className="h-6 w-64 rounded bg-white/5 mb-4" />
          <View className="h-10 w-80 rounded bg-white/5 mb-4" />
          <View className="h-32 w-full rounded bg-white/5" />
        </View>
      </View>
    </ScrollView>
  )
}

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
    return <MoviePageSkeleton />
  }

  if (error || !movie) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-red-400 text-lg">
          {error || 'Фильм не найден'}
        </Text>
        <Pressable className="mt-6 rounded-full bg-white/8 border border-white/10 px-5 py-3" onPress={() => router.back()}>
          <Text className="text-zinc-100 font-medium">{'← Назад'}</Text>
        </Pressable>
      </View>
    )
  }

  const backdropUrl = movie.backdropUrl || getBackdropUrl(movie.id)
  const yearText = movie.year ? String(movie.year) : ''
  const metaParts = [yearText, movie.country].filter(Boolean)
  const metaLine = metaParts.length > 0 ? metaParts.join(' • ') : ''

  return (
    <View className="flex-1">
      {backdropUrl ? (
        <Image
          source={{ uri: backdropUrl }}
          blurRadius={40}
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.3 }}
        />
      ) : null}

      <ScrollView className="flex-1">
        <View>
          <Pressable className="m-4 rounded-full bg-white/8 border border-white/10 px-5 py-2 self-start" onPress={() => router.back()}>
            <Text className="text-zinc-100 font-medium">{'← Назад'}</Text>
          </Pressable>

          <View className="flex-row px-8 pb-8">
            <View className="w-72 rounded-3xl border border-white/10 bg-zinc-900 overflow-hidden mr-8">
              <Image
                source={{ uri: getPosterUrl(movie.posterUrl) }}
                className="w-72 aspect-2/3"
                resizeMode="cover"
              />
            </View>

            <View className="flex-1 pt-4">
              {metaLine ? (
                <Text className="text-zinc-400 text-sm mb-4">{metaLine}</Text>
              ) : null}

              <Text className="text-5xl font-black tracking-tighter text-white mb-4">
                {movie.title}
              </Text>

              {movie.originalTitle && movie.originalTitle !== movie.title ? (
                <Text className="text-zinc-500 text-base mb-4">
                  {movie.originalTitle}
                </Text>
              ) : null}

              <View className="flex-row flex-wrap mb-6">
                {movie.rating ? (
                  <View className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 mr-2 mb-2">
                    <Text className="text-amber-200 text-xs font-medium">
                      {movie.rating.toFixed(1)}
                    </Text>
                  </View>
                ) : null}
                <View className="rounded-full border border-white/10 bg-white/5 px-3 py-1 mr-2 mb-2">
                  <Text className="text-zinc-200 text-xs font-medium">
                    {movie.type === 'tv' ? 'Сериал' : 'Фильм'}
                  </Text>
                </View>
                {movie.duration ? (
                  <View className="rounded-full border border-white/10 bg-white/5 px-3 py-1 mr-2 mb-2">
                    <Text className="text-zinc-200 text-xs font-medium">
                      {String(Math.round(movie.duration / 60)) + ' мин'}
                    </Text>
                  </View>
                ) : null}
                {movie.genres ? movie.genres.map((g) => (
                  <View key={String(g.id)} className="rounded-full border border-white/7 bg-white/3 px-3 py-1 mr-2 mb-2">
                    <Text className="text-zinc-500 text-xs font-medium">
                      {g.name}
                    </Text>
                  </View>
                )) : null}
              </View>

              <View className="flex-row flex-wrap mb-6">
                {players.map((player) => (
                  <Pressable
                    key={player}
                    className="rounded-2xl border border-white/10 bg-white/8 px-6 py-4 mr-3 mb-3"
                    onPress={() => handleOpenPlayer(player)}
                  >
                    <Text className="text-white text-base font-bold">
                      {PLAYER_LABELS[player]}
                    </Text>
                    <Text className="text-zinc-500 text-xs mt-1">
                      {'Открыть источник'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text className="text-zinc-500 text-xs font-bold tracking-widest uppercase mb-2">
                {'О фильме'}
              </Text>
              <Text className="text-zinc-400 text-base leading-relaxed max-w-2xl">
                {movie.description || 'Описание недоступно.'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {playerLoading ? (
        <View className="absolute inset-0 z-40 bg-black/60 items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white mt-3">{'Загружаем плеер...'}</Text>
        </View>
      ) : null}

      {playerResult ? (
        <PlayerModal
          url={playerResult.playerUrl}
          html={playerResult.playerHtml}
          open={playerModalOpen}
          onClose={() => setPlayerModalOpen(false)}
        />
      ) : null}
    </View>
  )
}
