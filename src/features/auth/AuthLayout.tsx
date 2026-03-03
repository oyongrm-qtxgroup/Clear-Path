import { type ReactNode } from "react";
import {
  TrendingDown,
  Target,
  PiggyBank,
  ArrowRight,
  DollarSign,
  Percent,
  Shield,
  TrendingUp,
} from "lucide-react";

// ── Animated floating icon ───────────────────────────────────────────────────
function FloatingIcon({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`absolute flex items-center justify-center rounded-xl bg-white/10 shadow-lg backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

// ── Animated SVG chart illustration ──────────────────────────────────────────
function ChartIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-xs">
      <svg viewBox="0 0 320 200" fill="none" className="w-full drop-shadow-2xl">
        {/* Grid lines */}
        {[40, 80, 120, 160].map((y) => (
          <line
            key={y}
            x1="40"
            y1={y}
            x2="300"
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="4 4"
          />
        ))}

        {/* Debt line going DOWN (good!) — draws in */}
        <polyline
          points="40,40 90,55 140,80 190,115 240,140 290,170"
          fill="none"
          stroke="rgba(239,68,68,0.7)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="auth-line-draw"
          strokeDasharray="500"
          strokeDashoffset="500"
        />
        {/* Debt dots */}
        {[
          [40, 40],
          [90, 55],
          [140, 80],
          [190, 115],
          [240, 140],
          [290, 170],
        ].map(([cx, cy], i) => (
          <circle
            key={`d${i}`}
            cx={cx}
            cy={cy}
            r="3.5"
            fill="#ef4444"
            className="auth-dot-pop"
            style={{ animationDelay: `${1.2 + i * 0.15}s` }}
          />
        ))}

        {/* Savings line going UP — draws in */}
        <polyline
          points="40,170 90,155 140,130 190,100 240,65 290,35"
          fill="none"
          stroke="rgba(52,211,153,0.8)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="auth-line-draw"
          strokeDasharray="500"
          strokeDashoffset="500"
          style={{ animationDelay: "0.3s" }}
        />
        {/* Savings area gradient */}
        <defs>
          <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(52,211,153,0.25)" />
            <stop offset="100%" stopColor="rgba(52,211,153,0)" />
          </linearGradient>
        </defs>
        <polygon
          points="40,170 90,155 140,130 190,100 240,65 290,35 290,170"
          fill="url(#savingsGrad)"
          className="auth-area-fade"
        />
        {/* Savings dots */}
        {[
          [40, 170],
          [90, 155],
          [140, 130],
          [190, 100],
          [240, 65],
          [290, 35],
        ].map(([cx, cy], i) => (
          <circle
            key={`s${i}`}
            cx={cx}
            cy={cy}
            r="3.5"
            fill="#34d399"
            className="auth-dot-pop"
            style={{ animationDelay: `${1.5 + i * 0.15}s` }}
          />
        ))}

        {/* Labels */}
        <text
          x="295"
          y="28"
          fontSize="10"
          fill="#34d399"
          fontWeight="600"
          textAnchor="end"
          className="auth-fade-in"
          style={{ animationDelay: "2.2s" }}
        >
          Savings ↑
        </text>
        <text
          x="295"
          y="185"
          fontSize="10"
          fill="#ef4444"
          fontWeight="600"
          textAnchor="end"
          className="auth-fade-in"
          style={{ animationDelay: "2.4s" }}
        >
          Debt ↓
        </text>
      </svg>

      {/* Legend card */}
      <div
        className="auth-fade-in-up mx-auto -mt-2 flex w-fit items-center gap-4 rounded-lg bg-white/10 px-4 py-2 text-[11px] backdrop-blur-sm"
        style={{ animationDelay: "2s" }}
      >
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-white/80">Savings</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          <span className="text-white/80">Debt</span>
        </span>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: TrendingDown,
    title: "Track Every Debt",
    description: "See your balances shrink in real time",
  },
  {
    icon: Target,
    title: "Set Clear Goals",
    description: "Plan your path to financial freedom",
  },
  {
    icon: PiggyBank,
    title: "Grow Savings",
    description: "Build the future you deserve",
  },
];

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ── Brand Panel ─────────────────────────────────────────────── */}
      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between">
        {/* Decorative blobs — animated pulse */}
        <div className="absolute -top-24 -left-24 h-72 w-72 animate-pulse rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -right-16 top-1/3 h-56 w-56 animate-pulse rounded-full bg-emerald-400/5 blur-3xl [animation-delay:1s]" />
        <div className="absolute -bottom-20 left-1/4 h-64 w-64 animate-pulse rounded-full bg-white/5 blur-2xl [animation-delay:2s]" />

        {/* Floating icons */}
        <FloatingIcon className="auth-float top-[18%] right-10 h-11 w-11 [animation-delay:0s]">
          <DollarSign className="h-5 w-5 text-emerald-300" />
        </FloatingIcon>
        <FloatingIcon className="auth-float top-[30%] left-14 h-10 w-10 [animation-delay:1.5s]">
          <Percent className="h-4 w-4 text-amber-300" />
        </FloatingIcon>
        <FloatingIcon className="auth-float bottom-[25%] right-16 h-10 w-10 [animation-delay:3s]">
          <Shield className="h-4 w-4 text-sky-300" />
        </FloatingIcon>
        <FloatingIcon className="auth-float bottom-[15%] left-10 h-11 w-11 [animation-delay:4.5s]">
          <TrendingUp className="h-5 w-5 text-emerald-300" />
        </FloatingIcon>

        {/* Top — Logo */}
        <div className="relative z-10 p-10">
          <span className="auth-fade-in text-2xl font-bold tracking-tight text-white">
            ClearPath
          </span>
        </div>

        {/* Center — Tagline + Chart + Features */}
        <div className="relative z-10 flex flex-1 flex-col justify-center gap-8 px-10">
          <div className="space-y-3">
            <h1 className="auth-fade-in-up text-4xl leading-tight font-bold text-white xl:text-5xl">
              Your journey to
              <br />
              <span className="text-emerald-300">debt-free living</span>
              <br />
              starts here.
            </h1>
            <p
              className="auth-fade-in-up max-w-sm text-base text-white/70"
              style={{ animationDelay: "0.15s" }}
            >
              Take control of your finances. Track debts, manage expenses, and
              watch your savings grow — all in one place.
            </p>
          </div>

          {/* Chart illustration */}
          <ChartIllustration />

          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, title, description }, i) => (
              <div
                key={title}
                className="auth-fade-in-up flex items-start gap-3"
                style={{ animationDelay: `${0.4 + i * 0.1}s` }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20">
                  <Icon className="h-4 w-4 text-emerald-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-sm text-white/60">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — Social proof / CTA hint */}
        <div
          className="auth-fade-in relative z-10 border-t border-white/10 px-10 py-6"
          style={{ animationDelay: "0.6s" }}
        >
          <div className="flex items-center gap-2 text-sm text-white/50">
            <ArrowRight className="h-4 w-4 text-emerald-300" />
            <span>Free to use. No credit card required.</span>
          </div>
        </div>
      </div>

      {/* ── Form Panel ──────────────────────────────────────────────── */}
      <div className="bg-background flex flex-col">
        {/* Mobile brand header */}
        <div className="flex items-center gap-2 border-b border-primary/10 bg-primary/[0.03] p-4 lg:hidden">
          <span className="text-lg font-bold tracking-tight text-foreground">
            ClearPath
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="auth-fade-in-up w-full max-w-[420px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
