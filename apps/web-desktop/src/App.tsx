import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'

const Movies = lazy(() => import('./pages/Movies').then((m) => ({ default: m.Movies })))
const MoviesTop = lazy(() => import('./pages/MoviesTop').then((m) => ({ default: m.MoviesTop })))
const TVTop = lazy(() => import('./pages/TVTop').then((m) => ({ default: m.TVTop })))
const Favorites = lazy(() => import('./pages/Favorites').then((m) => ({ default: m.Favorites })))
const Search = lazy(() => import('./pages/Search').then((m) => ({ default: m.Search })))
const MovieDetails = lazy(() => import('./pages/MovieDetails').then((m) => ({ default: m.MovieDetails })))
const NeoIDAuth = lazy(() => import('./pages/NeoIDAuth').then((m) => ({ default: m.NeoIDAuth })))
const NeoIDCallback = lazy(() => import('./pages/NeoIDCallback').then((m) => ({ default: m.NeoIDCallback })))
const Terms = lazy(() => import('./pages/Terms').then((m) => ({ default: m.Terms })))

function RouteFallback() {
  return <div className="py-16 text-center text-sm text-zinc-500">Загрузка...</div>
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

function SearchRoute({ Search }: { Search: React.ComponentType }) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const queryKey = params.get('q') || params.get('query') || ''

  return <Search key={queryKey} />
}

function LayoutRoute() {
  return (
    <Layout>
      <ScrollToTop />
      <Outlet />
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<LayoutRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/movies-top" element={<MoviesTop />} />
            <Route path="/tv-top" element={<TVTop />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/search" element={<SearchRoute Search={Search} />} />
            <Route path="/:id" element={<MovieDetails />} />
          </Route>
          <Route path="/auth" element={<NeoIDAuth />} />
          <Route path="/auth/callback" element={<NeoIDCallback />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
