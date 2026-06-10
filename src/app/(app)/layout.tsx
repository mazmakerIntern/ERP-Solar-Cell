"use client";

import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context";
import { RoleProvider, useRole } from "@/components/layout/role-context";
import { Lock } from "lucide-react";

function NoAccess() {
  const { config } = useRole();
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "var(--accent)" }}
      >
        <Lock size={28} style={{ color: "var(--primary)" }} />
      </div>
      <h2 className="text-lg font-700 mb-1">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
      <p className="text-[0.85rem] text-[var(--muted-foreground)] max-w-sm mb-5">
        บัญชี <span className="font-600">{config.label}</span> ไม่ได้รับสิทธิ์เข้าถึงเมนูนี้
        ตาม Permission Matrix ที่กำหนดในระบบ
      </p>
      <button
        onClick={() => router.push(config.landing)}
        className="px-4 h-9 rounded-lg text-[0.82rem] font-600 text-white"
        style={{ background: "var(--primary)" }}
      >
        กลับหน้าหลักของฉัน
      </button>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { mobileOpen, setMobileOpen } = useSidebar();
  const { config } = useRole();
  const pathname = usePathname();
  const routeKey = pathname.split("/")[1] || "dashboard";
  const allowed = config.nav.includes(routeKey);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar />

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <main className="min-h-screen pt-14 transition-all lg:ml-[var(--sidebar-width,240px)]">
        {allowed ? children : <NoAccess />}
      </main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <SidebarProvider>
        <Shell>{children}</Shell>
      </SidebarProvider>
    </RoleProvider>
  );
}
