"use client";
import { useEffect, useRef } from "react";

export default function Modal({ children, onClose, label }: { children: React.ReactNode; onClose: () => void; label: string }) {
  const container = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const elements = () => Array.from(container.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') ?? []);
    const focus = elements();
    (container.current?.querySelector<HTMLElement>('input:not(:disabled)') ?? focus[0] ?? container.current)?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); close.current(); }
      if (event.key !== "Tab") return;
      const items = elements();
      const first = items[0]; const last = items.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === container.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); document.body.style.overflow = oldOverflow; previous?.focus(); };
  }, []);
  return <div ref={container} className="modal-backdrop" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>{children}</div>;
}
