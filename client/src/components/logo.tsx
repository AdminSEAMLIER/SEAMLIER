import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  textClassName?: string;
  showText?: boolean;
}

export function Logo({ className, textClassName, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8"
      >
        {/* Bobbin/Spool */}
        <ellipse cx="20" cy="8" rx="8" ry="3" fill="currentColor" opacity="0.9" />
        <rect x="12" y="8" width="16" height="24" fill="currentColor" opacity="0.7" />
        <ellipse cx="20" cy="32" rx="8" ry="3" fill="currentColor" opacity="0.9" />
        
        {/* Thread wrapping around bobbin */}
        <path
          d="M12 12 Q8 16 12 20 Q16 24 12 28"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M28 12 Q32 16 28 20 Q24 24 28 28"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
        
        {/* Needle with thread coming from bobbin */}
        <line x1="20" y1="32" x2="20" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      </svg>
      
      {showText && (
        <span 
          className={cn(
            "font-medium italic tracking-wide",
            textClassName
          )}
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          L'Art de Coudre
        </span>
      )}
    </div>
  );
}

export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
    >
      {/* Bobbin/Spool */}
      <ellipse cx="20" cy="8" rx="8" ry="3" fill="currentColor" opacity="0.9" />
      <rect x="12" y="8" width="16" height="24" fill="currentColor" opacity="0.7" />
      <ellipse cx="20" cy="32" rx="8" ry="3" fill="currentColor" opacity="0.9" />
      
      {/* Thread wrapping around bobbin */}
      <path
        d="M12 12 Q8 16 12 20 Q16 24 12 28"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M28 12 Q32 16 28 20 Q24 24 28 28"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      
      {/* Needle with thread coming from bobbin */}
      <line x1="20" y1="32" x2="20" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}
