import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { createTestQueryClient } from "@/test/setup";
import LoginPage from "../LoginPage";

// ---------------------------------------------------------------------------
// Mock react-router-dom's useNavigate
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// ---------------------------------------------------------------------------
// Mock the rate-limiter to always allow requests
// ---------------------------------------------------------------------------
vi.mock("@/api/rate-limiter.api", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ ok: true, remaining: 10 }),
  formatRetryAfter: vi.fn((s: number) => `${s} seconds`),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderLoginPage() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
const mockSignIn = supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockSignIn.mockReset();
  mockNavigate.mockReset();
  (toast.success as ReturnType<typeof vi.fn>).mockClear();
  (toast.error as ReturnType<typeof vi.fn>).mockClear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("LoginPage", () => {
  it("renders email and password inputs and a submit button", () => {
    renderLoginPage();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("shows validation errors when form is submitted empty", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("shows validation error when email is invalid format", async () => {
    renderLoginPage();

    // Set non-email value via fireEvent.change (avoids userEvent quirks)
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "not-an-email" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "validPass123" },
    });

    // Disable native HTML5 constraint validation so jsdom doesn't block
    // the submit event for the invalid type="email" input — we want Zod
    // (via react-hook-form's zodResolver) to handle validation instead.
    const form = screen
      .getByRole("button", { name: /sign in/i })
      .closest("form")!;
    form.noValidate = true;

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("calls supabase.auth.signInWithPassword with correct credentials on valid submit", async () => {
    mockSignIn.mockResolvedValueOnce({
      data: { session: { user: { id: "u1" } } },
      error: null,
    });

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("navigates to /dashboard on successful login", async () => {
    mockSignIn.mockResolvedValueOnce({
      data: { session: { user: { id: "u1" } } },
      error: null,
    });

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error toast when Supabase returns an auth error", async () => {
    // Return an actual Error instance so useAuth's `err instanceof Error` is true
    const authError = new Error("Invalid login credentials");
    mockSignIn.mockResolvedValueOnce({
      data: { session: null },
      error: authError,
    });

    // useAuth.signIn re-throws after toasting; LoginPage.onSubmit doesn't catch
    // it, producing an unhandled rejection. Swallow it to keep the runner clean.
    const onReject = vi.fn();
    process.once("unhandledRejection", onReject);

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid login credentials");
    });

    // Should NOT navigate on failure
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("disables the submit button while the request is in flight", async () => {
    // Keep the sign-in promise pending so we can assert the disabled state
    let resolveSignIn!: (value: unknown) => void;
    mockSignIn.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      }),
    );

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    // Button should become disabled while in flight
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();
    });

    // Resolve to clean up
    resolveSignIn({ data: { session: { user: { id: "u1" } } }, error: null });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /sign in/i }),
      ).not.toBeDisabled();
    });
  });
});
