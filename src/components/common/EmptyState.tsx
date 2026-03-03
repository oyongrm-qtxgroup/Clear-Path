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
import { Illustration, type IllustrationName } from "./Illustration";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  illustration?: IllustrationName;
  action?: { label: string; onClick: () => void };
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  illustration,
  action,
  children,
}: EmptyStateProps) {
  return (
    <Card className="mx-auto w-full max-w-md border-dashed text-center glass-card">
      <CardHeader>
        <div className="flex justify-center">
          {illustration ? (
            <Illustration name={illustration} size="sm" />
          ) : (
            <Icon className="text-muted-foreground size-10" />
          )}
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
