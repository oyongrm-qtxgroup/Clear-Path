import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { loginSchema, type LoginForm } from "@/schemas/auth.schema";
import { useAuth } from "@/hooks";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { withErrorBoundary, PasswordInput } from "@/components/common";
import { AuthLayout } from "./AuthLayout";

// ── Anti-bot constants ─────────────────────────────────────────────────────
/** Minimum time (ms) a human would need to fill the login form. */
const MIN_SUBMIT_DELAY_MS = 2_000;

function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  // ── Bot / spam protection state ────────────────────────────────────────
  const [honeypot, setHoneypot] = useState("");
  const mountedAt = useRef(Date.now());

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: LoginForm) {
    // ── Anti-bot checks ────────────────────────────────────────────────
    if (honeypot) {
      // Silently reject — fake a generic error so bots don't learn anything
      toast.error("Invalid email or password");
      return;
    }

    const elapsed = Date.now() - mountedAt.current;
    if (elapsed < MIN_SUBMIT_DELAY_MS) {
      toast.error("Invalid email or password");
      return;
    }

    try {
      const success = await signIn(values.email, values.password);
      if (success) navigate("/dashboard");
    } catch {
      // signIn already shows a toast with the error message.
    }
  }

  return (
    <AuthLayout>
      {/* Header */}
      <div className="mb-8 space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="text-muted-foreground text-sm">
          Sign in to continue managing your finances.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Honeypot — visually hidden, aria-hidden, tabindex -1 */}
          <div
            aria-hidden="true"
            className="absolute h-0 w-0 overflow-hidden"
            style={{ position: "absolute", left: "-9999px" }}
          >
            <label htmlFor="login-website">Website</label>
            <input
              id="login-website"
              name="website"
              type="text"
              autoComplete="off"
              tabIndex={-1}
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>
          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    disabled={isSubmitting}
                    className="h-11"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-brand-dark underline underline-offset-4 hover:text-brand dark:text-brand-light dark:hover:text-brand"
                    tabIndex={-1}
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    className="h-11"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit */}
          <Button
            type="submit"
            className="h-11 w-full bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring/30"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            Sign In
          </Button>
        </form>
      </Form>

      <Separator className="my-6" />

      <p className="text-muted-foreground text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}

export default withErrorBoundary(LoginPage, "Login");
