import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  textClassName?: string;
  showText?: boolean;
}

export function Logo({ className, textClassName, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10"
      >
        {/* Elegant bobbin/spool with decorative elements */}
        {/* Top disc of bobbin */}
        <ellipse cx="24" cy="10" rx="12" ry="4" fill="currentColor" />
        
        {/* Body of bobbin */}
        <rect x="16" y="10" width="16" height="28" fill="currentColor" opacity="0.85" />
        
        {/* Thread wrapped around bobbin - decorative curves */}
        <path
          d="M16 16 Q12 20 16 24 Q12 28 16 32"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M32 16 Q36 20 32 24 Q36 28 32 32"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
        
        {/* Center thread line */}
        <line x1="24" y1="14" x2="24" y2="34" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        
        {/* Bottom disc of bobbin */}
        <ellipse cx="24" cy="38" rx="12" ry="4" fill="currentColor" />
        
        {/* Decorative dots at corners */}
        <circle cx="8" cy="10" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="40" cy="10" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="8" cy="38" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="40" cy="38" r="2" fill="currentColor" opacity="0.5" />
      </svg>
      
      {showText && (
        <span 
          className={cn(
            "text-2xl",
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
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-10 w-10", className)}
    >
      {/* Elegant bobbin/spool */}
      <ellipse cx="24" cy="10" rx="12" ry="4" fill="currentColor" />
      <rect x="16" y="10" width="16" height="28" fill="currentColor" opacity="0.85" />
      <path d="M16 16 Q12 20 16 24 Q12 28 16 32" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
      <path d="M32 16 Q36 20 32 24 Q36 28 32 32" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
      <line x1="24" y1="14" x2="24" y2="34" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <ellipse cx="24" cy="38" rx="12" ry="4" fill="currentColor" />
      <circle cx="8" cy="10" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="40" cy="10" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="8" cy="38" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="40" cy="38" r="2" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
