export function DebtIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Credit card body */}
      <rect
        x="80"
        y="80"
        width="240"
        height="150"
        rx="16"
        fill="currentColor"
        opacity="0.1"
      />
      <rect
        x="80"
        y="80"
        width="240"
        height="150"
        rx="16"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.5"
      />

      {/* Magnetic stripe */}
      <rect
        x="80"
        y="115"
        width="240"
        height="28"
        fill="currentColor"
        opacity="0.12"
      />

      {/* Chip */}
      <rect
        x="110"
        y="140"
        width="36"
        height="28"
        rx="4"
        fill="currentColor"
        opacity="0.2"
      />
      <rect
        x="110"
        y="140"
        width="36"
        height="28"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.35"
      />
      <line
        x1="128"
        y1="140"
        x2="128"
        y2="168"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.25"
      />
      <line
        x1="110"
        y1="154"
        x2="146"
        y2="154"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.25"
      />

      {/* Card number dots */}
      {[0, 1, 2, 3].map((group) =>
        [0, 1, 2, 3].map((dot) => (
          <circle
            key={`${group}-${dot}`}
            cx={110 + group * 50 + dot * 12}
            cy={190}
            r="3"
            fill="currentColor"
            opacity="0.3"
          />
        )),
      )}

      {/* Checkmark (paid off) floating */}
      <circle cx="320" cy="70" r="28" fill="currentColor" opacity="0.12" />
      <circle
        cx="320"
        cy="70"
        r="28"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.4"
      />
      <polyline
        points="307,70 316,79 333,62"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />

      {/* Downward trend arrow (debt going down) */}
      <polyline
        points="100,260 160,255 220,248 280,238 330,225"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
      />
      <polygon
        points="330,225 340,232 335,220"
        fill="currentColor"
        opacity="0.35"
      />

      {/* Small sparkles */}
      <circle cx="90" cy="60" r="2.5" fill="currentColor" opacity="0.2" />
      <circle cx="350" cy="130" r="2" fill="currentColor" opacity="0.2" />
    </svg>
  );
}
