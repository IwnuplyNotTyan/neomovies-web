import { apiClient, API_BASE_URL } from "./client";

export const playersAPI = {
  getAllohaPlayer(id: string | number) {
    return apiClient.get(`/api/v1/players/alloha/kp/${id}`, { timeout: 30000 });
  },

  getLumexPlayer(id: string | number) {
    return apiClient.get(`/api/v1/players/lumex/kp/${id}`, { timeout: 30000 });
  },

  getCollapsPlayer(id: string | number) {
    return apiClient.get(`/api/v1/players/collaps/kp/${id}`, {
      timeout: 30000,
    });
  },

  getCdnPlayerUrl(id: string | number) {
    return `${API_BASE_URL}/api/v1/players/cdn/kp/${id}`;
  },
};
