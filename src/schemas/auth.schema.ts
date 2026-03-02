import { z } from "zod";

// ── Login ────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ── Register ─────────────────────────────────────────────────────────────────
export const registerSchema = loginSchema
  .extend({
    confirm_password: z.string().min(8, "Please confirm your password"),
    display_name: z
      .string()
      .min(1, "Display name is required")
      .max(100, "Display name is too long"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

// ── Forgot Password ─────────────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// ── Inferred types ───────────────────────────────────────────────────────────
export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
