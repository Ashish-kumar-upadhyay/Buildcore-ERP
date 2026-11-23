import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { clearSession, readSession, type SessionUser } from "@/lib/api";
import {
  LayoutDashboard,
  Boxes,
  Users,
  TrendingUp,
  ChevronsLeft,
  Search,
  Bell,
  Building2,
  LogOut,
  Menu,
  Sun,
  Moon,
  ChevronDown,
  BarChart3,
  X,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import team from "@/assets/download.png";

const groups = [
  { label: "Overview", icon: LayoutDashboard, to: "/dashboard", children: [] },
  {
    label: "Inventory",
    icon: Boxes,
    to: "/inventory",
    children: [
      { to: "/vendors", label: "Vendors" },
      { to: "/purchases", label: "Purchase orders" },
      { to: "/transactions", label: "Stock history" },
      { to: "/low-stock", label: "Low-stock alerts" },
    ],
  },
  {
    label: "People & HR",
    icon: Users,
    to: "/hrms",
    children: [
      { to: "/employees", label: "Employees" },
      { to: "/attendance", label: "Attendance" },
      { to: "/leaves", label: "Leave requests" },
      { to: "/expenses", label: "Expenses" },
      { to: "/departments", label: "Departments" },
    ],
  },
  {
    label: "Sales",
    icon: TrendingUp,
    to: "/sales",
    children: [
      { to: "/customers", label: "Customers" },
      { to: "/representatives", label: "Sales team" },
      { to: "/leads", label: "Leads" },
      { to: "/quotations", label: "Quotations" },
      { to: "/sales-orders", label: "Sales orders" },
      { to: "/payments", label: "Payments" },
    ],
  },
  { label: "Reports", icon: BarChart3, to: "/reports", children: [] },
  { label: "Notifications", icon: Bell, to: "/notifications", children: [] },
] as const;
const destinations = groups.flatMap((g) => [{ to: g.to, label: g.label }, ...g.children]);
export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [person, setPerson] = useState<SessionUser | null>(null);
  const nav = useNavigate();
  useEffect(() => {
    const session = readSession();
    if (!session) {
      void nav({ to: "/login" });
      return;
    }
    setPerson(session.user);
  }, [nav]);
  const reduced = useReducedMotion();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const side = (compact: boolean) => (
    <div className="erp-sidebar-inner">
      <Link to="/" className="erp-brand">
        <Building2 />
        {!compact && (
          <div>
            <strong>
              BUILDCORE <span>ERP</span>
            </strong>
            <small>SMARTER MANAGEMENT</small>
          </div>
        )}
      </Link>
      {!compact && (
        <div className="erp-workspace-label">
          <span className="erp-workspace-avatar">B</span>
          <div>
            <strong>BuildCore workspace</strong>
            <small>Indore · Warehouse A</small>
          </div>
        </div>
      )}
      <nav className="erp-nav" aria-label="ERP navigation">
        {groups.map((g) => {
          const active = path === g.to || g.children.some((c) => c.to === path);
          const open = expanded.includes(g.to) || active;
          return (
            <div key={g.to}>
              <div className="erp-nav-group">
                <Link
                  title={g.label}
                  to={g.to}
                  onClick={() => setMobile(false)}
                  className={cn("erp-nav-link", active && "erp-nav-active")}
                >
                  <g.icon />
                  {!compact && <span>{g.label}</span>}
                </Link>
                {!compact && g.children.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Toggle ${g.label} menu`}
                    className="erp-nav-expand"
                    onClick={() =>
                      setExpanded((old) =>
                        old.includes(g.to) ? old.filter((s) => s !== g.to) : [...old, g.to],
                      )
                    }
                  >
                    <ChevronDown className={cn(open && "rotate-180")} />
                  </Button>
                )}
              </div>
              {!compact && open && g.children.length > 0 && (
                <div className="erp-subnav">
                  {g.children.map((c) => (
                    <Link
                      key={c.to}
                      to={c.to}
                      onClick={() => setMobile(false)}
                      className={cn(path === c.to && "erp-subnav-active")}
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="erp-sidebar-bottom">
        {!compact && (
          <div className="erp-sidebar-photo">
            <img src={team} alt="BuildCore team" />
            <div>
              <strong>Better, together.</strong>
              <Link to="/">
                Visit home
                <ArrowUpRight />
              </Link>
            </div>
          </div>
        )}
        <Button asChild variant="ghost" className="justify-start">
          <Link
            to="/login"
            onClick={() => {
              clearSession();
            }}
          >
            <LogOut />
            {!compact && "Sign out"}
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="hidden justify-start lg:inline-flex"
          aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronsLeft className={cn(compact && "rotate-180")} />
          {!compact && "Collapse"}
        </Button>
      </div>
    </div>
  );
  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("erp-page", dark && "login-night")}>
        <motion.aside
          animate={{ width: collapsed ? 76 : 238 }}
          transition={{ duration: reduced ? 0 : 0.25 }}
          className="erp-sidebar"
        >
          {side(collapsed)}
        </motion.aside>
        <AnimatePresence>
          {mobile && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="erp-mobile-overlay"
                onClick={() => setMobile(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                className="erp-mobile-sidebar"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close navigation"
                  className="erp-mobile-close"
                  onClick={() => setMobile(false)}
                >
                  <X />
                </Button>
                {side(false)}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
        <div className="erp-main">
          <header className="erp-topbar">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </Button>
            <div className="erp-global-search">
              <Search />
              <input
                aria-label="Search pages"
                placeholder="Search your workspace…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <div className="erp-search-results">
                  {destinations
                    .filter((d) => d.label.toLowerCase().includes(search.toLowerCase()))
                    .map((d) => (
                      <Link key={d.to} to={d.to} onClick={() => setSearch("")}>
                        {d.label}
                        <ArrowUpRight />
                      </Link>
                    ))}
                  {!destinations.some((d) =>
                    d.label.toLowerCase().includes(search.toLowerCase()),
                  ) && <p>No matching pages</p>}
                </div>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="home-theme">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Light theme"
                  aria-pressed={!dark}
                  onClick={() => setDark(false)}
                >
                  <Sun />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Dark theme"
                  aria-pressed={dark}
                  onClick={() => setDark(true)}
                >
                  <Moon />
                </Button>
              </div>
              <Button asChild variant="ghost" size="icon" aria-label="View notifications">
                <Link to="/notifications">
                  <Bell />
                </Link>
              </Button>
              <div className="erp-user">
                <span>
                  {(person?.name ?? "Ishaan Arora")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <div>
                  <strong>{person?.name ?? "Ishaan Arora"}</strong>
                  <small>{person?.role === "Admin" || !person ? "Administrator" : person.role}</small>
                </div>
              </div>
            </div>
          </header>
          <main className="erp-content">
            <motion.div
              key={path}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="erp-page-heading">
                <div>
                  <p className="erp-breadcrumb">
                    WORKSPACE /{" "}
                    {groups
                      .find((g) => path === g.to || g.children.some((c) => c.to === path))
                      ?.label.toUpperCase() ?? "OVERVIEW"}
                  </p>
                  <h1>{title}</h1>
                  {subtitle && <p className="erp-subtitle">{subtitle}</p>}
                </div>
                {actions}
              </div>
              {children}
            </motion.div>
          </main>
          <footer className="erp-bottomline">
            <span>BuildCore ERP</span>
            <span>Warehouse A · Indore</span>
          </footer>
        </div>
      </div>
    </MotionConfig>
  );
}
export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  i = 0,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: React.ComponentType<{ className?: string }>;
  i?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04, duration: 0.4 }}
      className="erp-stat"
    >
      <div className="erp-stat-top">
        <p>{label}</p>
        <span>
          <Icon className="size-4" />
        </span>
      </div>
      <strong>{value}</strong>
      {delta && <p className="erp-stat-delta">{delta}</p>}
    </motion.div>
  );
}
export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("erp-panel", className)}>
      <div className="erp-panel-heading">
        <h3>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
const tones: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  danger: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
  primary: "bg-accent text-accent-foreground",
};
export function Pill({ tone, children }: { tone?: string | undefined; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold",
        tones[tone ?? "muted"],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
