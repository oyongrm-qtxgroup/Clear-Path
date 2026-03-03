import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  User,
  Globe,
  Palette,
  Shield,
  Download,
  Loader2,
  Moon,
  Sun,
  Monitor,
  LogOut,
  Trash2,
  Wallet,
} from "lucide-react";

import { useAuth, useProfile } from "@/hooks";
import { supabase } from "@/lib/supabase";
import { QUERY_KEYS } from "@/constants";
import {
  profileSchema,
  changePasswordSchema,
  type ProfileForm,
  type ChangePasswordForm,
} from "@/schemas/auth.schema";
import { PageHeader, ConfirmDialog } from "@/components/common";
import { withErrorBoundary } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// ── Constants ────────────────────────────────────────────────────────────────
const CURRENCIES = [
  { value: "PHP", label: "PHP — Philippine Peso" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "KRW", label: "KRW — South Korean Won" },
  { value: "INR", label: "INR — Indian Rupee" },
] as const;

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Profile Section ──────────────────────────────────────────────────────────
function ProfileSection() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { display_name: "" },
  });

  // Sync profile data into form when loaded
  useEffect(() => {
    if (profile?.display_name) {
      form.reset({ display_name: profile.display_name });
    }
  }, [profile, form]);

  const { isSubmitting } = form.formState;

  async function onSubmit(values: ProfileForm) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: values.display_name })
        .eq("id", user!.id);
      if (error) throw error;

      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.auth.profile,
      });
      toast.success("Profile updated!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile";
      toast.error(message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <User className="size-5 text-primary" />
          <div>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Manage your display name and account info
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {getInitials(profile?.display_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">
              {profile?.display_name ?? "User"}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={user?.email ?? ""} disabled className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed here.
              </p>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ── Currency Section ─────────────────────────────────────────────────────────
function CurrencySection() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const handleCurrencyChange = useCallback(
    async (value: string) => {
      setSaving(true);
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ currency: value })
          .eq("id", user!.id);
        if (error) throw error;

        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.auth.profile,
        });
        toast.success(`Currency updated to ${value}`);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update currency";
        toast.error(message);
      } finally {
        setSaving(false);
      }
    },
    [user, queryClient],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Globe className="size-5 text-primary" />
          <div>
            <CardTitle>Currency</CardTitle>
            <CardDescription>
              Choose your preferred currency for displaying amounts
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-w-xs">
          <Select
            value={profile?.currency ?? "PHP"}
            onValueChange={handleCurrencyChange}
            disabled={saving}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Income Section ───────────────────────────────────────────────────────────
function IncomeSection() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [incomeValue, setIncomeValue] = useState("");

  // Sync profile data when loaded
  useEffect(() => {
    if (profile?.monthly_income !== undefined) {
      setIncomeValue(
        profile.monthly_income > 0 ? String(profile.monthly_income) : "",
      );
    }
  }, [profile]);

  async function handleSave() {
    const amount = parseFloat(incomeValue) || 0;
    if (amount < 0) {
      toast.error("Income cannot be negative");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ monthly_income: amount })
        .eq("id", user!.id);
      if (error) throw error;

      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.auth.profile,
      });
      toast.success("Monthly income updated!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update income";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Wallet className="size-5 text-primary" />
          <div>
            <CardTitle>Monthly Income</CardTitle>
            <CardDescription>
              Set your default monthly salary/income for budget calculations
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3 max-w-xs">
          <div className="flex-1">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 100000"
              value={incomeValue}
              onChange={(e) => setIncomeValue(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          This is used as the default on the Monthly Budget page. You can
          override it per-month.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Appearance Section ────────────────────────────────────────────────────────
function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "system", label: "System", icon: Monitor },
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Palette className="size-5 text-primary" />
          <div>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how ClearPath looks on your device
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 px-6 py-4 transition-colors ${
                theme === value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <Icon
                className={`size-5 ${
                  theme === value ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  theme === value ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Security Section (Change Password) ───────────────────────────────────────
function SecuritySection() {
  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { new_password: "", confirm_password: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: ChangePasswordForm) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.new_password,
      });
      if (error) throw error;

      form.reset();
      toast.success("Password updated successfully!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update password";
      toast.error(message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Shield className="size-5 text-primary" />
          <div>
            <CardTitle>Security</CardTitle>
            <CardDescription>Update your password</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ── Data Export Section ───────────────────────────────────────────────────────
function DataExportSection() {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);

  async function handleExport(format: "json" | "csv") {
    if (!user) return;
    setExporting(true);

    try {
      // Fetch all user data in parallel
      const [debtsRes, expensesRes, savingsRes, paymentsRes] =
        await Promise.all([
          supabase.from("debts").select("*").eq("user_id", user.id),
          supabase.from("expenses").select("*").eq("user_id", user.id),
          supabase.from("savings_goals").select("*").eq("user_id", user.id),
          supabase.from("debt_payments").select("*").eq("user_id", user.id),
        ]);

      const data = {
        exportedAt: new Date().toISOString(),
        debts: debtsRes.data ?? [],
        debtPayments: paymentsRes.data ?? [],
        expenses: expensesRes.data ?? [],
        savingsGoals: savingsRes.data ?? [],
      };

      let blob: Blob;
      let filename: string;

      if (format === "json") {
        blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        filename = `clearpath-export-${new Date().toISOString().split("T")[0]}.json`;
      } else {
        // Convert to CSV — one sheet per table
        const sections: string[] = [];

        for (const [key, rows] of Object.entries(data)) {
          if (key === "exportedAt" || !Array.isArray(rows) || rows.length === 0)
            continue;
          const headers = Object.keys(rows[0]);
          const csvRows = [
            `--- ${key} ---`,
            headers.join(","),
            ...rows.map((row: Record<string, unknown>) =>
              headers
                .map((h) => {
                  const val = row[h];
                  const str = val == null ? "" : String(val);
                  return str.includes(",") ? `"${str}"` : str;
                })
                .join(","),
            ),
          ];
          sections.push(csvRows.join("\n"));
        }

        blob = new Blob([sections.join("\n\n")], { type: "text/csv" });
        filename = `clearpath-export-${new Date().toISOString().split("T")[0]}.csv`;
      }

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed";
      toast.error(message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Download className="size-5 text-primary" />
          <div>
            <CardTitle>Data Export</CardTitle>
            <CardDescription>Download all your financial data</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Export your debts, expenses, savings goals, and payment history.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            disabled={exporting}
            onClick={() => handleExport("json")}
          >
            {exporting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Export as JSON
          </Button>
          <Button
            variant="outline"
            disabled={exporting}
            onClick={() => handleExport("csv")}
          >
            {exporting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Export as CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Account Section (Sign Out / Delete) ──────────────────────────────────────
function AccountSection() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSignOut() {
    setSignOutOpen(false);
    const success = await signOut();
    if (success) {
      navigate("/login", { replace: true });
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      // Delete user data from all tables (RLS ensures own data only)
      const { user } = (await supabase.auth.getUser()).data;
      if (!user) throw new Error("Not authenticated");

      await Promise.all([
        supabase.from("debt_payments").delete().eq("user_id", user.id),
        supabase.from("expense_checks").delete().eq("user_id", user.id),
        supabase.from("savings_logs").delete().eq("user_id", user.id),
      ]);

      await Promise.all([
        supabase.from("debts").delete().eq("user_id", user.id),
        supabase.from("expenses").delete().eq("user_id", user.id),
        supabase.from("savings_goals").delete().eq("user_id", user.id),
      ]);

      await supabase.from("profiles").delete().eq("id", user.id);

      // Sign out after deleting data
      await signOut();
      toast.success("Account data deleted. You have been signed out.");
      navigate("/login", { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete account";
      toast.error(message);
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <LogOut className="size-5 text-primary" />
            <div>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account and session</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sign Out */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sign Out</p>
              <p className="text-sm text-muted-foreground">
                End your current session
              </p>
            </div>
            <Button variant="outline" onClick={() => setSignOutOpen(true)}>
              <LogOut className="mr-2 size-4" />
              Sign Out
            </Button>
          </div>

          <Separator />

          {/* Danger Zone */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-destructive">
                Delete Account
              </p>
              <p className="text-sm text-muted-foreground">
                Permanently delete all your data. This cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 size-4" />
              )}
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={signOutOpen}
        onConfirm={handleSignOut}
        onCancel={() => setSignOutOpen(false)}
        title="Sign out?"
        description="Are you sure you want to sign out of your account?"
        confirmLabel="Sign Out"
      />

      <ConfirmDialog
        open={deleteOpen}
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteOpen(false)}
        title="Delete account?"
        description="This will permanently delete all your debts, expenses, savings goals, and payment history. This action cannot be undone."
        confirmLabel="Delete Everything"
        destructive
      />
    </>
  );
}

// ── Main Settings Page ───────────────────────────────────────────────────────
function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account preferences"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile — tall card with avatar + form, full width */}
        <div className="lg:col-span-2">
          <ProfileSection />
        </div>

        {/* Currency & Income — side by side */}
        <CurrencySection />
        <IncomeSection />

        {/* Appearance — full width */}
        <div className="lg:col-span-2">
          <AppearanceSection />
        </div>

        {/* Security & Data Export — medium content, side by side */}
        <SecuritySection />
        <DataExportSection />

        {/* Account — danger zone, full width */}
        <div className="lg:col-span-2">
          <AccountSection />
        </div>
      </div>
    </div>
  );
}

export default withErrorBoundary(SettingsPage, "Settings");
