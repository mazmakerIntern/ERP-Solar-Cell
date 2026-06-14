"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
  Crown, Briefcase, Package, Calculator,
  TrendingUp, Clock, AlertTriangle, Users as UsersIcon,
  PackageCheck, Undo2, Zap, FileWarning, Megaphone, Target, BarChart2,
} from "lucide-react";
import { BahtSign } from "@/components/ui/baht-sign";

export type Role = "admin" | "sales" | "stock" | "accounting" | "marketing";

export interface RolePerms {
  canSeeCost: boolean;          // เห็นต้นทุน Avg Cost
  commissionScope: "all" | "own" | "none";
  stockReadOnly: boolean;       // จัดการ Stock ได้หรือดูอย่างเดียว
  canApprove: boolean;          // อนุมัติเอกสาร
  canSell: boolean;             // สร้าง SO / ลูกค้า / โปรโมชั่น
}

export interface RoleTodo {
  label: string;
  count: string;
  href: string;
  color: string;
}

export interface RoleConfig {
  role: Role;
  label: string;
  shortDesc: string;
  fullTitle: string;            // ตำแหน่งเต็ม
  icon: React.ElementType;
  color: string;
  user: { name: string; email: string; initial: string };
  landing: string;
  nav: string[];                // route keys ที่เข้าถึงได้
  perms: RolePerms;
  capabilities: string[];       // สิ่งที่ทำได้ (แสดงในหน้า Home)
  quickStats: { label: string; value: string; icon: React.ElementType; color: string }[];
  todos: RoleTodo[];            // งานที่ต้องทำ
}

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  admin: {
    role: "admin",
    label: "ผู้บริหาร",
    shortDesc: "Full Access",
    fullTitle: "ผู้บริหาร / เจ้าของกิจการ",
    icon: Crown,
    color: "#e60023",
    user: { name: "ผู้บริหาร ระบบ", email: "admin@solarsell.co.th", initial: "ผ" },
    landing: "/dashboard",
    nav: ["dashboard", "stock", "sales", "marketing", "approvals", "users", "peak"],
    perms: { canSeeCost: true, commissionScope: "all", stockReadOnly: false, canApprove: true, canSell: true },
    capabilities: [
      "ดูภาพรวมธุรกิจทั้งบริษัท (Executive Dashboard)",
      "อนุมัติ / ปฏิเสธทุกคำขอในระบบ",
      "ตั้งค่าระบบ + จัดการผู้ใช้และสิทธิ์",
      "เห็นต้นทุน (Avg Cost) และข้อมูลการเงินทั้งหมด",
    ],
    quickStats: [
      { label: "ยอดขายวันนี้", value: "84,320 ฿", icon: TrendingUp, color: "#e60023" },
      { label: "รออนุมัติ", value: "1 รายการ", icon: Clock, color: "#d97706" },
      { label: "สต็อกต่ำ", value: "2 SKU", icon: AlertTriangle, color: "#dc2626" },
    ],
    todos: [
      { label: "คำขออนุมัติส่วนลดเกินสิทธิ์", count: "1", href: "/approvals", color: "#d97706" },
      { label: "สินค้าต่ำกว่า Reorder Point", count: "2", href: "/stock", color: "#dc2626" },
    ],
  },
  sales: {
    role: "sales",
    label: "เซลส์",
    shortDesc: "ฝ่ายขาย",
    fullTitle: "พนักงานขาย (Sales)",
    icon: Briefcase,
    color: "#2563eb",
    user: { name: "วิภา สุขใจ", email: "wipa@solarsell.co.th", initial: "ว" },
    landing: "/dashboard",
    nav: ["dashboard", "sales", "marketing", "approvals"],
    perms: { canSeeCost: false, commissionScope: "own", stockReadOnly: true, canApprove: false, canSell: true },
    capabilities: [
      "สร้างใบสั่งขาย (ดึงราคา Tier + โปรโมชั่นอัตโนมัติ)",
      "ดูคอมมิชชั่น / KPI ของตัวเอง",
      "ดูสต็อกคงเหลือ (ไม่เห็นต้นทุน)",
      "ขออนุมัติส่วนลด / แก้ราคา → ส่งผู้บริหาร",
    ],
    quickStats: [
      { label: "ยอดขายฉัน (เดือน)", value: "289,970 ฿", icon: TrendingUp, color: "#2563eb" },
      { label: "คอมมิชชั่นฉัน", value: "13,675 ฿", icon: BahtSign, color: "#059669" },
      { label: "ลูกค้าของฉัน", value: "3 ราย", icon: UsersIcon, color: "#6b7280" },
    ],
    todos: [
      { label: "ใบสั่งขายของฉันที่รอปิด", count: "0", href: "/sales", color: "#2563eb" },
      { label: "คอมมิชชั่น Pending (รอ Peak ยืนยัน)", count: "1", href: "/sales", color: "#d97706" },
    ],
  },
  stock: {
    role: "stock",
    label: "สต็อก",
    shortDesc: "คลังสินค้า",
    fullTitle: "พนักงานคลังสินค้า (Stock)",
    icon: Package,
    color: "#0d9488",
    user: { name: "สมหญิง วงศ์ดี", email: "somying@solarsell.co.th", initial: "ส" },
    landing: "/dashboard",
    nav: ["dashboard", "stock", "approvals"],
    perms: { canSeeCost: true, commissionScope: "none", stockReadOnly: false, canApprove: false, canSell: false },
    capabilities: [
      "จัดการคลัง: รับเข้า / ตัดออก / ปรับยอด",
      "สร้าง Purchase Order + Goods Receipt",
      "ตรวจรับคืนสินค้า (Return Inspection)",
      "ขออนุมัติปรับยอด / รับเข้า → ส่งผู้บริหาร",
    ],
    quickStats: [
      { label: "สต็อกต่ำ", value: "2 SKU", icon: AlertTriangle, color: "#dc2626" },
      { label: "รอรับเข้า (PO)", value: "1 รายการ", icon: PackageCheck, color: "#d97706" },
      { label: "Return รอตรวจ", value: "1 รายการ", icon: Undo2, color: "#0d9488" },
    ],
    todos: [
      { label: "PO รอรับสินค้าเข้าคลัง", count: "1", href: "/stock", color: "#d97706" },
      { label: "สินค้ารับคืนรอตรวจสภาพ", count: "1", href: "/stock", color: "#0d9488" },
      { label: "สินค้าต่ำกว่า Reorder Point", count: "2", href: "/stock", color: "#dc2626" },
    ],
  },
  accounting: {
    role: "accounting",
    label: "บัญชี",
    shortDesc: "การเงิน",
    fullTitle: "พนักงานบัญชี (Accounting)",
    icon: Calculator,
    color: "#7c3aed",
    user: { name: "บัญชี หมื่นดี", email: "accounting@solarsell.co.th", initial: "บ" },
    landing: "/dashboard",
    nav: ["dashboard", "peak", "sales", "stock", "approvals"],
    perms: { canSeeCost: true, commissionScope: "all", stockReadOnly: true, canApprove: true, canSell: false },
    capabilities: [
      "จัดการการเชื่อมต่อ Peak + ตรวจสอบ Sync",
      "แก้ไขข้อมูลการเงินของผู้ขาย (Supplier)",
      "ดูคอมมิชชั่น / Credit Note ของทุกคน",
      "อนุมัติเอกสารบางกรณี (เช่น คืนเกิน Period)",
    ],
    quickStats: [
      { label: "ค้างชำระ (AR)", value: "280,000 ฿", icon: BahtSign, color: "#d97706" },
      { label: "รอ Sync Peak", value: "1 รายการ", icon: Zap, color: "#7c3aed" },
      { label: "Sync Error", value: "1 รายการ", icon: FileWarning, color: "#dc2626" },
    ],
    todos: [
      { label: "เอกสาร Sync ล้มเหลว (ต้อง Retry)", count: "1", href: "/peak", color: "#dc2626" },
      { label: "เอกสารรอ Push เข้า Peak", count: "1", href: "/peak", color: "#7c3aed" },
    ],
  },
  marketing: {
    role: "marketing",
    label: "การตลาด",
    shortDesc: "Marketing",
    fullTitle: "พนักงานการตลาด (Marketing)",
    icon: Megaphone,
    color: "#ea580c",
    user: { name: "นิดา มาร์เก็ตติ้ง", email: "nida@solarsell.co.th", initial: "น" },
    landing: "/dashboard",
    nav: ["dashboard", "sales", "marketing", "approvals"],
    perms: { canSeeCost: false, commissionScope: "none", stockReadOnly: true, canApprove: false, canSell: false },
    capabilities: [
      "สร้าง/แก้ไข Promotion & Discount Rule (ต้องขออนุมัติก่อนมีผล)",
      "สร้าง/แก้ไข Customer Tier (ต้องขออนุมัติก่อนมีผล)",
      "ดู Promotion Performance ทุกแคมเปญ",
      "ดูยอดขายภาพรวม (ไม่เห็นต้นทุน / คอมมิชชั่น)",
    ],
    quickStats: [
      { label: "โปรโมชั่น Active", value: "2 แคมเปญ", icon: Target, color: "#ea580c" },
      { label: "รออนุมัติ Promo", value: "1 รายการ", icon: Clock, color: "#d97706" },
      { label: "Conversion Rate", value: "18.4%", icon: BarChart2, color: "#059669" },
    ],
    todos: [
      { label: "โปรโมชั่นรออนุมัติจากผู้บริหาร", count: "1", href: "/sales", color: "#d97706" },
      { label: "โปรโมชั่นใกล้หมดอายุ (7 วัน)", count: "1", href: "/sales", color: "#ea580c" },
    ],
  },
};

interface RoleCtx {
  role: Role;
  config: RoleConfig;
  setRole: (r: Role) => void;
}

const Ctx = createContext<RoleCtx | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("admin");

  useEffect(() => {
    // 1 ลิงก์ / 1 สิทธิ์ — รองรับ ?role=... บน URL ใด ๆ (เช่น /sales?role=stock)
    const fromUrl = new URLSearchParams(window.location.search).get("role") as Role | null;
    if (fromUrl && ROLE_CONFIG[fromUrl]) {
      setRoleState(fromUrl);
      localStorage.setItem("demo-role", fromUrl);
      return;
    }
    const saved = localStorage.getItem("demo-role") as Role | null;
    if (saved && ROLE_CONFIG[saved]) setRoleState(saved);
  }, []);

  const setRole = (r: Role) => {
    setRoleState(r);
    localStorage.setItem("demo-role", r);
  };

  return (
    <Ctx.Provider value={{ role, config: ROLE_CONFIG[role], setRole }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRole() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
