import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, MailCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { registerSchema, type RegisterForm } from "@/schemas/auth.schema";
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
/** Minimum time (ms) a human would need to fill the form. */
const MIN_SUBMIT_DELAY_MS = 3_000;

function RegisterPage() {
  const { signUp } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  // ── Bot / spam protection state ────────────────────────────────────────
  /** Honeypot — invisible field that only bots fill in. */
  const [honeypot, setHoneypot] = useState("");
  /** Timestamp when the component mounted (timing check). */
  const mountedAt = useRef(Date.now());

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      display_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: RegisterForm) {
    // ── Anti-bot checks ────────────────────────────────────────────────
    if (honeypot) {
      // Silently reject — don't reveal that we detected a bot
      toast.success("Check your email to confirm your account");
      setSubmitted(true);
      return;
    }

    const elapsed = Date.now() - mountedAt.current;
    if (elapsed < MIN_SUBMIT_DELAY_MS) {
      // Form submitted suspiciously fast — likely automated
      toast.success("Check your email to confirm your account");
      setSubmitted(true);
      return;
    }

    try {
      const success = await signUp(
        values.email,
        values.password,
        values.display_name,
      );
      if (success) setSubmitted(true);
    } catch {
      // signUp already shows a toast with the error message.
    }
  }

  return (
    <AuthLayout>
      {submitted ? (
        /* ── Success / confirmation state ──────────────────────── */
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/15 dark:bg-success/20">
            <MailCheck className="h-8 w-8 text-success dark:text-success-light" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Check your email
          </h2>

          <p className="text-muted-foreground mt-2 max-w-xs text-sm">
            We sent a confirmation link to{" "}
            <span className="text-foreground font-medium">
              {form.getValues("email")}
            </span>
            . Click the link in the email to activate your account.
          </p>

          <p className="text-muted-foreground mt-4 text-xs">
            Didn&apos;t get it? Check your spam folder or try signing up again
            in a few minutes.
          </p>

          <Separator className="my-6 w-full" />

          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      ) : (
        /* ── Registration form ────────────────────────────────── */
        <>
          {/* Header */}
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Create account
            </h2>
            <p className="text-muted-foreground text-sm">
              Start your journey to financial freedom today.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Honeypot — visually hidden, aria-hidden, tabindex -1 */}
              <div
                aria-hidden="true"
                className="absolute h-0 w-0 overflow-hidden"
                style={{ position: "absolute", left: "-9999px" }}
              >
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  name="website"
                  type="text"
                  autoComplete="off"
                  tabIndex={-1}
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {/* Display Name */}
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        disabled={isSubmitting}
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    <FormLabel>Password</FormLabel>
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

              {/* Confirm Password */}
              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
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
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Create Account
              </Button>
            </form>
          </Form>

          <Separator className="my-6" />

          <p className="text-muted-foreground text-center text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Sign in
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}

export default withErrorBoundary(RegisterPage, "Register");
