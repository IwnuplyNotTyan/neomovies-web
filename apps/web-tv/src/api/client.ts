import axios from "axios";

const resolveApiBaseUrl = (): string => {
  const raw = (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    ""
  ).trim();
  if (!raw) return "https://api.neomovies.ru";

  try {
    const parsed = new URL(raw);
    const isLocalHost =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1";

    if (
      typeof window !== "undefined" &&
      isLocalHost &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      const mobileUrl = new URL(parsed.toString());
      mobileUrl.hostname = window.location.hostname;
      mobileUrl.protocol = window.location.protocol;
      return mobileUrl.toString().replace(/\/$/, "");
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return raw.replace(/\/$/, "");
  }
};

export const API_BASE_URL = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor ────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // Добавляем язык
    if (!config.params) config.params = {};
    if (!config.params.lang && !config.params.language) {
      config.params.lang = "ru";
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor ───────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    // Не трогаем изображения и плееры — они возвращают сырой контент
    const url = response.config?.url || "";
    const shouldUnwrap =
      !url.includes("/images/") && !url.includes("/players/");

    if (
      shouldUnwrap &&
      response.data &&
      response.data.success === true &&
      response.data.data !== undefined
    ) {
      response.data = response.data.data;
    }

    return response;
  },
  (error) => Promise.reject(error),
);
