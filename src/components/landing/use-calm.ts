"use client";

import * as React from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/**
 * Người dùng có bật "giảm chuyển động" không.
 *
 * Dùng thay cho `useReducedMotion` của motion ở những chỗ giá trị này đổi
 * cả CẤU TRÚC trang (có ghim hay không, có thẻ hay không): máy chủ luôn
 * trả `false`, và React tự dựng lại sau hydrate nếu máy khách khác, nên
 * không có lỗi hydration mismatch.
 */
export function useCalm(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
