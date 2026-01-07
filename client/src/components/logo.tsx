import { Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  textClassName?: string;
  showText?: boolean;
  iconSize?: string;
}

export function Logo({ className, textClassName, showText = true, iconSize = "h-7 w-7" }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-0", className)}>
      <Scissors className={cn(iconSize, "text-current -mr-1")} />
      {showText && (
        <span 
          className={cn(
            "text-xl",
            textClassName
          )}
          style={{ fontFamily: "'Parisienne', cursive" }}
        >
          L'Art de Coudre
        </span>
      )}
    </div>
  );
}

export function LogoIcon({ className }: { className?: string }) {
  return (
    <Scissors className={cn("h-6 w-6", className)} />
  );
}
