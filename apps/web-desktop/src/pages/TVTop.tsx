import { useCallback } from 'react'
import { tvAPI } from '../api'
import { CatalogPage } from '../features/catalog/catalog-page'

export const TVTop = () => {
  const fetchPage = useCallback((page: number) => tvAPI.getTopRated(page), [])

  return (
    <CatalogPage
      title="Топ сериалов"
      subtitle="Каталог лучших сериалов и шоу с упором на сериальный рейтинг, а не на общую смешанную выдачу."
      emptyText="Топ сериалов сейчас недоступен."
      cacheKey="neo_catalog_top_tv_v1"
      fetchPage={fetchPage}
    />
  )
}
