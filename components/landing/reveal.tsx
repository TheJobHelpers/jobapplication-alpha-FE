"use client";

// Reveal — fades + lifts its children in when scrolled into view. Used only on
// the marketing landing page. Respects prefers-reduced-motion (the CSS gate on
// .lp-in turns the animation off; we still reveal so nothing stays hidden).

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(shown ? "lp-in" : "opacity-0", className)}
      style={shown ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
