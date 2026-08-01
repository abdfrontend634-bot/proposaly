import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

/**
 * Pitchly logo mark — a rising pitch arrow with a gold accent.
 * Purely presentational; pair with <Wordmark /> for the full lockup.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid shrink-0 place-items-center rounded-[10px] bg-primary text-primary-foreground shadow-sm",
        className ?? "h-8 w-8",
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[58%] w-[58%]">
        <path d="M12 3.5 L20.5 20.5 L12 16 L3.5 20.5 Z" fill="currentColor" />
      </svg>
      <span className="absolute right-[3px] top-[3px] h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_0_1.5px_var(--primary)]" />
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("font-semibold tracking-tight", className)}>{BRAND.name}</span>;
}

export function Lockup({
  markClassName,
  textClassName,
  className,
}: {
  markClassName?: string;
  textClassName?: string;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <Wordmark className={textClassName ?? "text-[15px]"} />
    </span>
  );
}
