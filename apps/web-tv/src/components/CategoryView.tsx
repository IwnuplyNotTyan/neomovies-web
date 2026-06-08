import { useEffect, useRef } from "react";
import {
  setFocus,
  useFocusable,
} from "@noriginmedia/norigin-spatial-navigation";
import type { ApiMovie } from "@neomovies/api-client";
import { categoryTitles } from "../categoryConfig";
import { useCategoryPagination } from "../hooks/useCategoryPagination";
import { useSkeletonCount } from "../hooks/useSkeletonCount";
import type { CategoryId } from "../types";
import { PosterCard } from "./PosterCard";
import "./CategoryView.css";

type CategoryViewProps = {
  categoryId: CategoryId;
  onCardFocus: (movie: ApiMovie) => void;
  onContentFocus?: (focusKey: string) => void;
  onOpenDetails?: (movie: ApiMovie, focusKey: string) => void;
  autoFocusFirstCard?: boolean;
  withSidebar?: boolean;
  preferredFocusKey?: string;
  restoreFocusKey?: string;
  onRestoreFocusApplied?: () => void;
  onSidebarFocusRequest?: (categoryId: CategoryId) => void;
};

export function CategoryView({
  categoryId,
  onCardFocus,
  onContentFocus,
  onOpenDetails,
  autoFocusFirstCard = true,
  withSidebar = false,
  preferredFocusKey,
  restoreFocusKey,
  onRestoreFocusApplied,
  onSidebarFocusRequest,
}: CategoryViewProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const didAutoFocusRef = useRef(false);
  const { items, isInitialLoading, isLoadingMore, loadNextPage } =
    useCategoryPagination(categoryId);
  const skeletonCount = useSkeletonCount(viewportRef, 12);
  const categoryFocusKey = `category-${categoryId}`;

  // trackChildren: true позволяет получить focused=true когда фокус на любой дочерней карточке.
  // Это заменяет initialFocusCategoryRef — теперь авто-фокус не запускается
  // пока категория уже в фокусе, но запускается при каждом возврате.
  const { ref, focused: categoryHasFocus } = useFocusable({
    focusKey: categoryFocusKey,
    focusable: false,
    trackChildren: true,
    saveLastFocusedChild: true,
    preferredChildFocusKey: preferredFocusKey || `${categoryFocusKey}-card-0`,
  });

  // Восстанавливаем точную позицию если вернулись с сохранённым ключом
  useEffect(() => {
    if (!restoreFocusKey || isInitialLoading || items.length === 0) return;
    if (withSidebar) return;

    requestAnimationFrame(() => {
      setFocus(restoreFocusKey);
      didAutoFocusRef.current = true;
      onRestoreFocusApplied?.();
    });
  }, [restoreFocusKey, isInitialLoading, items.length, onRestoreFocusApplied, withSidebar]);

  // Авто-фокус на card-0: срабатывает при каждом входе когда:
  // 1. Нет ключа восстановления (иначе он выше уже сработает)
  // 2. Категория не имеет фокуса прямо сейчас (т.е. мы только что вошли)
  // 3. Данные уже загружены
  // Не используем ref с categoryId — он блокировал фокус при повторных заходах.
  useEffect(() => {
    if (!autoFocusFirstCard) {
      didAutoFocusRef.current = false;
      return;
    }
    if (isInitialLoading || items.length === 0 || !autoFocusFirstCard) return;
    if (restoreFocusKey) return; // restore-эффект выше уже справится
    if (categoryHasFocus) return; // уже в фокусе — не перебивать
    if (didAutoFocusRef.current) return;

    requestAnimationFrame(() => {
      setFocus(`${categoryFocusKey}-card-0`);
      didAutoFocusRef.current = true;
    });
  }, [
    autoFocusFirstCard,
    categoryFocusKey,
    categoryHasFocus,
    isInitialLoading,
    items.length,
    restoreFocusKey,
  ]);

  useEffect(() => {
    didAutoFocusRef.current = false;
  }, [categoryId]);

  useEffect(() => {
    if (
      isInitialLoading ||
      isLoadingMore ||
      items.length === 0 ||
      items.length >= skeletonCount
    )
      return;
    loadNextPage();
  }, [
    isInitialLoading,
    isLoadingMore,
    items.length,
    loadNextPage,
    skeletonCount,
  ]);

  const getColumnCount = () => {
    const grid = viewportRef.current;
    const firstCard = grid?.querySelector(".card") as HTMLElement | null;
    if (!grid || !firstCard) return 1;
    const style = window.getComputedStyle(grid);
    const gap = Number.parseFloat(style.columnGap) || 0;
    return Math.max(
      1,
      Math.floor((grid.clientWidth + gap) / (firstCard.offsetWidth + gap)),
    );
  };

  const isRowLeftEdge = (index: number) => {
    const grid = viewportRef.current;
    const currentCard = grid?.querySelector(`[data-focus-key="${categoryFocusKey}-card-${index}"]`) as HTMLElement | null;
    const previousCard = index > 0
      ? (grid?.querySelector(`[data-focus-key="${categoryFocusKey}-card-${index - 1}"]`) as HTMLElement | null)
      : null;

    if (!currentCard) return index === 0;
    if (!previousCard) return true;

    const currentTop = Math.round(currentCard.offsetTop);
    const previousTop = Math.round(previousCard.offsetTop);
    return currentTop !== previousTop;
  };

  // Fast instant scroll — no smooth, no jank when holding a key
  const scrollCardIntoView = (element: HTMLButtonElement) => {
    const grid = viewportRef.current;
    if (!grid) return;

    const gridRect = grid.getBoundingClientRect();
    const cardRect = element.getBoundingClientRect();

    const topEdge = cardRect.top - gridRect.top + grid.scrollTop;
    const bottomEdge = topEdge + cardRect.height;

    if (cardRect.top < gridRect.top + 40) {
      grid.scrollTop = topEdge - 40;
    } else if (cardRect.bottom > gridRect.bottom - 100) {
      grid.scrollTop = bottomEdge - grid.clientHeight + 110;
    }
  };

  const moveByRow = (index: number, direction: string) => {
    if (direction !== "up" && direction !== "down") return true;

    const columns = getColumnCount();
    const nextIndex = direction === "down" ? index + columns : index - columns;
    if (nextIndex < 0 || nextIndex >= items.length) return true;

    setFocus(`${categoryFocusKey}-card-${nextIndex}`);
    return false;
  };

  const moveByEdge = (index: number, direction: string) => {
    const columns = getColumnCount();
    const col = index % columns;
    const rowLeftEdge = isRowLeftEdge(index);

    if (direction === "left" && rowLeftEdge) {
      if (index === 0) {
        onSidebarFocusRequest?.(categoryId);
        return false;
      }

      // Из первой колонки остальных рядов уходим на конец предыдущего ряда.
      const prevRowLast = index - 1;
      if (prevRowLast < 0) return true;
      setFocus(`${categoryFocusKey}-card-${prevRowLast}`);
      return false;
    }

    if (direction === "right" && col === columns - 1) {
      const nextRowFirst = index + 1;
      if (nextRowFirst >= items.length) return true;
      setFocus(`${categoryFocusKey}-card-${nextRowFirst}`);
      return false;
    }

    return true; // default horizontal nav
  };

  const handleCardFocus = (index: number, element: HTMLButtonElement) => {
    scrollCardIntoView(element);

    if (items.length - index <= Math.ceil(skeletonCount / 2)) {
      loadNextPage();
    }
  };

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`category-view ${withSidebar ? "category-view-with-sidebar" : ""}`}
    >
      <header className="category-header">
        <h1 className="category-title">{categoryTitles[categoryId]}</h1>
      </header>

      <div ref={viewportRef} className="category-grid">
        {isInitialLoading
          ? Array.from({ length: skeletonCount }, (_, index) => (
              <div key={index} className="card-skeleton" />
            ))
          : items.map((movie, index) => {
              const focusKey = `${categoryFocusKey}-card-${index}`;
              return (
                <PosterCard
                  key={`${movie.id}-${index}`}
                  movie={movie}
                  focusKey={focusKey}
                  cardIndex={index}
                  onEnterView={(element) => handleCardFocus(index, element)}
                  onFocused={onCardFocus}
                  onContentFocus={onContentFocus}
                  onEnterPress={onOpenDetails}
                  onArrowPress={(direction) => {
                    if (direction === "up" || direction === "down") {
                      return moveByRow(index, direction);
                    }
                    return moveByEdge(index, direction);
                  }}
                />
              );
            })}

        {isLoadingMore
          ? Array.from({ length: Math.min(skeletonCount, 8) }, (_, index) => (
              <div key={`more-${index}`} className="card-skeleton" />
            ))
          : null}
      </div>
    </section>
  );
}
