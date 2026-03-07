import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Wallet,
  CreditCard,
  Compass,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ONBOARDING_KEY = "clearpath-onboarding-complete";

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

export function markOnboardingComplete(): void {
  localStorage.setItem(ONBOARDING_KEY, "true");
}

export function resetOnboarding(): void {
  localStorage.removeItem(ONBOARDING_KEY);
}

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: { label: string; to: string };
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: "Welcome to ClearPath!",
    description:
      "ClearPath helps you take control of your finances — track debts, manage expenses, plan budgets, and grow your savings. Let's get you set up in a few quick steps.",
  },
  {
    icon: Wallet,
    title: "Set Your Monthly Income",
    description:
      "Head over to Settings to set your default monthly income. This will be used for your budget calculations each month.",
    action: { label: "Go to Settings", to: "/settings" },
  },
  {
    icon: CreditCard,
    title: "Add Your Debts",
    description:
      "Add your debts to start tracking payoff progress. ClearPath will calculate estimated payoff dates and help you stay on track.",
    action: { label: "Go to Debts", to: "/debts" },
  },
  {
    icon: Compass,
    title: "Explore Features",
    description:
      "Check out the Dashboard for an overview, the Budget page to plan monthly payments, Expenses for recurring bills, and Savings to set financial goals.",
    action: { label: "Go to Dashboard", to: "/dashboard" },
  },
  {
    icon: CheckCircle2,
    title: "You're All Set!",
    description:
      "You can always revisit this guide from Settings. Now go ahead and take control of your financial future!",
  },
];

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingWizard({ open, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const step = STEPS[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;

  function handleNext() {
    if (isLast) {
      markOnboardingComplete();
      onComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleSkip() {
    markOnboardingComplete();
    onComplete();
  }

  function handleAction() {
    if (step.action) {
      markOnboardingComplete();
      onComplete();
      navigate(step.action.to);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon className="size-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{step.title}</DialogTitle>
          <DialogDescription className="text-center">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex justify-center gap-1.5 py-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep
                  ? "w-6 bg-primary"
                  : i < currentStep
                    ? "w-1.5 bg-primary/40"
                    : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {step.action && (
            <Button variant="outline" className="w-full" onClick={handleAction}>
              {step.action.label}
            </Button>
          )}
          <div className="flex w-full gap-2">
            {!isFirst && !isLast && (
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setCurrentStep((s) => s - 1)}
              >
                Back
              </Button>
            )}
            {!isLast && !isFirst && (
              <Button variant="ghost" className="flex-1" onClick={handleSkip}>
                Skip
              </Button>
            )}
            <Button
              className={isFirst || isLast ? "w-full" : "flex-1"}
              onClick={handleNext}
            >
              {isLast ? "Get Started" : isFirst ? "Let's Go" : "Next"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
