import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  PiggyBank,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";

import { useAuth, useNetworkStatus, useProfile } from "@/hooks";
import { PreDeploymentChecklist } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
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

// ── Sidebar footer (user info + sign out) ────────────────────────────────────
function SidebarFooter() {
  const { signOut } = useAuth();
  const { profile } = useProfile();

  return (
    <div className="flex flex-col gap-2">
      <Separator />
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-muted-foreground truncate text-sm">
          {profile?.display_name ?? "User"}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => void signOut()}
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Desktop sidebar ──────────────────────────────────────────────────────────
function DesktopSidebar() {
  return (
    <aside className="bg-background hidden h-screen w-60 flex-col border-r md:flex">
      <div className="flex h-14 items-center px-4">
        <span className="text-lg font-bold tracking-tight">ClearPath</span>
      </div>
      <Separator />
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
    <header className="bg-background flex h-14 items-center border-b px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="size-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <SheetHeader className="h-14 justify-center px-4">
            <SheetTitle className="text-lg font-bold tracking-tight">
              ClearPath
            </SheetTitle>
          </SheetHeader>
          <Separator />
          <div className="flex flex-1 flex-col justify-between p-3">
            <SidebarNav onNavigate={() => setOpen(false)} />
            <SidebarFooter />
          </div>
        </SheetContent>
      </Sheet>
      <span className="ml-3 text-lg font-bold tracking-tight">ClearPath</span>
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
