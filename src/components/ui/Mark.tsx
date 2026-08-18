/**
 * The elpideus mark.
 *
 * Inlined rather than loaded from `/brand/logo.svg` so it inherits
 * `currentColor` and costs no request. The source of truth for the shape is
 * that file; keep the two in step if the brand changes.
 */

export function Mark({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 1359.75 1744.69"
      width={size}
      height={(size * 1744.69) / 1359.75}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeMiterlimit={10}
      aria-hidden="true"
      focusable="false"
    >
      <line x1="679.88" y1="1528.43" x2="679.88" y2="1649.69" strokeWidth={190} strokeLinecap="round" />
      <line x1="679.88" y1="95" x2="679.88" y2="236.39" strokeWidth={190} strokeLinecap="round" />
      <path
        d="M728.3,1045.43l130.54-238.1c19.76-36.04-6.32-80.09-47.42-80.09h-261.09c-41.1,0-67.19,44.04-47.42,80.09l130.54,238.1c20.53,37.44,74.32,37.44,94.85,0Z"
        fill="currentColor"
        stroke="none"
      />
      <circle cx="679.88" cy="869.37" r="584.38" strokeWidth={191} />
    </svg>
  );
}
