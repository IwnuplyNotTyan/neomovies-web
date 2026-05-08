import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { moviesAPI } from "../api";
import { SearchHistory } from "../features/home/search-history";
import { MoviePosterCard } from "../features/shared/movie-card";
import { filterValidMovies } from "../utils/filterMovies";
import type { Movie } from "../types";

const SEARCH_HISTORY_KEY = "neo_search_history_v1";

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

function getPageWindow(page: number, totalPages: number) {
  const total = Math.min(totalPages, 500);
  const start = Math.max(1, page - 2);
  const end = Math.min(total, start + 4);
  const normalizedStart = Math.max(1, end - 4);
  return Array.from(
    { length: end - normalizedStart + 1 },
    (_, index) => normalizedStart + index,
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (nextPage: number) => void;
}) {
  const maxPages = Math.min(totalPages, 500);
  const pageWindow = getPageWindow(page, maxPages);

  if (maxPages <= 1) return null;

  return (
    <div className="pagination-bar flex flex-wrap items-center justify-center gap-2">

      {pageWindow.map((value) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`h-10 min-w-10 rounded-full px-3 text-sm font-medium transition ${
            value === page
              ? "bg-white text-[#07090d]"
              : "border border-white/8 bg-white/[0.03] text-zinc-300 hover:border-white/12 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          {value}
        </button>
      ))}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= maxPages}
        className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:border-white/12 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:border-white/[0.04] disabled:bg-white/[0.02] disabled:text-zinc-700"
      >
        Дальше
      </button>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[28px] border border-white/8 bg-white/[0.03]"
        >
          <div className="aspect-[0.7] animate-pulse bg-white/[0.04]" />
          <div className="space-y-2 px-4 py-4">
            <div className="h-5 w-4/5 animate-pulse rounded-full bg-white/[0.04]" />
            <div className="h-4 w-2/5 animate-pulse rounded-full bg-white/[0.04]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const Search = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [history, setHistory] = useState<string[]>(() => readHistory());
  const navigate = useNavigate();
  const query = (
    searchParams.get("q") ||
    searchParams.get("query") ||
    ""
  ).trim();

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (!query) {
        setResults([]);
        setLoading(false);
        setTotalPages(1);
        return;
      }

      try {
        setLoading(true);
        const res = await moviesAPI.searchMovies(query, page);
        if (cancelled) return;
        setResults(filterValidMovies(res.data.results || []));
        setTotalPages(res.data.total_pages || 1);
      } catch (error) {
        if (!cancelled) {
          console.error("Error searching:", error);
          setResults([]);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [page, query]);

  return (
    <section className="space-y-8">
      <header className="space-y-4 rounded-[30px] border border-white/8 bg-white/[0.02] px-6 py-6">
        <span className="text-[12px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
          Поиск
        </span>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-[44px] font-black tracking-[-0.05em] text-white">
              {query ? `Результаты: ${query}` : "Поиск"}
            </h1>
            <p className="max-w-3xl text-[15px] leading-7 text-zinc-500">
              {query
                ? "Полная выдача по твоему запросу. Можно продолжить искать через верхний navbar search."
                : "Введи запрос в верхней строке поиска, чтобы найти фильмы и сериалы."}
            </p>
          </div>
          {query ? (
            <div className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-400">
              {loading ? "Ищем..." : `${results.length} результатов`}
            </div>
          ) : null}
        </div>
      </header>

      {!query ? (
        <div className="space-y-8">
          <div className="rounded-[28px] border border-white/8 bg-white/[0.03] px-6 py-16 text-center text-zinc-500">
            Начни вводить запрос в строке поиска сверху.
          </div>
          <SearchHistory
            items={history}
            onPick={(value) => navigate(`/search?q=${encodeURIComponent(value)}`)}
            onClear={() => {
              setHistory([]);
              localStorage.removeItem(SEARCH_HISTORY_KEY);
            }}
          />
        </div>
      ) : loading ? (
        <LoadingGrid />
      ) : results.length === 0 ? (
        <div className="space-y-8">
          <div className="rounded-[28px] border border-white/8 bg-white/[0.03] px-6 py-16 text-center text-zinc-500">
            По запросу <span className="text-zinc-300">«{query}»</span> ничего не
            найдено.
          </div>
          <SearchHistory
            items={history}
            onPick={(value) => navigate(`/search?q=${encodeURIComponent(value)}`)}
            onClear={() => {
              setHistory([]);
              localStorage.removeItem(SEARCH_HISTORY_KEY);
            }}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {results.map((item) => (
              <MoviePosterCard
                key={String(item.id)}
                movie={item}
                onOpen={(movie) => {
                  const id = movie.kinopoisk_id
                    ? `kp_${movie.kinopoisk_id}`
                    : movie.id;
                  navigate(`/${id}`);
                }}
              />
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          <SearchHistory
            items={history}
            onPick={(value) => navigate(`/search?q=${encodeURIComponent(value)}`)}
            onClear={() => {
              setHistory([]);
              localStorage.removeItem(SEARCH_HISTORY_KEY);
            }}
          />
        </>
      )}
    </section>
  );
};
