export function ViBrandMark({
  className = "h-11 w-11",
  priority: _priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={`vi-brand-mark relative inline-grid shrink-0 place-items-center overflow-hidden rounded-[32%] ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 72 72"
        role="presentation"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="vi-guide-mark-sea" x1="9" y1="6" x2="62" y2="68" gradientUnits="userSpaceOnUse">
            <stop stopColor="#16B8AE" />
            <stop offset="0.58" stopColor="#08746E" />
            <stop offset="1" stopColor="#043331" />
          </linearGradient>
          <linearGradient id="vi-guide-mark-sun" x1="45" y1="9" x2="56" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFE99D" />
            <stop offset="1" stopColor="#F5C451" />
          </linearGradient>
          <filter id="vi-guide-mark-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#021F1D" floodOpacity="0.22" />
          </filter>
        </defs>
        <rect width="72" height="72" rx="22" fill="url(#vi-guide-mark-sea)" />
        <circle cx="52.5" cy="18.5" r="8.5" fill="url(#vi-guide-mark-sun)" />
        <path
          d="M9 51.5c8.6-6.2 17.4-6.2 26 0s17.4 6.2 28 0"
          stroke="#A8F0E8"
          strokeWidth="4.4"
          strokeLinecap="round"
          fill="none"
          opacity="0.96"
        />
        <path
          d="M11 59c8-4.7 16-4.7 24 0s16 4.7 26 0"
          stroke="#FFFFFF"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.88"
        />
        <g filter="url(#vi-guide-mark-shadow)">
          <path d="M15 21h7.6l6.7 18.4L36 21h7.4L32.7 47h-7.1L15 21Z" fill="#FFFFFF" />
          <path d="M43.3 31.2h6.9V47h-6.9V31.2Z" fill="#FFFFFF" />
          <circle cx="46.75" cy="25" r="3.55" fill="#FFFFFF" />
        </g>
      </svg>
    </span>
  );
}
