export function NoDataIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Empty box */}
      <path
        d="M140 120 L200 90 L260 120 L260 210 L200 240 L140 210 Z"
        fill="currentColor"
        opacity="0.06"
      />
      <path
        d="M140 120 L200 90 L260 120 L260 210 L200 240 L140 210 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.35"
      />
      {/* Box center line */}
      <line
        x1="200"
        y1="90"
        x2="200"
        y2="240"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.2"
      />
      <line
        x1="140"
        y1="120"
        x2="260"
        y2="120"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.2"
      />
      {/* Box left face */}
      <path
        d="M140 120 L200 150 L200 240 L140 210 Z"
        fill="currentColor"
        opacity="0.08"
      />
      {/* Box right face */}
      <path
        d="M260 120 L200 150 L200 240 L260 210 Z"
        fill="currentColor"
        opacity="0.04"
      />
      {/* Box top face */}
      <path
        d="M140 120 L200 90 L260 120 L200 150 Z"
        fill="currentColor"
        opacity="0.1"
      />

      {/* Open flaps */}
      <path
        d="M140 120 L120 95 L180 70 L200 90"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
        fill="currentColor"
        fillOpacity="0.04"
      />
      <path
        d="M260 120 L280 95 L220 70 L200 90"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
        fill="currentColor"
        fillOpacity="0.04"
      />

      {/* Question mark floating above */}
      <text
        x="200"
        y="55"
        textAnchor="middle"
        fontSize="32"
        fontWeight="bold"
        fill="currentColor"
        opacity="0.25"
      >
        ?
      </text>

      {/* Floating particles / dust */}
      <circle cx="160" cy="75" r="3" fill="currentColor" opacity="0.15" />
      <circle cx="245" cy="65" r="2" fill="currentColor" opacity="0.12" />
      <circle cx="130" cy="100" r="2.5" fill="currentColor" opacity="0.1" />
      <circle cx="275" cy="100" r="2" fill="currentColor" opacity="0.12" />

      {/* Shadow */}
      <ellipse
        cx="200"
        cy="260"
        rx="70"
        ry="8"
        fill="currentColor"
        opacity="0.08"
      />
    </svg>
  );
}
