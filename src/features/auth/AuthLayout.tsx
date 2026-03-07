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
import { Illustration } from "@/components/common";

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
      <div className="relative hidden overflow-hidden gradient-bg lg:flex lg:flex-col lg:justify-between">
        {/* Decorative blobs — animated pulse */}
        <div className="absolute -top-24 -left-24 h-72 w-72 animate-pulse rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -right-16 top-1/3 h-56 w-56 animate-pulse rounded-full bg-brand-light/5 blur-3xl [animation-delay:1s]" />
        <div className="absolute -bottom-20 left-1/4 h-64 w-64 animate-pulse rounded-full bg-white/5 blur-2xl [animation-delay:2s]" />

        {/* Floating icons */}
        <FloatingIcon className="auth-float top-[18%] right-10 h-11 w-11 [animation-delay:0s]">
          <DollarSign className="h-5 w-5 text-brand-light" />
        </FloatingIcon>
        <FloatingIcon className="auth-float top-[30%] left-14 h-10 w-10 [animation-delay:1.5s]">
          <Percent className="h-4 w-4 text-warning-light" />
        </FloatingIcon>
        <FloatingIcon className="auth-float bottom-[25%] right-16 h-10 w-10 [animation-delay:3s]">
          <Shield className="h-4 w-4 text-brand" />
        </FloatingIcon>
        <FloatingIcon className="auth-float bottom-[15%] left-10 h-11 w-11 [animation-delay:4.5s]">
          <TrendingUp className="h-5 w-5 text-brand-light" />
        </FloatingIcon>

        {/* Top — Logo */}
        <div className="relative z-10 p-10">
          <div className="auth-fade-in flex items-center gap-3">
            <img src="/logo-512x512.png" alt="" className="h-10 w-10" />
            <span className="text-2xl font-bold tracking-tight text-white">
              ClearPath
            </span>
          </div>
        </div>

        {/* Center — Tagline + Chart + Features */}
        <div className="relative z-10 flex flex-1 flex-col justify-center gap-8 px-10">
          <div className="space-y-3">
            <h1 className="auth-fade-in-up text-4xl leading-tight font-bold text-white xl:text-5xl">
              Your journey to
              <br />
              <span className="text-brand-light">debt-free living</span>
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

          {/* Auth illustration */}
          <div className="auth-fade-in-up flex flex-col items-center">
            <Illustration
              name="auth"
              size="lg"
              className="text-white/30 dark:text-white/20"
            />
          </div>

          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, title, description }, i) => (
              <div
                key={title}
                className="auth-fade-in-up flex items-start gap-3"
                style={{ animationDelay: `${0.4 + i * 0.1}s` }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20">
                  <Icon className="h-4 w-4 text-brand-light" />
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
            <ArrowRight className="h-4 w-4 text-brand-light" />
            <span>Free to use. No credit card required.</span>
          </div>
        </div>
      </div>

      {/* ── Form Panel ──────────────────────────────────────────────── */}
      <div className="bg-background flex flex-col">
        {/* Mobile brand header */}
        <div className="flex items-center gap-2 border-b border-primary/10 bg-primary/[0.03] p-4 lg:hidden">
          <img src="/logo-192x192.png" alt="" className="h-7 w-7" />
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
