"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { useRole, ROLE_CONFIG, type Role } from "./role-context";
import {
  LayoutDashboard, Package, ShoppingCart, Users, CheckSquare,
  Zap, ChevronRight, LogOut, X, Check, ChevronsUpDown,
} from "lucide-react";
import { mockApprovals } from "@/lib/mock-data";

const ALL_NAV: { key: string; href: string; icon: React.ElementType; label: string }[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, label: "Executive Dashboard" },
  { key: "stock", href: "/stock", icon: Package, label: "Stock" },
  { key: "sales", href: "/sales", icon: ShoppingCart, label: "Sales & Marketing" },
  { key: "approvals", href: "/approvals", icon: CheckSquare, label: "Approval Workflow" },
  { key: "users", href: "/users", icon: Users, label: "Permission & User" },
  { key: "peak", href: "/peak", icon: Zap, label: "Peak Integration" },
];

const GROUP_MAP: { label: string; keys: string[] }[] = [
  { label: "ภาพรวม", keys: ["dashboard"] },
  { label: "โมดูลหลัก", keys: ["stock", "sales", "approvals"] },
  { label: "ระบบ", keys: ["users", "peak"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { mobileOpen, setMobileOpen } = useSidebar();
  const { role, config, setRole } = useRole();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  function switchRole(r: Role) {
    setRole(r);
    setSwitcherOpen(false);
    setMobileOpen(false);
    router.push(ROLE_CONFIG[r].landing);
  }

  // approval badge: approver เห็น pending ทั้งหมด, คนอื่นเห็น pending ของตัวเอง
  const approvalBadge = config.perms.canApprove
    ? mockApprovals.filter(a => a.status === "pending").length
    : mockApprovals.filter(a => a.status === "pending" && a.requestBy === config.user.name).length;

  // filter nav by role access
  const groups = GROUP_MAP
    .map(g => ({
      label: g.label,
      items: ALL_NAV.filter(n => g.keys.includes(n.key) && config.nav.includes(n.key)),
    }))
    .filter(g => g.items.length > 0);

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-screen flex flex-col border-r border-[var(--border)] bg-[var(--card)] z-50 transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
      style={{ width: "var(--sidebar-width, 240px)" }}
    >
      {/* Logo */}
      <div className="px-4 py-3.5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
            style={{ background: "linear-gradient(135deg, #e60023, #b30019)" }}
          >
            S
          </div>
          <div>
            <div className="text-[0.9rem] font-700 leading-tight">Solarsell</div>
            <div className="text-[0.62rem] text-[var(--muted-foreground)]">ERP System · v1.0</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm" title="ระบบทำงานปกติ" />
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden w-6 h-6 rounded-md flex items-center justify-center hover:bg-[var(--muted)]"
            >
              <X size={14} className="text-[var(--muted-foreground)]" />
            </button>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {groups.map((group) => (
          <div key={group.label} className="mb-3">
            <div className="px-2 mb-1 text-[0.6rem] font-700 uppercase tracking-widest text-[var(--muted-foreground)]">
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[0.82rem] transition-all mb-0.5 group",
                    isActive
                      ? "bg-[var(--accent)] text-[var(--primary)] font-600"
                      : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                  )}
                >
                  <item.icon
                    size={15}
                    className={isActive ? "text-[var(--primary)]" : "text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors"}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.key === "approvals" && approvalBadge > 0 ? (
                    <span
                      className="min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[0.6rem] font-700 text-white px-1"
                      style={{ background: "var(--primary)" }}
                    >
                      {approvalBadge}
                    </span>
                  ) : isActive ? (
                    <ChevronRight size={11} className="text-[var(--primary)]" />
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Quick Stats */}
        <div className="mt-2 mb-2">
          <div className="px-2 mb-1.5 text-[0.6rem] font-700 uppercase tracking-widest text-[var(--muted-foreground)]">
            Quick Stats
          </div>
          <div className="space-y-1 px-1">
            {config.quickStats.map((s) => (
              <div key={s.label} className="flex items-center gap-2 px-2.5 py-2 rounded-lg" style={{ background: "var(--muted)" }}>
                <s.icon size={12} style={{ color: s.color }} className="flex-shrink-0" />
                <span className="text-[0.72rem] text-[var(--muted-foreground)] flex-1">{s.label}</span>
                <span className="text-[0.72rem] font-600">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Role Switcher + User */}
      <div className="border-t border-[var(--border)] relative">
        {/* Switcher dropdown */}
        {switcherOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setSwitcherOpen(false)} />
            <div className="absolute bottom-full left-2 right-2 mb-1 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-lg)] z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-[var(--border)] text-[0.62rem] font-700 uppercase tracking-widest text-[var(--muted-foreground)]">
                สลับมุมมอง (Demo)
              </div>
              {(Object.keys(ROLE_CONFIG) as Role[]).map((r) => {
                const rc = ROLE_CONFIG[r];
                const active = r === role;
                return (
                  <button
                    key={r}
                    onClick={() => switchRole(r)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--muted)] transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${rc.color}1a` }}>
                      <rc.icon size={14} style={{ color: rc.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.78rem] font-600">{rc.label}</div>
                      <div className="text-[0.65rem] text-[var(--muted-foreground)]">{rc.shortDesc}</div>
                    </div>
                    {active && <Check size={14} style={{ color: "var(--primary)" }} />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Current role badge — click to switch */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={() => setSwitcherOpen(!switcherOpen)}
            className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.72rem] hover:opacity-90 transition-opacity"
            style={{ background: `${config.color}1a` }}
          >
            <config.icon size={13} style={{ color: config.color }} />
            <span className="font-600" style={{ color: config.color }}>{config.label}</span>
            <span className="text-[var(--muted-foreground)]">· {config.shortDesc}</span>
            <ChevronsUpDown size={12} className="ml-auto text-[var(--muted-foreground)]" />
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center gap-2.5 px-3 py-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-700 flex-shrink-0 shadow-sm"
            style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)` }}
          >
            {config.user.initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[0.8rem] font-600 truncate">{config.user.name}</div>
            <div className="text-[0.67rem] text-[var(--muted-foreground)] truncate">{config.user.email}</div>
          </div>
          <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--muted)] transition-colors" title="ออกจากระบบ">
            <LogOut size={13} className="text-[var(--muted-foreground)]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
