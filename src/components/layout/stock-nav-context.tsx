"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRole } from "./role-context";

export type StockTab =
  | "dashboard" | "products" | "suppliers" | "po" | "gr" | "adjust" | "return" | "cost" | "log";

interface StockNavCtx {
  tab: StockTab;
  setTab: (t: StockTab) => void;
}

const Ctx = createContext<StockNavCtx | null>(null);

function defaultStockTab(role: string): StockTab {
  if (role === "admin") return "dashboard";
  if (role === "accounting") return "suppliers";
  return "products";
}

export function StockNavProvider({ children }: { children: React.ReactNode }) {
  const { role } = useRole();
  const [tab, setTab] = useState<StockTab>(() => defaultStockTab(role));
  const prevRole = useRef(role);

  // ตั้งแท็บเริ่มต้นใหม่เมื่อ "สลับสิทธิ์" เท่านั้น (บัญชีเริ่มที่ผู้ขาย)
  useEffect(() => {
    if (prevRole.current !== role) {
      prevRole.current = role;
      setTab(defaultStockTab(role));
    }
  }, [role]);

  return <Ctx.Provider value={{ tab, setTab }}>{children}</Ctx.Provider>;
}

export function useStockNav() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStockNav must be used within StockNavProvider");
  return ctx;
}
