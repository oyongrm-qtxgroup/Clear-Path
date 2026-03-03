export function SavingsIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Piggy bank body */}
      <ellipse
        cx="200"
        cy="175"
        rx="100"
        ry="80"
        fill="currentColor"
        opacity="0.12"
      />
      <ellipse
        cx="200"
        cy="175"
        rx="100"
        ry="80"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.6"
      />

      {/* Piggy ear */}
      <ellipse
        cx="145"
        cy="115"
        rx="22"
        ry="28"
        fill="currentColor"
        opacity="0.15"
      />
      <ellipse
        cx="145"
        cy="115"
        rx="22"
        ry="28"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.5"
      />

      {/* Piggy snout */}
      <ellipse
        cx="295"
        cy="180"
        rx="18"
        ry="14"
        fill="currentColor"
        opacity="0.18"
      />
      <ellipse
        cx="295"
        cy="180"
        rx="18"
        ry="14"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.5"
      />
      <circle cx="290" cy="177" r="3" fill="currentColor" opacity="0.4" />
      <circle cx="300" cy="177" r="3" fill="currentColor" opacity="0.4" />

      {/* Eye */}
      <circle cx="255" cy="150" r="5" fill="currentColor" opacity="0.5" />

      {/* Legs */}
      <rect
        x="150"
        y="240"
        width="16"
        height="30"
        rx="8"
        fill="currentColor"
        opacity="0.3"
      />
      <rect
        x="235"
        y="240"
        width="16"
        height="30"
        rx="8"
        fill="currentColor"
        opacity="0.3"
      />

      {/* Coin slot */}
      <rect
        x="185"
        y="95"
        width="30"
        height="6"
        rx="3"
        fill="currentColor"
        opacity="0.4"
      />

      {/* Coin dropping in */}
      <circle cx="200" cy="65" r="16" fill="currentColor" opacity="0.2" />
      <circle
        cx="200"
        cy="65"
        r="16"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.5"
      />
      <text
        x="200"
        y="70"
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill="currentColor"
        opacity="0.5"
      >
        $
      </text>

      {/* Sparkles */}
      <circle cx="135" cy="65" r="3" fill="currentColor" opacity="0.3" />
      <circle cx="270" cy="55" r="2.5" fill="currentColor" opacity="0.25" />
      <circle cx="310" cy="110" r="2" fill="currentColor" opacity="0.2" />
    </svg>
  );
}
