import { useLocation } from "react-router-dom";

/**
 * Хук для определения активной страницы/раздела
 * Используется для условного включения автообновления API
 */
export function useActivePage() {
  const location = useLocation();
  
  // Определяем активную страницу по pathname
  const activePage = (() => {
    const path = location.pathname;
    
    // Основные страницы
    if (path === "/city" || path === "/" || path === "/trips-orders" || path === "/orders") {
      return "city";
    }
    if (path === "/intercity") {
      return "intercity";
    }
    if (path === "/requests") {
      return "requests";
    }
    if (path === "/booking") {
      return "booking";
    }
    if (path === "/history") {
      return "history";
    }
    
    return null;
  })();
  
  /**
   * Проверяет, является ли указанная страница активной
   * @param {string|string[]} pages - название страницы или массив страниц
   * @returns {boolean}
   */
  const isActivePage = (pages) => {
    if (!activePage) return false;
    if (Array.isArray(pages)) {
      return pages.includes(activePage);
    }
    return activePage === pages;
  };
  
  return {
    activePage,
    isActivePage,
    pathname: location.pathname,
  };
}

