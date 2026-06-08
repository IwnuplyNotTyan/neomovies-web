import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiMovie } from '@neomovies/api-client'
import { fetchCategoryPage } from '../api'
import type { CategoryId } from '../types'

type CategoryPagination = {
  items: ApiMovie[]
  isInitialLoading: boolean
  isLoadingMore: boolean
  loadNextPage: () => void
}

type PaginationState = {
  categoryId: CategoryId
  items: ApiMovie[]
  loadedPage: number
  totalPages: number
  isInitialLoading: boolean
  isLoadingMore: boolean
}

function uniqueMovies(items: ApiMovie[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (!item.id || seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export function useCategoryPagination(categoryId: CategoryId): CategoryPagination {
  const loadingMoreRef = useRef(false)
  const [state, setState] = useState<PaginationState>({
    categoryId,
    items: [],
    loadedPage: 0,
    totalPages: 1,
    isInitialLoading: true,
    isLoadingMore: false,
  })

  const isCurrentCategory = state.categoryId === categoryId
  const items = isCurrentCategory ? state.items : []
  const loadedPage = isCurrentCategory ? state.loadedPage : 0
  const totalPages = isCurrentCategory ? state.totalPages : 1
  const isInitialLoading = !isCurrentCategory || state.isInitialLoading
  const isLoadingMore = isCurrentCategory && state.isLoadingMore

  useEffect(() => {
    let cancelled = false
    loadingMoreRef.current = false

    void fetchCategoryPage(categoryId, 1).then((page) => {
      if (cancelled) return

      setState({
        categoryId,
        items: uniqueMovies(page.items),
        loadedPage: page.page,
        totalPages: page.totalPages,
        isInitialLoading: false,
        isLoadingMore: false,
      })
    })

    return () => {
      cancelled = true
    }
  }, [categoryId])

  const loadNextPage = useCallback(() => {
    if (isInitialLoading || isLoadingMore || loadingMoreRef.current || loadedPage >= totalPages) return

    const nextPage = loadedPage + 1
    loadingMoreRef.current = true
    setState((current) => ({
      ...current,
      isLoadingMore: true,
    }))

    void fetchCategoryPage(categoryId, nextPage).then((page) => {
      setState((current) => {
        if (current.categoryId !== categoryId) return current

        return {
          categoryId,
          items: uniqueMovies([...current.items, ...page.items]),
          loadedPage: page.page,
          totalPages: page.totalPages,
          isInitialLoading: false,
          isLoadingMore: false,
        }
      })
    }).finally(() => {
      loadingMoreRef.current = false
    })
  }, [categoryId, isInitialLoading, isLoadingMore, loadedPage, totalPages])

  return {
    items,
    isInitialLoading,
    isLoadingMore,
    loadNextPage,
  }
}
