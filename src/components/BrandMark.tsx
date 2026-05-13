/**
 * Inline Poké-ball mark used in the nav header. Matches src/app/icon.svg
 * (the favicon) so the on-page identity matches the browser-tab identity.
 *
 * Pure SVG, no external assets — renders crisp at any size class.
 */

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="pokeDD"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bm-top" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#ef4444" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="bm-bot" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#fafafa" />
          <stop offset="100%" stopColor="#e4e4e7" />
        </linearGradient>
        <radialGradient id="bm-sheen" cx="32%" cy="28%" r="48%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.40" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <clipPath id="bm-disc">
          <circle cx="32" cy="32" r="30" />
        </clipPath>
      </defs>
      <g clipPath="url(#bm-disc)">
        <rect x="0" y="0"  width="64" height="32" fill="url(#bm-top)" />
        <rect x="0" y="32" width="64" height="32" fill="url(#bm-bot)" />
        <rect x="0" y="0"  width="64" height="64" fill="url(#bm-sheen)" />
      </g>
      <rect x="2" y="29" width="60" height="6" fill="#18181b" />
      <circle cx="32" cy="32" r="30" fill="none" stroke="#18181b" strokeWidth="4" />
      <circle cx="32" cy="32" r="9"   fill="#18181b" />
      <circle cx="32" cy="32" r="5.5" fill="#ffffff" />
    </svg>
  );
}
