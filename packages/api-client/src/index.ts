import axios from "axios";
import { z } from "zod";

const movieSchema = z.object({
  id: z.string(),
  title: z.string(),
  originalTitle: z.string().optional().default(""),
  posterUrl: z.string().optional().default(""),
  rating: z.number().optional().default(0),
  overview: z.string().optional().default(""),
  description: z.string().optional().default(""),
  type: z.string().optional().default("movie"),
});

const listSchema = z
  .object({
    success: z.boolean().optional().default(true),
    data: z
      .object({
        results: z.array(movieSchema),
      })
      .passthrough(),
  })
  .passthrough();

export type ApiMovie = z.infer<typeof movieSchema>;

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
      return listSchema.parse(data);
    },
    async topMovies(page = 1) {
      const { data } = await client.get("/api/v1/movies/top-rated", {
        params: { page },
      });
      return listSchema.parse(data);
    },
    async topTv(page = 1) {
      const { data } = await client.get("/api/v1/tv/top-rated", {
        params: { page },
      });
      return listSchema.parse(data);
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
      return listSchema.parse(data);
    },
  };
}

export const api = createApiClient();
