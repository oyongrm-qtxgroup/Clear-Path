export function DashboardIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Dashboard frame */}
      <rect
        x="60"
        y="40"
        width="280"
        height="220"
        rx="16"
        fill="currentColor"
        opacity="0.06"
      />
      <rect
        x="60"
        y="40"
        width="280"
        height="220"
        rx="16"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
      />

      {/* Top bar */}
      <rect
        x="60"
        y="40"
        width="280"
        height="35"
        rx="16"
        fill="currentColor"
        opacity="0.08"
      />
      <circle cx="85" cy="57" r="5" fill="currentColor" opacity="0.2" />
      <circle cx="105" cy="57" r="5" fill="currentColor" opacity="0.15" />
      <circle cx="125" cy="57" r="5" fill="currentColor" opacity="0.1" />

      {/* Chart area — bar chart */}
      <rect
        x="90"
        y="180"
        width="24"
        height="55"
        rx="4"
        fill="currentColor"
        opacity="0.2"
      />
      <rect
        x="130"
        y="150"
        width="24"
        height="85"
        rx="4"
        fill="currentColor"
        opacity="0.25"
      />
      <rect
        x="170"
        y="130"
        width="24"
        height="105"
        rx="4"
        fill="currentColor"
        opacity="0.3"
      />
      <rect
        x="210"
        y="155"
        width="24"
        height="80"
        rx="4"
        fill="currentColor"
        opacity="0.2"
      />
      <rect
        x="250"
        y="110"
        width="24"
        height="125"
        rx="4"
        fill="currentColor"
        opacity="0.35"
      />
      <rect
        x="290"
        y="140"
        width="24"
        height="95"
        rx="4"
        fill="currentColor"
        opacity="0.25"
      />

      {/* Stat cards row */}
      <rect
        x="85"
        y="88"
        width="62"
        height="32"
        rx="6"
        fill="currentColor"
        opacity="0.1"
      />
      <rect
        x="85"
        y="88"
        width="62"
        height="32"
        rx="6"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.15"
      />
      <rect
        x="160"
        y="88"
        width="62"
        height="32"
        rx="6"
        fill="currentColor"
        opacity="0.1"
      />
      <rect
        x="160"
        y="88"
        width="62"
        height="32"
        rx="6"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.15"
      />
      <rect
        x="235"
        y="88"
        width="62"
        height="32"
        rx="6"
        fill="currentColor"
        opacity="0.1"
      />
      <rect
        x="235"
        y="88"
        width="62"
        height="32"
        rx="6"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.15"
      />

      {/* Stat card text lines */}
      <rect
        x="92"
        y="95"
        width="30"
        height="3"
        rx="1.5"
        fill="currentColor"
        opacity="0.2"
      />
      <rect
        x="92"
        y="104"
        width="45"
        height="5"
        rx="2"
        fill="currentColor"
        opacity="0.25"
      />
      <rect
        x="167"
        y="95"
        width="30"
        height="3"
        rx="1.5"
        fill="currentColor"
        opacity="0.2"
      />
      <rect
        x="167"
        y="104"
        width="45"
        height="5"
        rx="2"
        fill="currentColor"
        opacity="0.25"
      />
      <rect
        x="242"
        y="95"
        width="30"
        height="3"
        rx="1.5"
        fill="currentColor"
        opacity="0.2"
      />
      <rect
        x="242"
        y="104"
        width="45"
        height="5"
        rx="2"
        fill="currentColor"
        opacity="0.25"
      />

      {/* Trend arrow going up */}
      <polyline
        points="90,225 140,215 190,200 240,185 290,165"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.25"
        strokeDasharray="6 3"
      />

      {/* Sparkles */}
      <circle cx="50" cy="70" r="3" fill="currentColor" opacity="0.15" />
      <circle cx="350" cy="50" r="2.5" fill="currentColor" opacity="0.12" />
      <circle cx="355" cy="250" r="2" fill="currentColor" opacity="0.1" />
    </svg>
  );
}
