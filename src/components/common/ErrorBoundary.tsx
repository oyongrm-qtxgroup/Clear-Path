import {
  Component,
  useCallback,
  useState,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { AlertTriangle } from "lucide-react";

import { Sentry } from "@/lib/sentry";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ── Types ────────────────────────────────────────────────────────────────────
type FallbackRender = (props: { error: Error; reset: () => void }) => ReactNode;

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | FallbackRender;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ── Class-based ErrorBoundary ────────────────────────────────────────────────
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === "function"
          ? this.props.fallback({
              error: this.state.error!,
              reset: this.handleRetry,
            })
          : this.props.fallback;
      }

      return (
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="flex justify-center">
                <AlertTriangle className="text-destructive size-10" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={this.handleRetry} className="w-full">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// ── HOC ──────────────────────────────────────────────────────────────────────
export function withErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  pageTitle: string,
) {
  function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary
        fallback={({ reset }) => (
          <div className="flex min-h-[50vh] items-center justify-center p-6">
            <Card className="w-full max-w-md text-center">
              <CardHeader>
                <div className="flex justify-center">
                  <AlertTriangle className="text-destructive size-10" />
                </div>
                <CardTitle className="text-xl">{pageTitle}</CardTitle>
                <CardDescription>
                  Something went wrong on this page. Please try again.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={reset} className="w-full">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  }

  WithErrorBoundary.displayName = `withErrorBoundary(${
    WrappedComponent.displayName ?? WrappedComponent.name ?? "Component"
  })`;

  return WithErrorBoundary;
}

// ── Hook for async errors ────────────────────────────────────────────────────
/**
 * Returns a `handleError` function that, when called with an error,
 * reports it to Sentry and re-throws to trigger the nearest ErrorBoundary.
 *
 * Usage:
 * ```ts
 * const handleError = useErrorHandler();
 * try { await someAsyncWork(); } catch (err) { handleError(err); }
 * ```
 */
export function useErrorHandler() {
  const [, setState] = useState();

  const handleError = useCallback((error: unknown) => {
    const err = error instanceof Error ? error : new Error(String(error));
    Sentry.captureException(err);

    // Re-throw inside a state updater so React catches it during render
    // and the nearest ErrorBoundary can handle it.
    setState(() => {
      throw err;
    });
  }, []);

  return handleError;
}
