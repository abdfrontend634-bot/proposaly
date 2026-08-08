import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

/**
 * Proposly AI logo mark — a pink tile with a "P" monogram and a gold AI spark.
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
      <svg viewBox="0 0 512 512" fill="none" className="h-[70%] w-[70%]">
        <path
          d="M168 132h122c52 0 88 34 88 84s-36 86-88 86h-56v78h-66V132zm66 56v58h48c20 0 33-11 33-29s-13-29-33-29h-48z"
          fill="currentColor"
        />
        <path
          d="M352 330l13 33 33 13-33 13-13 33-13-33-33-13 33-13 13-33z"
          fill="var(--gold)"
        />
      </svg>
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
