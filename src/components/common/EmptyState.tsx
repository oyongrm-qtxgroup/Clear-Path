import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <Card className="mx-auto w-full max-w-md border-dashed text-center">
      <CardHeader>
        <div className="flex justify-center">
          <Icon className="text-muted-foreground size-10" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {(action || children) && (
        <CardContent className="flex flex-col items-center gap-3">
          {action && <Button onClick={action.onClick}>{action.label}</Button>}
          {children}
        </CardContent>
      )}
    </Card>
  );
}
