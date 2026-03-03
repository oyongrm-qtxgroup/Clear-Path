import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  RefreshCw,
  Rocket,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type CheckStatus = "pending" | "pass" | "fail" | "warn";

interface CheckItem {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
}

interface GrepHit {
  file: string;
  line: number;
  text: string;
}

// ── Required env vars (sourced from .env.example) ────────────────────────────

const REQUIRED_ENV_VARS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_SENTRY_DSN",
  "VITE_APP_ENV",
] as const;

// ── Individual check runners ─────────────────────────────────────────────────

function checkEnvVars(): CheckItem {
  const missing = REQUIRED_ENV_VARS.filter((key) => !import.meta.env[key]);

  if (missing.length === 0) {
    return { id: "env", label: "All .env variables are set", status: "pass" };
  }

  return {
    id: "env",
    label: "All .env variables are set",
    status: "fail",
    detail: `Missing: ${missing.join(", ")}`,
  };
}

function checkSentryDsn(): CheckItem {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  if (dsn && dsn.startsWith("https://")) {
    return {
      id: "sentry",
      label: "Sentry DSN is configured",
      status: "pass",
    };
  }

  return {
    id: "sentry",
    label: "Sentry DSN is configured",
    status: "fail",
    detail: dsn
      ? "DSN does not look like a valid Sentry URL"
      : "VITE_SENTRY_DSN is empty",
  };
}

async function checkRlsPolicies(): Promise<CheckItem> {
  try {
    // Query information_schema for tables without RLS enabled.
    // pg_tables exposes `rowsecurity` which is true when RLS is ON.
    const { data, error } = await supabase.rpc(
      "get_tables_without_rls" as never,
    );

    // If the RPC doesn't exist yet, fall back to a raw query via postgrest.
    if (error) {
      // Attempt a direct information_schema query through the REST API.
      const { data: tables, error: isError } = await supabase
        .from("pg_tables" as never)
        .select("tablename, rowsecurity")
        .eq("schemaname", "public");

      if (isError) {
        return {
          id: "rls",
          label: "Supabase RLS enabled on all tables",
          status: "warn",
          detail:
            "Cannot query pg_tables via PostgREST. Verify RLS manually in the Supabase dashboard or expose a `get_tables_without_rls` RPC.",
        };
      }

      const unprotected = (
        tables as { tablename: string; rowsecurity: boolean }[]
      )?.filter((t) => !t.rowsecurity);

      if (!unprotected || unprotected.length === 0) {
        return {
          id: "rls",
          label: "Supabase RLS enabled on all tables",
          status: "pass",
        };
      }

      return {
        id: "rls",
        label: "Supabase RLS enabled on all tables",
        status: "fail",
        detail: `Tables without RLS: ${unprotected.map((t) => t.tablename).join(", ")}`,
      };
    }

    const unprotected = data as { tablename: string }[] | null;

    if (!unprotected || unprotected.length === 0) {
      return {
        id: "rls",
        label: "Supabase RLS enabled on all tables",
        status: "pass",
      };
    }

    return {
      id: "rls",
      label: "Supabase RLS enabled on all tables",
      status: "fail",
      detail: `Tables without RLS: ${unprotected.map((t) => t.tablename).join(", ")}`,
    };
  } catch {
    return {
      id: "rls",
      label: "Supabase RLS enabled on all tables",
      status: "warn",
      detail:
        "Check could not be completed — verify manually in the Supabase dashboard.",
    };
  }
}

async function checkConsoleLogs(): Promise<CheckItem> {
  try {
    const res = await fetch("/__dev-checks");
    const json = (await res.json()) as {
      consoleLogs: GrepHit[];
      todos: GrepHit[];
    };

    if (json.consoleLogs.length === 0) {
      return {
        id: "console",
        label: "No console.log statements in production code",
        status: "pass",
      };
    }

    return {
      id: "console",
      label: "No console.log statements in production code",
      status: "fail",
      detail: `${json.consoleLogs.length} occurrence(s) found:\n${json.consoleLogs
        .slice(0, 10)
        .map((h) => `  ${h.file}:${h.line}`)
        .join(
          "\n",
        )}${json.consoleLogs.length > 10 ? `\n  … and ${json.consoleLogs.length - 10} more` : ""}`,
    };
  } catch {
    return {
      id: "console",
      label: "No console.log statements in production code",
      status: "warn",
      detail:
        "Dev-checks endpoint unavailable. Ensure devChecksPlugin is loaded in vite.config.ts.",
    };
  }
}

async function checkTodos(): Promise<CheckItem> {
  try {
    const res = await fetch("/__dev-checks");
    const json = (await res.json()) as {
      consoleLogs: GrepHit[];
      todos: GrepHit[];
    };

    if (json.todos.length === 0) {
      return {
        id: "todos",
        label: "All TODO comments are resolved",
        status: "pass",
      };
    }

    return {
      id: "todos",
      label: "All TODO comments are resolved",
      status: "fail",
      detail: `${json.todos.length} TODO/FIXME(s) found:\n${json.todos
        .slice(0, 10)
        .map((h) => `  ${h.file}:${h.line} — ${h.text.slice(0, 80)}`)
        .join(
          "\n",
        )}${json.todos.length > 10 ? `\n  … and ${json.todos.length - 10} more` : ""}`,
    };
  } catch {
    return {
      id: "todos",
      label: "All TODO comments are resolved",
      status: "warn",
      detail:
        "Dev-checks endpoint unavailable. Ensure devChecksPlugin is loaded in vite.config.ts.",
    };
  }
}

// ── Status icon helper ───────────────────────────────────────────────────────

function StatusIcon({ status }: { status: CheckStatus }) {
  switch (status) {
    case "pass":
      return (
        <CheckCircle2 className="size-4 shrink-0 text-success dark:text-success-light" />
      );
    case "fail":
      return (
        <XCircle className="size-4 shrink-0 text-danger dark:text-danger-light" />
      );
    case "warn":
      return (
        <XCircle className="size-4 shrink-0 text-warning dark:text-warning-light" />
      );
    case "pending":
    default:
      return (
        <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
      );
  }
}

// ── Main component ───────────────────────────────────────────────────────────

/**
 * Dev-only pre-deployment checklist.
 *
 * Rendered as a collapsible floating panel in the bottom-right corner. Only
 * mounts when `VITE_APP_ENV === 'development'` (guarded at export time).
 */
function PreDeploymentChecklistInner() {
  const [checks, setChecks] = useState<CheckItem[]>([
    { id: "env", label: "All .env variables are set", status: "pending" },
    {
      id: "rls",
      label: "Supabase RLS enabled on all tables",
      status: "pending",
    },
    {
      id: "console",
      label: "No console.log statements in production code",
      status: "pending",
    },
    { id: "todos", label: "All TODO comments are resolved", status: "pending" },
    { id: "sentry", label: "Sentry DSN is configured", status: "pending" },
  ]);
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);

  const upsert = useCallback(
    (item: CheckItem) =>
      setChecks((prev) => prev.map((c) => (c.id === item.id ? item : c))),
    [],
  );

  const runAllChecks = useCallback(async () => {
    setRunning(true);

    // Reset all to pending
    setChecks((prev) =>
      prev.map((c) => ({
        ...c,
        status: "pending" as const,
        detail: undefined,
      })),
    );

    // Synchronous checks
    upsert(checkEnvVars());
    upsert(checkSentryDsn());

    // Async checks — run in parallel
    const [rls, consoleLogs, todos] = await Promise.all([
      checkRlsPolicies(),
      checkConsoleLogs(),
      checkTodos(),
    ]);

    upsert(rls);
    upsert(consoleLogs);
    upsert(todos);
    setRunning(false);
  }, [upsert]);

  // Run automatically on mount
  useEffect(() => {
    void runAllChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const passCount = checks.filter((c) => c.status === "pass").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const allPassed = passCount === checks.length;

  return (
    <div className="fixed right-4 bottom-4 z-50 w-[420px] max-w-[calc(100vw-2rem)]">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* ── Trigger bar ─────────────────────────────────────────────── */}
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm font-medium shadow-lg transition-colors",
              "bg-background hover:bg-accent",
              allPassed && !running && "border-success/50",
              failCount > 0 && !running && "border-danger/50",
            )}
          >
            <span className="flex items-center gap-2">
              <Rocket className="size-4" />
              Pre-deploy Checklist
            </span>
            <span className="flex items-center gap-2">
              {!running && (
                <Badge
                  variant={
                    allPassed
                      ? "success"
                      : failCount > 0
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {passCount}/{checks.length}
                </Badge>
              )}
              {running && <Loader2 className="size-3.5 animate-spin" />}
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  open && "rotate-180",
                )}
              />
            </span>
          </button>
        </CollapsibleTrigger>

        {/* ── Expanded body ───────────────────────────────────────────── */}
        <CollapsibleContent>
          <div className="bg-background mt-1 rounded-lg border p-4 shadow-lg">
            <ul className="space-y-3">
              {checks.map((check) => (
                <li key={check.id}>
                  <div className="flex items-start gap-2">
                    <StatusIcon status={check.status} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          check.status === "pass" &&
                            "text-success-dark dark:text-success-light",
                          check.status === "fail" &&
                            "text-danger-dark dark:text-danger-light",
                          check.status === "warn" &&
                            "text-warning dark:text-warning-light",
                        )}
                      >
                        {check.label}
                      </p>
                      {check.detail && (
                        <pre className="text-muted-foreground mt-1 max-h-28 overflow-auto whitespace-pre-wrap text-xs leading-relaxed">
                          {check.detail}
                        </pre>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <Separator className="my-3" />

            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs">
                {allPassed && !running
                  ? "All checks passed — ready to deploy!"
                  : running
                    ? "Running checks…"
                    : `${failCount} check(s) need attention`}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={running}
                onClick={() => void runAllChecks()}
              >
                <RefreshCw
                  className={cn("mr-1.5 size-3.5", running && "animate-spin")}
                />
                Re-run
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ── Gate: only render in development mode ────────────────────────────────────

export function PreDeploymentChecklist() {
  if (import.meta.env.VITE_APP_ENV !== "development") {
    return null;
  }

  return <PreDeploymentChecklistInner />;
}
