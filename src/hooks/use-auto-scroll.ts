import { useEffect, useRef } from "react";

/**
 * Hook to automatically scroll to the bottom of a container when content changes
 * Useful for chat/transcript views
 *
 * @param dependencies - Array of dependencies that trigger auto-scroll
 * @returns Ref to attach to the scrollable container
 */
export function useAutoScroll<T extends HTMLElement>(dependencies: unknown[]) {
  const scrollRef = useRef<T>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, dependencies);

  return scrollRef;
}
