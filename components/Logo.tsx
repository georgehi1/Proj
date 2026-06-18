"use client";

import { useState } from "react";

// Homefix Renovations logo.
//
// `BrandLogo` shows your real artwork from /public the moment you add it, and
// falls back to an on-brand SVG recreation until then — no code change needed:
//   • full logo  → save as  public/logo.png        (used on the login screen)
//   • icon mark   → save as  public/logo-mark.png   (used in the sidebar)
// PNG/JPG/SVG all work; just match the filename.

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

/** SVG fallback lockup: mark + "Homefix Renovations" wordmark. */
export function LogoLockup({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-9 w-9 text-brand-600" />
      <span className="leading-none">
        <span className="text-xl font-bold tracking-tight text-slate-700">Homefix</span>{" "}
        <span
          className="text-xl italic text-brand-600"
          style={{ fontFamily: "'Brush Script MT', cursive" }}
        >
          Renovations
        </span>
      </span>
    </span>
  );
}

/**
 * Renders the image at `src` if it exists, otherwise `fallback`. Lets us ship
 * the SVG recreation today and have the real file picked up automatically once
 * it's dropped into /public.
 */
export function BrandLogo({
  src = "/logo.png",
  alt = "Homefix Renovations",
  imgClassName = "",
  fallback,
}: {
  src?: string;
  alt?: string;
  imgClassName?: string;
  fallback: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={imgClassName} onError={() => setFailed(true)} />
  );
}
