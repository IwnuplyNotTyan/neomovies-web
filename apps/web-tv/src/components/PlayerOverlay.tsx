import { useEffect } from "react";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import "./PlayerOverlay.css";

type PlayerOverlayProps = {
  playerUrl: string | null;
  playerHtml: string | null;
  returnFocusKey: string;
  onClose: () => void;
};

export function PlayerOverlay({
  playerUrl,
  playerHtml,
  returnFocusKey,
  onClose,
}: PlayerOverlayProps) {
  useEffect(() => {
    const handleClose = (event: KeyboardEvent) => {
      if (event.key !== "Escape" && event.key !== "Backspace") return;
      // Оба флага обязательны: preventDefault — отменяет действие браузера (навигация назад),
      // stopPropagation — не даёт событию всплыть к роутеру/родителю.
      event.preventDefault();
      event.stopPropagation();
      onClose();
      requestAnimationFrame(() => {
        setFocus(returnFocusKey);
      });
    };

    // capture: true — перехватываем событие раньше всех остальных обработчиков
    window.addEventListener("keydown", handleClose, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleClose, { capture: true });
  }, [onClose, returnFocusKey]);

  return (
    <section className="player-overlay">
      <div className="player-overlay-frame">
        {playerUrl && !playerUrl.includes("blob:") ? (
          <iframe
            src={playerUrl}
            allowFullScreen
            className="player-overlay-iframe"
          />
        ) : null}
        {!playerUrl && playerHtml ? (
          <iframe
            srcDoc={playerHtml}
            allowFullScreen
            className="player-overlay-iframe"
          />
        ) : null}
      </div>
    </section>
  );
}
