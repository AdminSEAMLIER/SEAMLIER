import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  textClassName?: string;
}

export function Logo({ className, textClassName }: LogoProps) {
  return (
    <span 
      className={cn(
        "text-xl font-bold tracking-wide",
        className,
        textClassName
      )}
      style={{ fontFamily: "'Satoshi', sans-serif" }}
    >
      SEAMLI
    </span>
  );
}
