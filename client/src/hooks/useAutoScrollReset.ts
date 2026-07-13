import { useEffect, type RefObject } from "react";

export function useAutoScrollReset(ref: RefObject<HTMLElement>, idleMs: number) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { el.scrollTop = 0; }, idleMs);
    };
    el.addEventListener("scroll", onScroll);
    return () => { clearTimeout(timer); el.removeEventListener("scroll", onScroll); };
  }, [ref, idleMs]);
}
