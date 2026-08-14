export function ViBrandMark({
  className = "h-11 w-11",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={`vi-brand-mark relative inline-grid shrink-0 place-items-center overflow-hidden rounded-[32%] ${className}`}
      aria-hidden="true"
      data-priority={priority ? "true" : undefined}
    >
      <svg
        viewBox="0 0 72 72"
        role="presentation"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="usvi-explorer-mark-sea" x1="8" y1="5" x2="64" y2="68" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1597A7" />
            <stop offset="0.52" stopColor="#0E7490" />
            <stop offset="1" stopColor="#062B3A" />
          </linearGradient>
          <linearGradient id="usvi-explorer-mark-sun" x1="45" y1="8" x2="59" y2="27" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFE99D" />
            <stop offset="1" stopColor="#F5C451" />
          </linearGradient>
          <filter id="usvi-explorer-mark-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#021F1D" floodOpacity="0.22" />
          </filter>
        </defs>
        <rect width="72" height="72" rx="22" fill="url(#usvi-explorer-mark-sea)" />
        <circle cx="53" cy="18" r="8.5" fill="url(#usvi-explorer-mark-sun)" />
        <circle cx="34" cy="34" r="19" fill="none" stroke="#C5FBF5" strokeWidth="1.5" opacity="0.34" />
        <path
          d="M9 54c8.6-5.2 17.4-5.2 26 0s17.4 5.2 28 0"
          stroke="#99F6E4"
          strokeWidth="3.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.92"
        />
        <path
          d="M11 61c8-4 16-4 24 0s16 4 26 0"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
          opacity="0.78"
        />
        <g filter="url(#usvi-explorer-mark-shadow)">
          <path d="M34 12.8 42.2 34 34 49.8 25.8 34 34 12.8Z" fill="#FFFFFF" />
          <path d="M34 12.8 42.2 34 34 31.6Z" fill="#F5C451" />
          <circle cx="34" cy="34" r="3.2" fill="#062B3A" />
        </g>
        <g fill="#F5C451">
          <circle cx="21" cy="47.2" r="1.8" />
          <circle cx="27.5" cy="45.6" r="1.35" />
          <circle cx="47" cy="47.5" r="1.6" />
        </g>
      </svg>
    </span>
  );
}
