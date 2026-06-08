import type { ApiMovie } from "@neomovies/api-client";
import { api as clientApi } from "@neomovies/api-client";

const API_BASE_URL: string =
  (clientApi.raw.defaults.baseURL as string) || "https://api.neome.uk";

export type PlayerKey = "cdn" | "alloha" | "collaps" | "lumex";

export type PlayerResult = {
  playerUrl: string | null;
  playerHtml: string | null;
  cdnAvailable: boolean;
};

function getKpId(movie: ApiMovie): string {
  return String(movie.externalIds?.kp ?? movie.id.replace(/^kp_/, ""));
}

export function getPosterUrl(path: string): string {
  const kpMatch = path.match(
    /kinopoiskapiunofficial\.tech\/images\/posters\/kp\/(\d+)\.jpg/,
  );
  if (kpMatch) {
    return `${API_BASE_URL}/api/v1/images/kp/${kpMatch[1]}`;
  }
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function getBackdropUrl(id: string | number): string {
  return clientApi.backdropUrl(id, "large");
}

export async function fetchMovieDetails(id: string): Promise<ApiMovie> {
  const movieId = id.startsWith("kp_") ? id : `kp_${id}`;
  const result = await clientApi.getMovieById(movieId);
  return result as unknown as ApiMovie;
}

function extractPlayerUrl(raw: string): {
  playerUrl: string | null;
  playerHtml: string | null;
} {
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

export async function fetchPlayerSource(
  movie: ApiMovie,
  player: PlayerKey,
): Promise<PlayerResult> {
  const kpId = getKpId(movie);
  if (!kpId)
    return { playerUrl: null, playerHtml: null, cdnAvailable: false };

  if (player === "cdn") {
    try {
      const cdnUrl = `${API_BASE_URL}/api/v1/players/cdn/kp/${kpId}`;
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
    const res = await clientApi.raw.get(
      `/api/v1/players/${player}/kp/${kpId}`,
    );
    const raw = typeof res.data === "string" ? res.data : "";
    const extracted = extractPlayerUrl(raw);
    return {
      playerUrl: extracted.playerUrl,
      playerHtml: extracted.playerHtml,
      cdnAvailable: true,
    };
  } catch {
    return { playerUrl: null, playerHtml: null, cdnAvailable: true };
  }
}
