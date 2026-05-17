import { apiClient } from "./client";

const normalizePaged = (raw: any, page: number) => ({
  page,
  results: raw?.results || [],
  total_pages: raw?.pages || raw?.total_pages || 1,
  total_results: raw?.total || raw?.total_results || 0,
});

export const moviesAPI = {
  async getPopular(page = 1) {
    const res = await apiClient.get("/api/v1/movies/popular", {
      params: { page },
      timeout: 30000,
    });
    return { ...res, data: normalizePaged(res.data, page) };
  },

  async getTopRated(page = 1) {
    const res = await apiClient.get("/api/v1/movies/top-rated", {
      params: { page },
      timeout: 30000,
    });
    return { ...res, data: normalizePaged(res.data, page) };
  },

  async getTopTv(page = 1) {
    const res = await apiClient.get("/api/v1/tv/top-rated", {
      params: { page },
      timeout: 30000,
    });
    return { ...res, data: normalizePaged(res.data, page) };
  },

  async searchMovies(query: string, page = 1) {
    const res = await apiClient.get("/api/v1/search", {
      params: { query, page },
      timeout: 30000,
    });
    return { ...res, data: normalizePaged(res.data, page) };
  },

  // Возвращает AxiosResponse — interceptor уже разворачивает { success, data } → data
  // Поэтому res.data — готовый объект фильма
  getMovieById(id: string | number) {
    return apiClient.get(`/api/v1/movie/${id}`, { timeout: 30000 });
  },
};
