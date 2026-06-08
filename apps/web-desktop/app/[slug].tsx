import { useLocalSearchParams } from 'expo-router'
import { MoviePage } from '../src/components/MoviePage'

export default function SlugPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  if (!slug || !slug.startsWith('kp_')) return null
  return <MoviePage id={slug} />
}
