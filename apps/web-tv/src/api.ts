import type { ApiMovie } from "@neomovies/api-client";
import type { CategoryId, CategoryPage } from "./types";
import { moviesAPI } from "./api/movies";
import { playersAPI } from "./api/players";
import { API_BASE_URL } from "./api/client";

export const apiBaseUrl = API_BASE_URL;

export const api = {
  backdropUrl(
    id: string | number,
    size: "small" | "medium" | "large" | "xlarge" | "original" = "xlarge",
  ) {
    const rawId = String(id).replace(/^[a-z_]+/i, "");
    return `${API_BASE_URL}/api/v1/images/backdrops/${rawId}/${size}`;
  },
  logoUrl(id: string | number) {
    const rawId = String(id).replace(/^[a-z_]+/i, "");
    return `${API_BASE_URL}/api/v1/images/logos/${rawId}`;
  },
};

function extractPlayerUrl(raw: string) {
  if (raw.startsWith("<")) {
    const src = raw.match(/src="([^"]+)"/i)?.[1];
    if (src) return { playerUrl: src, playerHtml: null };
    const dataSrc = raw.match(/data-src="([^"]+)"/i)?.[1];
    if (dataSrc) return { playerUrl: dataSrc, playerHtml: null };
    return { playerUrl: null, playerHtml: raw };
  }
  return raw.trim()
    ? { playerUrl: raw.trim(), playerHtml: null }
    : { playerUrl: null, playerHtml: null };
}

export async function fetchHomeRows() {
  const [popular, movies, tv] = await Promise.all([
    moviesAPI.getPopular(1),
    moviesAPI.getTopRated(1),
    moviesAPI.getTopTv(1),
  ]);
  return {
    popular: popular.data.results ?? [],
    movies: movies.data.results ?? [],
    tv: tv.data.results ?? [],
  };
}

export async function fetchMovieDetails(id: string): Promise<ApiMovie> {
  const movieId = id.startsWith("kp_") ? id : `kp_${id}`;
  // interceptor в client.ts уже разворачивает { success: true, data: Movie } → Movie
  // поэтому res.data — это сам объект фильма, не обёртка
  const res = await moviesAPI.getMovieById(movieId);
  return res.data as unknown as ApiMovie;
}

export async function fetchPlayerSource(
  movie: ApiMovie,
  player: "cdn" | "alloha" | "collaps" | "lumex",
) {
  const kpId = String(movie.externalIds?.kp ?? movie.id.replace(/^kp_/, ""));
  if (!kpId) return { playerUrl: null, playerHtml: null, cdnAvailable: false };

  if (player === "cdn") {
    try {
      const cdnUrl = playersAPI.getCdnPlayerUrl(kpId);
      const check = await fetch(cdnUrl, { method: "HEAD" });
      const ct = check.headers.get("content-type") || "";
      if (!check.ok || ct.includes("application/json")) {
        return { playerUrl: null, playerHtml: null, cdnAvailable: false };
      }
      return { playerUrl: cdnUrl, playerHtml: null, cdnAvailable: true };
    } catch {
      return { playerUrl: null, playerHtml: null, cdnAvailable: false };
    }
  }

  try {
    const res =
      player === "alloha"
        ? await playersAPI.getAllohaPlayer(kpId)
        : player === "collaps"
          ? await playersAPI.getCollapsPlayer(kpId)
          : await playersAPI.getLumexPlayer(kpId);

    const raw = typeof res.data === "string" ? res.data : "";
    return { ...extractPlayerUrl(raw), cdnAvailable: true };
  } catch {
    return { playerUrl: null, playerHtml: null, cdnAvailable: true };
  }
}

const categoryFetchers: Record<
  CategoryId,
  (
    page?: number,
  ) => Promise<{ data: { results: ApiMovie[]; total_pages: number } }>
> = {
  popular: (page) => moviesAPI.getPopular(page),
  movies: (page) => moviesAPI.getTopRated(page),
  tv: (page) => moviesAPI.getTopTv(page),
};

const pageCache = new Map<string, CategoryPage>();

export async function fetchCategoryPage(
  categoryId: CategoryId,
  page: number,
): Promise<CategoryPage> {
  const cacheKey = `${categoryId}:${page}`;
  const cached = pageCache.get(cacheKey);
  if (cached) return cached;

  const response = await categoryFetchers[categoryId](page);
  const data = response.data as any;
  const result: CategoryPage = {
    items: data.results ?? [],
    page,
    totalPages: Number(data.total_pages ?? data.pages ?? page) || page,
  };

  pageCache.set(cacheKey, result);
  return result;
}
