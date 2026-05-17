import { useCallback, useState } from 'react'
import type { ApiMovie } from '@neomovies/api-client'
import { fetchPlayerSource } from '../api'
import type { PlayerKey, PlayerState } from '../types'

const INITIAL_PLAYER_STATE: PlayerState = {
  selectedPlayer: 'cdn',
  playerUrl: null,
  playerHtml: null,
  cdnAvailable: true,
}

export function usePlayerSource() {
  const [state, setState] = useState<PlayerState>(INITIAL_PLAYER_STATE)
  const [isLoading, setIsLoading] = useState(false)

  const loadPlayer = useCallback(async (movie: ApiMovie, player: PlayerKey) => {
    setIsLoading(true)

    try {
      const nextState = await fetchPlayerSource(movie, player)

      if (player === 'cdn' && !nextState.cdnAvailable) {
        const fallbackState = await fetchPlayerSource(movie, 'alloha')
        setState({
          selectedPlayer: 'alloha',
          playerUrl: fallbackState.playerUrl,
          playerHtml: fallbackState.playerHtml,
          cdnAvailable: false,
        })
        return
      }

      setState({
        selectedPlayer: player,
        playerUrl: nextState.playerUrl,
        playerHtml: nextState.playerHtml,
        cdnAvailable: nextState.cdnAvailable,
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    ...state,
    isLoading,
    loadPlayer,
  }
}
