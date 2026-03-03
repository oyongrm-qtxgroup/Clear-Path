import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  Receipt,
  PiggyBank,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";

import { useAuth, useNetworkStatus, useProfile } from "@/hooks";
import { PreDeploymentChecklist, ConfirmDialog } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// ── Navigation items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/budget", label: "Budget", icon: Wallet },
  { to: "/debts", label: "Debts", icon: CreditCard },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/savings", label: "Savings", icon: PiggyBank },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

// ── Shared NavLink renderer ──────────────────────────────────────────────────
function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-white/15 text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white",
            )
          }
        >
          <Icon className="size-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

// ── Helper: initials from display name ────────────────────────────────────────
function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Sidebar footer (user info + sign out) ────────────────────────────────────
function SidebarFooter() {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleSignOut() {
    setConfirmOpen(false);
    const success = await signOut();
    if (success) {
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="h-px bg-white/15" />
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="size-7 shrink-0">
            <AvatarFallback className="bg-white/20 text-white text-[10px] font-semibold">
              {getInitials(profile?.display_name)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm text-white/70">
            {profile?.display_name ?? "User"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setConfirmOpen(true)}
          aria-label="Sign out"
          className="text-white/70 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-4" />
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onConfirm={handleSignOut}
        onCancel={() => setConfirmOpen(false)}
        title="Sign out?"
        description="Are you sure you want to sign out of your account?"
        confirmLabel="Sign Out"
      />
    </div>
  );
}

// ── Desktop sidebar ──────────────────────────────────────────────────────────
function DesktopSidebar() {
  return (
    <aside className="hidden h-screen w-60 flex-col bg-sidebar md:flex sticky top-0">
      <div className="flex h-14 items-center px-4">
        <span className="text-lg font-bold tracking-tight text-white">
          ClearPath
        </span>
      </div>
      <div className="h-px bg-white/15" />
      <div className="flex flex-1 flex-col justify-between p-3">
        <SidebarNav />
        <SidebarFooter />
      </div>
    </aside>
  );
}

// ── Mobile top bar + sheet ───────────────────────────────────────────────────
function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-14 items-center border-b border-primary/10 bg-primary/[0.03] px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-primary">
            <Menu className="size-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 bg-sidebar p-0 border-none">
          <SheetHeader className="h-14 justify-center px-4">
            <SheetTitle className="text-lg font-bold tracking-tight text-white">
              ClearPath
            </SheetTitle>
          </SheetHeader>
          <div className="h-px bg-white/15" />
          <div className="flex flex-1 flex-col justify-between p-3">
            <SidebarNav onNavigate={() => setOpen(false)} />
            <SidebarFooter />
          </div>
        </SheetContent>
      </Sheet>
      <span className="ml-3 text-lg font-bold tracking-tight text-foreground">
        ClearPath
      </span>
    </header>
  );
}

// ── Main layout ──────────────────────────────────────────────────────────────
export function AppLayout() {
  // Surface offline / online toast notifications app-wide
  useNetworkStatus();

  return (
    <div className="flex min-h-screen">
      <DesktopSidebar />
      <div className="flex flex-1 flex-col">
        <MobileNav />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      <PreDeploymentChecklist />
    </div>
  );
}
