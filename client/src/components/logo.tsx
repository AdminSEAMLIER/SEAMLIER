import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  textClassName?: string;
  showText?: boolean;
}

export function Logo({ className, textClassName, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10"
      >
        {/* Ornate decorative symbol inspired by luxury branding */}
        {/* Center circle */}
        <circle cx="24" cy="24" r="6" fill="currentColor" />
        
        {/* Four decorative fleur-de-lis style extensions */}
        {/* Top */}
        <path
          d="M24 4 C20 8 20 12 24 18 C28 12 28 8 24 4"
          fill="currentColor"
        />
        <circle cx="24" cy="6" r="2" fill="currentColor" />
        
        {/* Bottom */}
        <path
          d="M24 44 C20 40 20 36 24 30 C28 36 28 40 24 44"
          fill="currentColor"
        />
        <circle cx="24" cy="42" r="2" fill="currentColor" />
        
        {/* Left */}
        <path
          d="M4 24 C8 20 12 20 18 24 C12 28 8 28 4 24"
          fill="currentColor"
        />
        <circle cx="6" cy="24" r="2" fill="currentColor" />
        
        {/* Right */}
        <path
          d="M44 24 C40 20 36 20 30 24 C36 28 40 28 44 24"
          fill="currentColor"
        />
        <circle cx="42" cy="24" r="2" fill="currentColor" />
        
        {/* Diagonal decorative curls */}
        {/* Top-left */}
        <path
          d="M10 10 Q14 14 18 18"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="9" cy="9" r="2" fill="currentColor" />
        
        {/* Top-right */}
        <path
          d="M38 10 Q34 14 30 18"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="39" cy="9" r="2" fill="currentColor" />
        
        {/* Bottom-left */}
        <path
          d="M10 38 Q14 34 18 30"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="9" cy="39" r="2" fill="currentColor" />
        
        {/* Bottom-right */}
        <path
          d="M38 38 Q34 34 30 30"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="39" cy="39" r="2" fill="currentColor" />
      </svg>
      
      {showText && (
        <span 
          className={cn(
            "font-semibold tracking-[0.2em] uppercase",
            textClassName
          )}
          style={{ fontFamily: "'Bodoni Moda', serif" }}
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
      {/* Ornate decorative symbol */}
      <circle cx="24" cy="24" r="6" fill="currentColor" />
      
      {/* Top */}
      <path d="M24 4 C20 8 20 12 24 18 C28 12 28 8 24 4" fill="currentColor" />
      <circle cx="24" cy="6" r="2" fill="currentColor" />
      
      {/* Bottom */}
      <path d="M24 44 C20 40 20 36 24 30 C28 36 28 40 24 44" fill="currentColor" />
      <circle cx="24" cy="42" r="2" fill="currentColor" />
      
      {/* Left */}
      <path d="M4 24 C8 20 12 20 18 24 C12 28 8 28 4 24" fill="currentColor" />
      <circle cx="6" cy="24" r="2" fill="currentColor" />
      
      {/* Right */}
      <path d="M44 24 C40 20 36 20 30 24 C36 28 40 28 44 24" fill="currentColor" />
      <circle cx="42" cy="24" r="2" fill="currentColor" />
      
      {/* Diagonal curls */}
      <path d="M10 10 Q14 14 18 18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="9" cy="9" r="2" fill="currentColor" />
      
      <path d="M38 10 Q34 14 30 18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="39" cy="9" r="2" fill="currentColor" />
      
      <path d="M10 38 Q14 34 18 30" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="9" cy="39" r="2" fill="currentColor" />
      
      <path d="M38 38 Q34 34 30 30" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="39" cy="39" r="2" fill="currentColor" />
    </svg>
  );
}
