// Homefix Renovations logo.
//
// This is an SVG recreation of the brand mark (house roof + window) that
// inherits `currentColor`, so it recolours with the brand theme. To use the
// exact supplied artwork instead, drop the file at `public/logo.png` and swap
// the markup below for `<img src="/logo.png" alt="Homefix Renovations" />`.

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label="Homefix Renovations"
    >
      {/* roof */}
      <path
        d="M5 23 L24 8 L43 23"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 4-pane window */}
      <rect x="9" y="27" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="3.5" />
      <path
        d="M16.5 27.5 V41.5 M9.5 34.5 H23.5"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Full horizontal lockup: mark + "Homefix Renovations" wordmark. */
export function LogoLockup({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-9 w-9 text-brand-600" />
      <span className="leading-none">
        <span className="text-xl font-bold tracking-tight text-slate-700">Homefix</span>{" "}
        <span className="text-xl italic text-brand-600" style={{ fontFamily: "'Brush Script MT', cursive" }}>
          Renovations
        </span>
      </span>
    </span>
  );
}
