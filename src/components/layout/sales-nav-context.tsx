"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRole } from "./role-context";

export type SalesTab =
  | "dashboard" | "customers" | "orders" | "commission" | "promotions" | "creditnote" | "performance" | "tiers";

// โมดูล: แยกเมนู "การขาย" (sales) ออกจาก "การตลาด" (marketing)
export type SalesModule = "sales" | "marketing";

// ทะเบียนแท็บกลาง — ใช้ร่วมกันระหว่าง sidebar กับหน้าเพจ (กันไม่ให้ค่าเพี้ยนกัน)
// roles ไม่ระบุ = ทุกสิทธิ์ที่มีเมนูของโมดูลนั้น
export const SALES_TAB_DEFS: { key: SalesTab; label: string; module: SalesModule; roles?: string[] }[] = [
  { key: "dashboard", label: "ภาพรวม", module: "sales", roles: ["admin"] },
  { key: "orders", label: "ใบสั่งขาย", module: "sales", roles: ["admin", "sales", "accounting"] },
  { key: "customers", label: "ลูกค้า", module: "sales" },
  { key: "commission", label: "Commission & KPI", module: "sales", roles: ["admin", "sales", "accounting"] },
  { key: "creditnote", label: "Credit Note", module: "sales", roles: ["admin", "sales", "accounting"] },
  { key: "dashboard", label: "ภาพรวม", module: "marketing", roles: ["admin"] },
  { key: "promotions", label: "โปรโมชั่น", module: "marketing" },
  { key: "performance", label: "Promo Performance", module: "marketing", roles: ["admin", "marketing"] },
  { key: "tiers", label: "จัดการ Tier", module: "marketing", roles: ["admin", "marketing"] },
];

// แท็บที่สิทธิ์นี้เข้าถึงได้ในโมดูลที่กำหนด
export function tabsFor(module: SalesModule, role: string) {
  return SALES_TAB_DEFS.filter(t => t.module === module && (!t.roles || t.roles.includes(role)));
}

interface SalesNavCtx {
  tab: SalesTab;
  setTab: (t: SalesTab) => void;
}

const Ctx = createContext<SalesNavCtx | null>(null);

function defaultTabForRole(role: string): SalesTab {
  if (role === "admin") return "dashboard";
  if (role === "marketing") return "promotions";
  return "orders";
}

export function SalesNavProvider({ children }: { children: React.ReactNode }) {
  const { role } = useRole();
  const [tab, setTab] = useState<SalesTab>(() => defaultTabForRole(role));
  const prevRole = useRef(role);

  // ตั้งแท็บเริ่มต้นใหม่เมื่อ "สลับสิทธิ์" เท่านั้น (ไม่รีเซ็ตตอนเปลี่ยนหน้า)
  useEffect(() => {
    if (prevRole.current !== role) {
      prevRole.current = role;
      setTab(defaultTabForRole(role));
    }
  }, [role]);

  return <Ctx.Provider value={{ tab, setTab }}>{children}</Ctx.Provider>;
}

export function useSalesNav() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSalesNav must be used within SalesNavProvider");
  return ctx;
}
