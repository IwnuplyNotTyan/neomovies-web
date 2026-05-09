import { useMemo, useState } from 'react'
import { api } from '@neomovies/api-client'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@neomovies/ui'
import '@neomovies/ui/styles.css'

export default function App() {
  const [query, setQuery] = useState('Breaking Bad')
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState<number | null>(null)

  const title = useMemo(() => (loading ? 'Searching...' : 'NeoMovies Mobile'), [loading])

  const onSearch = async () => {
    setLoading(true)
    try {
      const result = await api.search(query, 1)
      setCount(result.data.results.length)
    } catch {
      setCount(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button onClick={onSearch} disabled={loading}>Search</Button>
          {count !== null && <p className="text-sm text-zinc-600">Results: {count}</p>}
        </CardContent>
      </Card>
    </main>
  )
}
