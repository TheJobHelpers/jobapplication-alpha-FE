// Logo — the brand mark (public/tjh.png) + the name, used across both portals
// and the marketing pages. The image is the circular "the Job helpers" badge;
// the text label keeps the name legible at small sizes. Name colour inherits the
// surface (foreground), so it works on the dark ops console and the light client.

import Image from "next/image";
import { cn } from "@/lib/cn";

export function Logo({
  size = 30,
  showName = true,
  subtitle,
  className,
}: {
  size?: number;
  showName?: boolean;
  subtitle?: string;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/tjh.png"
        alt="The Job Helpers"
        width={size}
        height={size}
        className="rounded-full"
        priority
      />
      {showName && (
        <span className="leading-tight">
          <span className="block text-[14px] font-semibold text-foreground">
            The Job Helpers
          </span>
          {subtitle && (
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
