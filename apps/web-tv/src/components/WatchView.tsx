import { useEffect, useMemo, useRef, useState } from "react";
import {
  setFocus,
  useFocusable,
} from "@noriginmedia/norigin-spatial-navigation";
import type { ApiMovie } from "@neomovies/api-client";
import { api, fetchMovieDetails } from "../api";
import { getPosterImageUrl } from "../imageUrl";
import { usePlayerSource } from "../hooks/usePlayerSource";
import type { PlayerKey } from "../types";
import { PlayerOverlay } from "./PlayerOverlay";
import "./WatchView.css";

const PLAYER_LABELS: Record<PlayerKey, string> = {
  cdn: "Плеер 1",
  alloha: "Alloha",
  collaps: "Collaps",
  lumex: "Lumex",
};

type WatchViewProps = {
  movieId: string;
  onBack: () => void;
};

type PlayerButtonProps = {
  player: PlayerKey;
  active: boolean;
  watchFocusKey: string;
  onOpenPlayer: (player: PlayerKey, focusKey: string) => void;
};

function PlayerButton({
  player,
  active,
  watchFocusKey,
  onOpenPlayer,
}: PlayerButtonProps) {
  const focusKey = `${watchFocusKey}-player-${player}`;
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => onOpenPlayer(player, focusKey),
  });

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      className={`watch-player-button ${active ? "is-active" : ""} ${focused ? "is-focused" : ""}`}
    >
      <span className="watch-player-button-title">{PLAYER_LABELS[player]}</span>
      <span className="watch-player-button-text">Открыть источник</span>
    </button>
  );
}

export function WatchView({ movieId, onBack }: WatchViewProps) {
  const [movie, setMovie] = useState<ApiMovie | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [playerReturnFocusKey, setPlayerReturnFocusKey] = useState("");
  const [playerOpen, setPlayerOpen] = useState(false);
  const [logoBroken, setLogoBroken] = useState(false);

  // Состояния загрузки изображений для скелетонов
  const [backdropLoaded, setBackdropLoaded] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);

  const {
    selectedPlayer,
    playerUrl,
    playerHtml,
    cdnAvailable,
    isLoading: playerLoading,
    loadPlayer,
  } = usePlayerSource();

  // Фиксируем cdnAvailable ровно один раз — после завершения начальной проверки CDN.
  // Проблема: loadPlayer при каждом вызове (например, при открытии Alloha) может
  // сбрасывать cdnAvailable в хуке, из-за чего «Плеер 1» снова появляется/исчезает.
  // Решение: запоминаем значение через ref + state и больше не обновляем его.
  const cdnCheckDoneRef = useRef(false);
  const [lockedCdnAvailable, setLockedCdnAvailable] = useState(false);

  useEffect(() => {
    // Срабатывает каждый раз когда cdnAvailable меняется, но записываем только первый раз
    if (cdnCheckDoneRef.current) return;
    // detailsLoading всё ещё true — CDN-проверка ещё не завершена
    if (detailsLoading) return;
    cdnCheckDoneRef.current = true;
    setLockedCdnAvailable(cdnAvailable);
  }, [cdnAvailable, detailsLoading]);

  const watchFocusKey = `watch-${movieId}`;
  const firstPlayerFocusKey = `${watchFocusKey}-player-${lockedCdnAvailable ? "cdn" : "alloha"}`;

  const players = useMemo(
    () =>
      lockedCdnAvailable
        ? (["cdn", "alloha", "collaps", "lumex"] as PlayerKey[])
        : (["alloha", "collaps", "lumex"] as PlayerKey[]),
    [lockedCdnAvailable],
  );

  const { ref } = useFocusable({
    focusKey: watchFocusKey,
    focusable: false,
    trackChildren: true,
    saveLastFocusedChild: true,
    preferredChildFocusKey: firstPlayerFocusKey,
  });

  const { ref: backRef, focused: backFocused } = useFocusable({
    focusKey: `${watchFocusKey}-back`,
    onEnterPress: onBack,
    onArrowPress: (direction) => {
      if (direction !== "down") return true;
      setFocus(firstPlayerFocusKey);
      return false;
    },
  });

  useEffect(() => {
    let cancelled = false;

    void fetchMovieDetails(movieId)
      .then((nextMovie) => {
        if (cancelled) return;
        setMovie(nextMovie);
        setDetailsLoading(false);
        void loadPlayer(nextMovie, "cdn");
      })
      .catch(() => {
        if (cancelled) return;
        setDetailsError("Не удалось загрузить данные фильма.");
        setDetailsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadPlayer, movieId]);

  useEffect(() => {
    if (detailsLoading) return;
    requestAnimationFrame(() => {
      setFocus(firstPlayerFocusKey);
    });
  }, [detailsLoading, firstPlayerFocusKey]);

  const openPlayer = (player: PlayerKey, focusKey: string) => {
    if (!movie) return;
    setPlayerReturnFocusKey(focusKey);
    void loadPlayer(movie, player).then(() => {
      setPlayerOpen(true);
    });
  };

  const hasLogo = !logoBroken;
  const title = movie?.title || "";
  const originalTitle =
    movie?.originalTitle && movie.originalTitle !== movie.title
      ? movie.originalTitle
      : null;
  const description =
    movie?.description || movie?.overview || "Описание недоступно.";
  const posterUrl = getPosterImageUrl(movie?.posterUrl);
  const backdropUrl =
    movie?.backdropUrl || (movie ? api.backdropUrl(movie.id, "large") : "");
  const logoUrl = movie
    ? `${api.logoUrl(movie.id)}?size=small&format=webp&quality=80`
    : "";
  const genres = movie?.genres ?? [];
  const metaTop = [movie?.year, movie?.country].filter(Boolean).join(", ");
  const duration = movie?.duration
    ? `${Math.round(movie.duration / 60)} мин`
    : null;

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="watch-view">
      {/* Скелетон бэкдропа — виден пока картинка не загрузилась */}
      <div
        className={`watch-backdrop-skeleton ${backdropLoaded ? "is-hidden" : ""}`}
      />

      {backdropUrl ? (
        <img
          className={`watch-backdrop ${backdropLoaded ? "is-loaded" : ""}`}
          src={backdropUrl}
          alt=""
          onLoad={() => setBackdropLoaded(true)}
        />
      ) : null}
      <div className="watch-backdrop-overlay" />

      <div className="watch-topbar">
        <button
          ref={backRef as React.RefObject<HTMLButtonElement>}
          type="button"
          className={`watch-back-button ${backFocused ? "is-focused" : ""}`}
        >
          ← Назад
        </button>
      </div>

      <div className="watch-layout">
        {/* Постер с собственным скелетоном */}
        <div className="watch-poster-shell">
          {!posterLoaded && <div className="watch-poster-skeleton" />}
          {posterUrl ? (
            <img
              className={`watch-poster ${posterLoaded ? "is-loaded" : ""}`}
              src={posterUrl}
              alt={title}
              onLoad={() => setPosterLoaded(true)}
            />
          ) : null}
        </div>

        <div className="watch-copy">
          {/* Скелетоны контента пока detailsLoading */}
          {detailsLoading ? (
            <div className="watch-content-skeleton">
              <div className="watch-skeleton-line watch-skeleton-meta" />
              <div className="watch-skeleton-line watch-skeleton-title" />
              <div className="watch-skeleton-line watch-skeleton-title watch-skeleton-title-short" />
              <div className="watch-skeleton-badges">
                <div className="watch-skeleton-badge" />
                <div className="watch-skeleton-badge" />
                <div className="watch-skeleton-badge" />
              </div>
              <div className="watch-skeleton-buttons">
                <div className="watch-skeleton-btn" />
                <div className="watch-skeleton-btn" />
                <div className="watch-skeleton-btn" />
              </div>
              <div className="watch-skeleton-line watch-skeleton-section" />
              <div className="watch-skeleton-line watch-skeleton-desc" />
              <div className="watch-skeleton-line watch-skeleton-desc watch-skeleton-desc-short" />
            </div>
          ) : (
            <>
              {metaTop ? <div className="watch-meta-top">{metaTop}</div> : null}

              {logoUrl && hasLogo ? (
                <img
                  className="watch-logo"
                  src={logoUrl}
                  alt={title}
                  onError={() => setLogoBroken(true)}
                />
              ) : (
                <h1 className="watch-title">{title}</h1>
              )}

              {originalTitle ? (
                <div className="watch-subtitle">{originalTitle}</div>
              ) : null}

              <div className="watch-badges-row">
                {movie?.rating ? (
                  <span className="watch-badge watch-badge-rating">
                    {movie.rating.toFixed(1)}
                  </span>
                ) : null}
                {movie ? (
                  <span className="watch-badge">
                    {movie.type === "tv" ? "Сериал" : "Фильм"}
                  </span>
                ) : null}
                {duration ? (
                  <span className="watch-badge">{duration}</span>
                ) : null}
                {genres.map((g) => (
                  <span key={g.id} className="watch-badge watch-badge-muted">
                    {g.name}
                  </span>
                ))}
              </div>

              <div className="watch-actions-row">
                {players.map((player) => (
                  <PlayerButton
                    key={player}
                    player={player}
                    active={selectedPlayer === player}
                    watchFocusKey={watchFocusKey}
                    onOpenPlayer={openPlayer}
                  />
                ))}
              </div>

              <div className="watch-section-title">О фильме</div>
              <p className="watch-description">{description}</p>
            </>
          )}

          {detailsError ? (
            <div className="watch-state is-error">{detailsError}</div>
          ) : null}
          {!detailsLoading && playerLoading ? (
            <div className="watch-state">Подготавливаем плеер...</div>
          ) : null}
        </div>
      </div>

      {movie && playerOpen ? (
        <PlayerOverlay
          playerUrl={playerUrl}
          playerHtml={playerHtml}
          returnFocusKey={playerReturnFocusKey}
          onClose={() => setPlayerOpen(false)}
        />
      ) : null}
    </section>
  );
}
