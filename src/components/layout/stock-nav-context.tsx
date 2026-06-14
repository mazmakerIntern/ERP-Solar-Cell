"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRole } from "./role-context";

export type StockTab =
  | "products" | "suppliers" | "po" | "gr" | "adjust" | "return" | "cost" | "log";

interface StockNavCtx {
  tab: StockTab;
  setTab: (t: StockTab) => void;
}

const Ctx = createContext<StockNavCtx | null>(null);

export function StockNavProvider({ children }: { children: React.ReactNode }) {
  const { role } = useRole();
  const [tab, setTab] = useState<StockTab>("products");
  const prevRole = useRef(role);

  // ตั้งแท็บเริ่มต้นใหม่เมื่อ "สลับสิทธิ์" เท่านั้น (บัญชีเริ่มที่ผู้ขาย)
  useEffect(() => {
    if (prevRole.current !== role) {
      prevRole.current = role;
      setTab(role === "accounting" ? "suppliers" : "products");
    }
  }, [role]);

  return <Ctx.Provider value={{ tab, setTab }}>{children}</Ctx.Provider>;
}

export function useStockNav() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStockNav must be used within StockNavProvider");
  return ctx;
}
