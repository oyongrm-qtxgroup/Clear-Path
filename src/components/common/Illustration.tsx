import { cn } from "@/lib/utils";
import {
  SavingsIllustration,
  DebtIllustration,
  ExpenseIllustration,
  NoDataIllustration,
  DashboardIllustration,
  AuthIllustration,
} from "@/assets/illustrations";

const ILLUSTRATIONS = {
  savings: SavingsIllustration,
  debt: DebtIllustration,
  expense: ExpenseIllustration,
  "no-data": NoDataIllustration,
  dashboard: DashboardIllustration,
  auth: AuthIllustration,
} as const;

export type IllustrationName = keyof typeof ILLUSTRATIONS;

const SIZE_MAP = {
  sm: "w-32 h-32",
  md: "w-48 h-48",
  lg: "w-64 h-64",
} as const;

interface IllustrationProps {
  name: IllustrationName;
  size?: keyof typeof SIZE_MAP;
  className?: string;
}

export function Illustration({
  name,
  size = "md",
  className,
}: IllustrationProps) {
  const Component = ILLUSTRATIONS[name];

  return (
    <div
      className={cn(
        "text-brand dark:text-brand-light",
        SIZE_MAP[size],
        className,
      )}
    >
      <Component className="h-full w-full" />
    </div>
  );
}
