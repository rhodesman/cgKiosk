import { useRef, useState, type ReactNode } from "react";
import { useAutoScrollReset } from "../hooks/useAutoScrollReset";

export function ScrollList({ children }: { children: ReactNode }) {
  const listRef = useRef<HTMLDivElement>(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  useAutoScrollReset(listRef, 30000);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const bottomPos = el.scrollHeight - el.clientHeight;
    setAtTop(el.scrollTop <= 40);
    setAtBottom(bottomPos <= el.scrollTop + 40);
  };

  const cls = ["list", atTop ? "" : "top", atBottom ? "" : "bottom"].filter(Boolean).join(" ");
  return (
    <div className={cls} ref={listRef} onScroll={onScroll}>
      <ul>{children}</ul>
    </div>
  );
}
