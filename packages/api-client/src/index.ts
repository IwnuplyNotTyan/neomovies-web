import axios from "axios";

export type ApiMovie = {
  id: string;
  title: string;
  originalTitle: string;
  posterUrl: string;
  backdropUrl?: string;
  rating: number;
  overview: string;
  description: string;
  type: string;
  year?: number;
  releaseDate?: string;
  duration?: number;
  country?: string;
  language?: string;
  genres?: Array<{ id: string | number; name: string }>;
  externalIds?: { kp?: string | number };
};

type ApiList = {
  success: boolean;
  data: {
    results: ApiMovie[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

function normalizeMovie(movie: unknown): ApiMovie {
  const data = movie && typeof movie === "object" ? movie as Record<string, unknown> : {};
  const genres = Array.isArray(data.genres)
    ? data.genres.reduce<Array<{ id: string; name: string }>>((acc, genre) => {
        if (!genre || typeof genre !== "object") return acc;
        const item = genre as Record<string, unknown>;
        const name = String(item.name ?? "");
        if (!name) return acc;
        acc.push({
          id: String(item.id ?? item.name ?? ""),
          name,
        });
        return acc;
      }, [])
    : undefined;

  const releaseDate = String(data.releaseDate ?? data.release_date ?? "");
  const parsedYear = releaseDate ? Number.parseInt(releaseDate.slice(0, 4), 10) : NaN;

  return {
    id: String(data.id ?? ""),
    title: String(data.title ?? ""),
    originalTitle: String(data.originalTitle ?? ""),
    posterUrl: String(data.posterUrl ?? ""),
    backdropUrl: String(data.backdropUrl ?? ""),
    rating: typeof data.rating === "number" ? data.rating : 0,
    overview: String(data.overview ?? data.description ?? ""),
    description: String(data.description ?? data.overview ?? ""),
    type: String(data.type ?? "movie"),
    year: typeof data.year === "number" ? data.year : Number.isFinite(parsedYear) ? parsedYear : undefined,
    releaseDate: releaseDate || undefined,
    duration: typeof data.duration === "number" ? data.duration : undefined,
    country: typeof data.country === "string" ? data.country : undefined,
    language: typeof data.language === "string" ? data.language : undefined,
    genres,
    externalIds:
      data.externalIds && typeof data.externalIds === "object"
        ? { kp: (data.externalIds as Record<string, unknown>).kp as string | number | undefined }
        : undefined,
  };
}

function normalizeList(response: unknown): ApiList {
  const root = response && typeof response === "object" ? response as Record<string, unknown> : {};
  const data = root.data && typeof root.data === "object" ? root.data as Record<string, unknown> : {};
  const rawResults = Array.isArray(data.results) ? data.results : [];

  return {
    ...root,
    success: typeof root.success === "boolean" ? root.success : true,
    data: {
      ...data,
      results: rawResults.map(normalizeMovie),
    },
  };
}

export function createApiClient(
  baseURL = (import.meta as any)?.env?.VITE_API_URL ?? "https://api.neomovies.ru",
) {
  const client = axios.create({ baseURL, timeout: 10000 });

  return {
    raw: client,
    async search(query: string, page = 1) {
      const { data } = await client.get("/api/v1/search", {
        params: { query, page },
      });
      return normalizeList(data);
    },
    async topMovies(page = 1) {
      const { data } = await client.get("/api/v1/movies/top-rated", {
        params: { page },
      });
      return normalizeList(data);
    },
    async topTv(page = 1) {
      const { data } = await client.get("/api/v1/tv/top-rated", {
        params: { page },
      });
      return normalizeList(data);
    },
    screenUrl(
      kpId: string | number,
      season?: number,
      episode?: number,
      size: "small" | "medium" | "large" | "xlarge" | "original" = "large",
    ) {
      if (season && episode) {
        return `${baseURL}/api/v1/images/screens/${kpId}/${season}/${episode}/${size}`;
      }
      return `${baseURL}/api/v1/images/screens/${kpId}`;
    },
    backdropUrl(kpId: string | number, size: 'small' | 'medium' | 'large' | 'xlarge' | 'original' = 'xlarge') {
      const id = String(kpId).replace(/^[a-z_]+/i, '')
      return `${baseURL}/api/v1/images/backdrops/${id}/${size}`;
    },
    backdropPageUrl(kpId: string | number, page = 1) {
      const id = String(kpId).replace(/^[a-z_]+/i, '')
      return `${baseURL}/api/v1/images/backdrops/page/${id}?page=${page}`;
    },
    logoUrl(kpId: string | number) {
      const id = String(kpId).replace(/^[a-z_]+/i, '')
      return `${baseURL}/api/v1/images/logos/${id}`;
    },
    async popular(page = 1) {
      const { data } = await client.get("/api/v1/movies/popular", {
        params: { page },
      });
      return normalizeList(data);
    },
    async getMovieById(id: string | number) {
      const { data } = await client.get(`/api/v1/movie/${id}`);
      return normalizeMovie(data.data ?? data);
    },
  };
}

export const api = createApiClient();
