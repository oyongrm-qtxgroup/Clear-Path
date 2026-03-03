import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Loader2, MailCheck, ArrowLeft } from "lucide-react";

import {
  forgotPasswordSchema,
  type ForgotPasswordForm,
} from "@/schemas/auth.schema";
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
import { withErrorBoundary } from "@/components/common";
import { AuthLayout } from "./AuthLayout";

// ── Anti-bot constants ─────────────────────────────────────────────────────
/** Minimum time (ms) a human would need to fill the forgot-password form. */
const MIN_SUBMIT_DELAY_MS = 1_500;

function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  // ── Bot / spam protection state ────────────────────────────────────────
  const [honeypot, setHoneypot] = useState("");
  const mountedAt = useRef(Date.now());

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: ForgotPasswordForm) {
    // ── Anti-bot checks ────────────────────────────────────────────────
    if (honeypot) {
      // Silently pretend success so bots think the email was sent
      setSubmitted(true);
      return;
    }

    const elapsed = Date.now() - mountedAt.current;
    if (elapsed < MIN_SUBMIT_DELAY_MS) {
      setSubmitted(true);
      return;
    }

    try {
      const success = await resetPassword(values.email);
      if (success) setSubmitted(true);
    } catch {
      // resetPassword already shows a toast with the error message.
    }
  }

  return (
    <AuthLayout>
      {submitted ? (
        /* ── Success state ────────────────────────────────────── */
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <MailCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Check your email
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            If an account exists for{" "}
            <span className="text-foreground font-medium">
              {form.getValues("email")}
            </span>
            , you&apos;ll receive a password reset link shortly.
          </p>

          <Separator className="my-6" />

          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      ) : (
        /* ── Form state ───────────────────────────────────────── */
        <>
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Reset password
            </h2>
            <p className="text-muted-foreground text-sm">
              Enter your email and we&apos;ll send you a link to reset your
              password.
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
                <label htmlFor="reset-website">Website</label>
                <input
                  id="reset-website"
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

              {/* Submit */}
              <Button
                type="submit"
                className="h-11 w-full bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring/30"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send Reset Link
              </Button>
            </form>
          </Form>

          <Separator className="my-6" />

          <p className="text-muted-foreground text-center text-sm">
            Remember your password?{" "}
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

export default withErrorBoundary(ForgotPasswordPage, "Forgot Password");
