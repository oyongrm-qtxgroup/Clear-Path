export function ExpenseIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Receipt body */}
      <path
        d="M120 50 L280 50 L280 260 L268 248 L256 260 L244 248 L232 260 L220 248 L208 260 L196 248 L184 260 L172 248 L160 260 L148 248 L136 260 L124 248 L120 260 Z"
        fill="currentColor"
        opacity="0.08"
      />
      <path
        d="M120 50 L280 50 L280 260 L268 248 L256 260 L244 248 L232 260 L220 248 L208 260 L196 248 L184 260 L172 248 L160 260 L148 248 L136 260 L124 248 L120 260 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.45"
      />

      {/* Receipt header line */}
      <rect
        x="155"
        y="72"
        width="90"
        height="6"
        rx="3"
        fill="currentColor"
        opacity="0.3"
      />

      {/* Receipt lines */}
      <rect
        x="145"
        y="100"
        width="110"
        height="4"
        rx="2"
        fill="currentColor"
        opacity="0.2"
      />
      <rect
        x="145"
        y="118"
        width="90"
        height="4"
        rx="2"
        fill="currentColor"
        opacity="0.2"
      />
      <rect
        x="145"
        y="136"
        width="100"
        height="4"
        rx="2"
        fill="currentColor"
        opacity="0.2"
      />
      <rect
        x="145"
        y="154"
        width="80"
        height="4"
        rx="2"
        fill="currentColor"
        opacity="0.2"
      />

      {/* Separator dashes */}
      <line
        x1="145"
        y1="175"
        x2="255"
        y2="175"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        opacity="0.25"
      />

      {/* Total line */}
      <rect
        x="145"
        y="190"
        width="60"
        height="5"
        rx="2.5"
        fill="currentColor"
        opacity="0.35"
      />
      <rect
        x="225"
        y="190"
        width="30"
        height="5"
        rx="2.5"
        fill="currentColor"
        opacity="0.35"
      />

      {/* Dollar sign circle */}
      <circle cx="315" cy="95" r="30" fill="currentColor" opacity="0.1" />
      <circle
        cx="315"
        cy="95"
        r="30"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.35"
      />
      <text
        x="315"
        y="102"
        textAnchor="middle"
        fontSize="24"
        fontWeight="bold"
        fill="currentColor"
        opacity="0.4"
      >
        $
      </text>

      {/* Pen/pencil */}
      <line
        x1="85"
        y1="80"
        x2="110"
        y2="220"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.25"
      />
      <polygon
        points="110,220 105,230 115,225"
        fill="currentColor"
        opacity="0.3"
      />

      {/* Sparkles */}
      <circle cx="330" cy="55" r="2.5" fill="currentColor" opacity="0.25" />
      <circle cx="90" cy="55" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="345" cy="165" r="3" fill="currentColor" opacity="0.2" />
    </svg>
  );
}
