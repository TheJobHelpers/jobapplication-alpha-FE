// Logo — the brand lockup used across both portals and the marketing pages.
// The image already carries the parent brand (public/tjh.png, "the Job helpers"
// badge), so the text is just the platform name, "Job Application Portal", in a
// medium weight balanced against the badge (no redundant "The Job Helpers" text).
// Name colour inherits the surface, so it works on the dark ops console and the
// light client portal.

import Image from "next/image";
import { cn } from "@/lib/cn";

export function Logo({
  size = 30,
  showName = true,
  className,
}: {
  size?: number;
  showName?: boolean;
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
        <span className="whitespace-nowrap text-[14px] font-medium text-foreground">
          Job Application Portal
        </span>
      )}
    </span>
  );
}
