export function AuthIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Shield body */}
      <path
        d="M200 40 L290 80 L290 170 C290 220 250 260 200 280 C150 260 110 220 110 170 L110 80 Z"
        fill="currentColor"
        opacity="0.08"
      />
      <path
        d="M200 40 L290 80 L290 170 C290 220 250 260 200 280 C150 260 110 220 110 170 L110 80 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.4"
      />

      {/* Inner shield highlight */}
      <path
        d="M200 65 L270 95 L270 168 C270 208 240 240 200 258 C160 240 130 208 130 168 L130 95 Z"
        fill="currentColor"
        opacity="0.05"
      />

      {/* Lock body */}
      <rect
        x="175"
        y="145"
        width="50"
        height="42"
        rx="6"
        fill="currentColor"
        opacity="0.2"
      />
      <rect
        x="175"
        y="145"
        width="50"
        height="42"
        rx="6"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.35"
      />

      {/* Lock shackle */}
      <path
        d="M183 145 L183 128 C183 115 190 108 200 108 C210 108 217 115 217 128 L217 145"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.35"
      />

      {/* Keyhole */}
      <circle cx="200" cy="162" r="6" fill="currentColor" opacity="0.35" />
      <rect
        x="198"
        y="165"
        width="4"
        height="10"
        rx="2"
        fill="currentColor"
        opacity="0.35"
      />

      {/* Checkmark badge */}
      <circle cx="240" cy="135" r="16" fill="currentColor" opacity="0.12" />
      <circle
        cx="240"
        cy="135"
        r="16"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.3"
      />
      <polyline
        points="232,135 238,141 250,129"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      />

      {/* Floating chart lines (financial context) */}
      <polyline
        points="80,230 120,218 160,222 200,210 240,198 280,188 320,178"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.15"
      />
      <polyline
        points="80,250 120,245 160,248 200,240 240,235 280,228 320,222"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.1"
      />

      {/* Sparkles/stars */}
      <circle cx="95" cy="65" r="3" fill="currentColor" opacity="0.2" />
      <circle cx="310" cy="55" r="2.5" fill="currentColor" opacity="0.15" />
      <circle cx="325" cy="120" r="2" fill="currentColor" opacity="0.12" />
      <circle cx="80" cy="130" r="2.5" fill="currentColor" opacity="0.12" />
      <circle cx="340" cy="200" r="3" fill="currentColor" opacity="0.1" />
    </svg>
  );
}
