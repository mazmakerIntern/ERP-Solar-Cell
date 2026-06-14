"use client";

import { useState, useRef } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Badge, statusBadge } from "@/components/ui/badge";
import { mockUsers, mockActivityLog, roleLabel } from "@/lib/mock-data";
import { Users, History, Shield, Settings, Plus, Search, GitBranch, ChevronRight, FileEdit, Trash2, X } from "lucide-react";

type Tab = "users" | "permissions" | "approval" | "log" | "config";

type User = typeof mockUsers[number];
const ROLE_KEYS = ["admin", "sales", "marketing", "stock", "accounting"] as const;
type RoleKey = typeof ROLE_KEYS[number];

type ApprovalRule = {
  id: string;
  trigger: string;
  desc: string;
  condition: string;
  approvers: string[];
  levels: number;
  module: string;
  active: boolean;
};

const initialApprovalRules: ApprovalRule[] = [
  {
    id: "AR001",
    trigger: "ส่วนลดเกินสิทธิ์",
    desc: "เซลส์ให้ส่วนลดเกินสิทธิ์ที่กำหนด",
    condition: "ส่วนลด > 10% หรือต่ำกว่า Floor Price",
    approvers: ["ผู้บริหาร"],
    levels: 1,
    module: "Sales",
    active: true,
  },
  {
    id: "AR002",
    trigger: "แก้ราคา",
    desc: "มีการแก้ไขราคาขายใน Sales Order หลังบันทึกแล้ว",
    condition: "แก้ราคาขายหลังจาก SO บันทึก",
    approvers: ["ผู้บริหาร"],
    levels: 1,
    module: "Sales",
    active: true,
  },
  {
    id: "AR003",
    trigger: "รับ/ปรับสต็อก",
    desc: "Goods Receipt หรือ Stock Adjustment ทุกรายการ",
    condition: "GR ทุกครั้ง หรือ Adjustment มูลค่า > 5,000 บาท",
    approvers: ["ผู้บริหาร", "บัญชี"],
    levels: 2,
    module: "Stock",
    active: true,
  },
  {
    id: "AR004",
    trigger: "บิลใหญ่",
    desc: "Sales Order มูลค่าสูงเกิน Threshold ก่อน Push ไป Peak",
    condition: "มูลค่า SO > 100,000 บาท",
    approvers: ["ผู้บริหาร"],
    levels: 1,
    module: "Sales",
    active: true,
  },
  {
    id: "AR005",
    trigger: "SO Cancel",
    desc: "ยกเลิก Sales Order ที่ Confirm แล้ว",
    condition: "SO สถานะ Confirmed หรือ In Progress",
    approvers: ["ผู้บริหาร"],
    levels: 1,
    module: "Sales",
    active: true,
  },
  {
    id: "AR006",
    trigger: "คืนเกิน Period",
    desc: "ลูกค้าต้องการคืนสินค้าหลังพ้น Return Period",
    condition: "วันที่คืน > วันที่ขาย + 30 วัน",
    approvers: ["ผู้บริหาร", "บัญชี"],
    levels: 2,
    module: "Stock",
    active: false,
  },
];

type PermVal = boolean | "partial";
type PermRow =
  | { type: "group"; label: string }
  | { type: "row"; feature: string; note?: string; admin: PermVal; sales: PermVal; marketing: PermVal; stock: PermVal; accounting: PermVal };

const permissionMatrix: PermRow[] = [
  // ── การจัดการระบบ
  { type: "group", label: "การจัดการระบบ" },
  { type: "row", feature: "User & Role Management", admin: true, sales: false, marketing: false, stock: false, accounting: false },
  { type: "row", feature: "System Configuration (Threshold, Commission Rate, KPI Target, Return Period)", admin: true, sales: false, marketing: false, stock: false, accounting: false },
  { type: "row", feature: "Activity Log — ดูทั้งหมด", admin: true, sales: false, marketing: false, stock: false, accounting: false },

  // ── ลูกค้า & ราคา
  { type: "group", label: "ลูกค้า & ราคา" },
  { type: "row", feature: "Customer Master — สร้าง/แก้ไข", note: "การตลาด: ต้องขออนุมัติก่อนมีผล", admin: true, sales: false, marketing: "partial", stock: false, accounting: false },
  { type: "row", feature: "Customer Master — ดูทั้งหมด", note: "เซลส์: เห็นเฉพาะลูกค้าของตัวเอง", admin: true, sales: "partial", marketing: true, stock: false, accounting: false },
  { type: "row", feature: "Customer Tier — สร้าง/แก้ไข (ต้องอนุมัติ)", admin: true, sales: false, marketing: "partial", stock: false, accounting: false },
  { type: "row", feature: "Promotion & Discount Rule — สร้าง/แก้ไข (ต้องอนุมัติ)", admin: true, sales: false, marketing: "partial", stock: false, accounting: false },
  { type: "row", feature: "Customer Segment Pricing — สร้าง/แก้ไข", admin: true, sales: false, marketing: "partial", stock: false, accounting: false },
  { type: "row", feature: "Commission Rate / KPI Target — ตั้งค่า", admin: true, sales: false, marketing: false, stock: false, accounting: false },

  // ── การขาย
  { type: "group", label: "การขาย" },
  { type: "row", feature: "Sales Order — สร้าง (Tier + Promo ดึงอัตโนมัติ, แสดงสต็อก)", admin: true, sales: true, marketing: false, stock: false, accounting: false },
  { type: "row", feature: "Sales Order — ดูทั้งหมด", note: "เซลส์: เห็นเฉพาะของตัวเอง", admin: true, sales: "partial", marketing: false, stock: false, accounting: true },
  { type: "row", feature: "Promotion Performance — ดูยอดขายจริงทุกแคมเปญ", admin: true, sales: false, marketing: true, stock: false, accounting: false },
  { type: "row", feature: "Commission & KPI — ดูของตัวเอง", admin: true, sales: true, marketing: false, stock: false, accounting: false },
  { type: "row", feature: "Commission & KPI — ดูทั้งหมด", admin: true, sales: false, marketing: false, stock: false, accounting: true },
  { type: "row", feature: "Credit Note — สร้าง (หลังผ่าน Return Inspection และอนุมัติ)", admin: true, sales: true, marketing: false, stock: false, accounting: false },
  { type: "row", feature: "คำขอคืนสินค้า — สร้าง", admin: true, sales: true, marketing: false, stock: false, accounting: false },

  // ── คลังสินค้า
  { type: "group", label: "คลังสินค้า" },
  { type: "row", feature: "Product Master — สร้าง/แก้ไข", admin: true, sales: false, marketing: false, stock: true, accounting: false },
  { type: "row", feature: "Product Master — ดูราคาทุน (Avg Cost)", admin: true, sales: false, marketing: false, stock: true, accounting: true },
  { type: "row", feature: "Supplier Master — ข้อมูลทั่วไป (สร้าง/แก้ไข)", admin: true, sales: false, marketing: false, stock: true, accounting: false },
  { type: "row", feature: "Supplier Master — ข้อมูลการเงิน (เลขนิติบุคคล, เงื่อนไขชำระ, เลขบัญชี)", admin: true, sales: false, marketing: false, stock: false, accounting: true },
  { type: "row", feature: "Purchase Order — สร้าง", admin: true, sales: false, marketing: false, stock: true, accounting: false },
  { type: "row", feature: "Goods Receipt — สร้าง", admin: true, sales: false, marketing: false, stock: true, accounting: false },
  { type: "row", feature: "Goods Receipt Log — อ่านอย่างเดียว", admin: true, sales: false, marketing: false, stock: true, accounting: true },
  { type: "row", feature: "Stock Adjustment (ต้องขออนุมัติ)", admin: true, sales: false, marketing: false, stock: true, accounting: false },
  { type: "row", feature: "Return Inspection — ดำเนินการ", admin: true, sales: false, marketing: false, stock: true, accounting: false },
  { type: "row", feature: "Stock Level — ดูคงเหลือ Real-time", note: "เซลส์: เห็นใน SO Modal เท่านั้น", admin: true, sales: "partial", marketing: false, stock: true, accounting: false },
  { type: "row", feature: "Movement Log — ดู", admin: true, sales: false, marketing: false, stock: true, accounting: true },
  { type: "row", feature: "Avg Cost Report — อ่านอย่างเดียว", admin: true, sales: false, marketing: false, stock: true, accounting: true },

  // ── การเงิน / Peak
  { type: "group", label: "การเงิน / Peak" },
  { type: "row", feature: "Peak Integration — จัดการการเชื่อมต่อ + ตรวจสอบ Sync", admin: true, sales: false, marketing: false, stock: false, accounting: true },
  { type: "row", feature: "Peak — บันทึก Receipt โดยตรง", admin: true, sales: false, marketing: false, stock: false, accounting: true },
  { type: "row", feature: "สถานะ Sync ดู/ตรวจสอบ", admin: true, sales: false, marketing: false, stock: false, accounting: true },

  // ── Approval
  { type: "group", label: "Approval Workflow" },
  { type: "row", feature: "Approval — อนุมัติทุกรายการ", admin: true, sales: false, marketing: false, stock: false, accounting: false },
  { type: "row", feature: "Approval — อนุมัติบางกรณี (เช่น คืนเกิน Period)", admin: false, sales: false, marketing: false, stock: false, accounting: true },
  { type: "row", feature: "Approval — ขอ / ส่งเรื่อง", admin: false, sales: true, marketing: true, stock: true, accounting: false },
];

const systemConfig = [
  { key: "invoice_threshold", label: "Threshold บิลใหญ่ (บาท)", value: "100,000", desc: "บิลเกินนี้ต้องผ่าน Approval ก่อนส่ง Peak" },
  { key: "return_period", label: "Return Period (วัน)", value: "30", desc: "จำนวนวันที่อนุญาตให้คืนสินค้า" },
  { key: "kpi_panel", label: "KPI เป้าแผง (บาท/เดือน)", value: "200,000", desc: "เป้ายอดขายแผนกแผง" },
  { key: "kpi_inverter", label: "KPI เป้าอินเวอร์เตอร์ (บาท/เดือน)", value: "180,000", desc: "เป้ายอดขายแผนกอินเวอร์เตอร์" },
  { key: "kpi_battery", label: "KPI เป้าแบตเตอรี่ (บาท/เดือน)", value: "120,000", desc: "เป้ายอดขายแผนกแบตเตอรี่" },
  { key: "commission_panel", label: "Commission Rate แผง (%)", value: "5", desc: "อัตราคอมมิชชั่นแผนกแผง" },
  { key: "commission_inverter", label: "Commission Rate อินเวอร์เตอร์ (%)", value: "4.5", desc: "อัตราคอมมิชชั่นแผนกอินเวอร์เตอร์" },
  { key: "commission_battery", label: "Commission Rate แบตเตอรี่ (%)", value: "5", desc: "อัตราคอมมิชชั่นแผนกแบตเตอรี่" },
];

export default function UsersPage() {
  const [tab, setTab] = useState<Tab>("users");
  const [search, setSearch] = useState("");
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>(initialApprovalRules);

  // ── ผู้ใช้งาน (เพิ่ม/แก้ไข/ลบ) ──
  const [users, setUsers] = useState<User[]>(() => mockUsers.map(u => ({ ...u })));
  const [userModal, setUserModal] = useState<{ mode: "add" } | { mode: "edit"; user: User } | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const seq = useRef(7);

  function addUser(input: Omit<User, "id" | "lastLogin">) {
    const id = `U${String(++seq.current).padStart(3, "0")}`;
    setUsers(prev => [...prev, { ...input, id, lastLogin: "—" }]);
  }
  function updateUser(id: string, patch: Omit<User, "id" | "lastLogin">) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u));
  }
  function deleteUser(id: string) {
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  // ── สิทธิ์การเข้าถึง (เพิ่ม/แก้ไข/ลบ) ──
  const [permRows, setPermRows] = useState<PermRow[]>(() => permissionMatrix.map(r => ({ ...r })));
  const [permModal, setPermModal] = useState<{ mode: "add" } | { mode: "edit"; index: number } | null>(null);
  const [deletingPerm, setDeletingPerm] = useState<{ index: number; feature: string } | null>(null);

  // คลิกที่ช่อง → วนค่า: ✓ → ~ → — → ✓
  function cyclePermCell(index: number, role: RoleKey) {
    setPermRows(prev => prev.map((r, i) => {
      if (i !== index || r.type !== "row") return r;
      const cur = r[role];
      const next: PermVal = cur === true ? "partial" : cur === "partial" ? false : true;
      return { ...r, [role]: next };
    }));
  }
  function savePermission(data: { group: string; feature: string; note?: string } & Record<RoleKey, PermVal>, editIndex?: number) {
    const newRow: PermRow = {
      type: "row", feature: data.feature, note: data.note || undefined,
      admin: data.admin, sales: data.sales, marketing: data.marketing, stock: data.stock, accounting: data.accounting,
    };
    if (editIndex != null) {
      setPermRows(prev => prev.map((r, i) => i === editIndex ? newRow : r));
      return;
    }
    setPermRows(prev => {
      const out = [...prev];
      let gi = out.findIndex(r => r.type === "group" && r.label === data.group);
      if (gi < 0) return [...out, { type: "group", label: data.group }, newRow];
      let insertAt = gi + 1;
      while (insertAt < out.length && out[insertAt].type === "row") insertAt++;
      out.splice(insertAt, 0, newRow);
      return out;
    });
  }
  function deletePermission(index: number) {
    setPermRows(prev => prev.filter((_, i) => i !== index));
  }
  const permGroups = permRows.filter(r => r.type === "group").map(r => (r as { label: string }).label);

  const toggleRule = (id: string) =>
    setApprovalRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "users", label: "ผู้ใช้งาน", icon: Users },
    { key: "permissions", label: "สิทธิ์การเข้าถึง", icon: Shield },
    { key: "approval", label: "Approval Rule", icon: GitBranch },
    { key: "log", label: "Activity Log", icon: History },
    { key: "config", label: "System Configuration", icon: Settings },
  ];

  return (
    <>
      <Topbar title="Permission & User" subtitle="จัดการผู้ใช้งาน สิทธิ์ การอนุมัติ และการตั้งค่าระบบ" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--muted)" }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.8rem] font-500 transition-all"
                style={{
                  background: tab === t.key ? "var(--card)" : "transparent",
                  color: tab === t.key ? "var(--foreground)" : "var(--muted-foreground)",
                  boxShadow: tab === t.key ? "var(--shadow-sm)" : "none",
                }}
              >
                <t.icon size={13} />
                {t.label}
              </button>
            ))}
          </div>
          {tab === "users" && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="ค้นหา..."
                  className="pl-8 pr-3 h-8 text-[0.8rem] border border-[var(--border)] rounded-lg outline-none bg-[var(--card)] focus:border-[var(--ring)] w-48"
                />
              </div>
              <button
                onClick={() => setUserModal({ mode: "add" })}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[0.8rem] font-500 text-white"
                style={{ background: "var(--primary)" }}
              >
                <Plus size={13} />
                เพิ่มผู้ใช้
              </button>
            </div>
          )}
        </div>

        {tab === "users" && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-[var(--shadow-sm)]">
            <div className="overflow-x-auto">
              <table className="w-full text-[0.82rem]">
                <thead style={{ background: "var(--muted)" }}>
                  <tr>
                    {["ผู้ใช้งาน", "อีเมล", "Role", "แผนก", "เข้าใช้ล่าสุด", "สถานะ", ""].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.name.includes(search) || u.email.includes(search)).map((u) => (
                    <tr key={u.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[0.65rem] font-600 flex-shrink-0"
                            style={{ background: u.role === "admin" ? "var(--primary)" : u.role === "sales" ? "var(--chart-3)" : u.role === "stock" ? "var(--chart-4)" : u.role === "marketing" ? "#ea580c" : "var(--chart-2)" }}
                          >
                            {u.name[0]}
                          </div>
                          <span className="font-500">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)]">{u.email}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>{roleLabel[u.role]}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)]">{u.dept}</td>
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)] whitespace-nowrap">{u.lastLogin}</td>
                      <td className="px-4 py-2.5">{statusBadge(u.status)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setUserModal({ mode: "edit", user: u })}
                            className="flex items-center gap-1 px-2.5 h-7 rounded-md text-[0.72rem] font-500 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
                          >
                            <FileEdit size={12} />แก้ไข
                          </button>
                          <button
                            onClick={() => setDeletingUser(u)}
                            className="flex items-center gap-1 px-2.5 h-7 rounded-md text-[0.72rem] font-500 border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={12} />ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "permissions" && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-[var(--shadow-sm)]">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2 flex-wrap">
              <Shield size={14} style={{ color: "var(--primary)" }} />
              <span className="font-600 text-sm">Permission Matrix</span>
              <span className="text-[0.72rem] text-[var(--muted-foreground)]">คลิกที่ช่องเพื่อสลับสิทธิ์ · เพิ่ม/แก้ไข/ลบ รายการได้</span>
              <div className="ml-auto flex items-center gap-3 text-[0.68rem] text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1"><span className="text-green-500 font-600">✓</span> มีสิทธิ์</span>
                <span className="flex items-center gap-1"><span className="text-amber-500 font-600">~</span> สิทธิ์จำกัด / ต้องอนุมัติ</span>
                <span className="flex items-center gap-1"><span className="font-600 text-[var(--muted-foreground)]">—</span> ไม่มีสิทธิ์</span>
                <button
                  onClick={() => setPermModal({ mode: "add" })}
                  className="flex items-center gap-1 px-2.5 h-7 rounded-md text-[0.72rem] font-500 text-white"
                  style={{ background: "var(--primary)" }}
                >
                  <Plus size={12} />เพิ่มสิทธิ์
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[0.8rem]">
                <thead style={{ background: "var(--muted)" }}>
                  <tr>
                    <th className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)] min-w-[280px]">ฟังก์ชัน</th>
                    {[
                      { label: "ผู้บริหาร", color: "#e60023" },
                      { label: "เซลส์", color: "#2563eb" },
                      { label: "การตลาด", color: "#ea580c" },
                      { label: "สต็อก", color: "#0d9488" },
                      { label: "บัญชี", color: "#7c3aed" },
                    ].map(r => (
                      <th key={r.label} className="px-3 py-2.5 text-center font-600 text-[0.75rem] whitespace-nowrap" style={{ color: r.color }}>{r.label}</th>
                    ))}
                    <th className="px-3 py-2.5 text-right font-600 text-[0.75rem] text-[var(--muted-foreground)]">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {permRows.map((row, idx) => {
                    if (row.type === "group") {
                      return (
                        <tr key={`g-${idx}`}>
                          <td colSpan={7} className="px-4 py-1.5 text-[0.68rem] font-700 uppercase tracking-widest" style={{ background: "var(--accent)", color: "var(--primary)" }}>
                            {row.label}
                          </td>
                        </tr>
                      );
                    }
                    const cell = (role: RoleKey) => {
                      const v = row[role];
                      const content = v === true
                        ? <span className="text-green-500 font-700 text-base">✓</span>
                        : v === "partial"
                          ? <span className="text-amber-500 font-700 text-base">~</span>
                          : <span className="text-[var(--muted-foreground)]">—</span>;
                      return (
                        <button
                          onClick={() => cyclePermCell(idx, role)}
                          className="w-7 h-7 rounded-md hover:bg-[var(--accent)] transition-colors"
                          title="คลิกเพื่อสลับสิทธิ์"
                        >
                          {content}
                        </button>
                      );
                    };
                    return (
                      <tr key={`r-${idx}`} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="text-[0.8rem]">{row.feature}</div>
                          {row.note && <div className="text-[0.68rem] text-amber-600 mt-0.5">{row.note}</div>}
                        </td>
                        <td className="px-3 py-2.5 text-center">{cell("admin")}</td>
                        <td className="px-3 py-2.5 text-center">{cell("sales")}</td>
                        <td className="px-3 py-2.5 text-center">{cell("marketing")}</td>
                        <td className="px-3 py-2.5 text-center">{cell("stock")}</td>
                        <td className="px-3 py-2.5 text-center">{cell("accounting")}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setPermModal({ mode: "edit", index: idx })}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent)] transition-colors"
                              title="แก้ไขรายการ"
                            >
                              <FileEdit size={13} />
                            </button>
                            <button
                              onClick={() => setDeletingPerm({ index: idx, feature: row.feature })}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="ลบรายการ"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "approval" && (
          <div className="space-y-4">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-sm)]">
              <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch size={14} style={{ color: "var(--primary)" }} />
                  <span className="font-600 text-sm">Approval Rule</span>
                  <span className="text-[0.72rem] text-[var(--muted-foreground)]">เงื่อนไขที่ระบบส่งเรื่องขออนุมัติอัตโนมัติ (6 กรณี)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[0.72rem] text-[var(--muted-foreground)]">เปิดใช้งาน</span>
                  <Badge variant="default">{approvalRules.filter(r => r.active).length}/{approvalRules.length}</Badge>
                </div>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {approvalRules.map((rule, idx) => (
                  <div key={rule.id} className="px-4 py-3.5 hover:bg-[var(--muted)] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[0.62rem] font-700 flex-shrink-0 mt-0.5"
                          style={{ background: rule.active ? "var(--primary)" : "var(--muted-foreground)" }}
                        >
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-600 text-[0.87rem]">{rule.trigger}</span>
                            <Badge variant="secondary" className="text-[0.67rem]">{rule.module}</Badge>
                            {!rule.active && <Badge variant="outline" className="text-[0.67rem] text-[var(--muted-foreground)]">ปิดใช้งาน</Badge>}
                          </div>
                          <p className="text-[0.78rem] text-[var(--muted-foreground)] mt-0.5">{rule.desc}</p>

                          <div className="flex items-center gap-4 mt-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[0.7rem] text-[var(--muted-foreground)]">เงื่อนไข:</span>
                              <span className="text-[0.75rem] font-500">{rule.condition}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-[0.7rem] text-[var(--muted-foreground)]">ผู้อนุมัติ:</span>
                            <div className="flex items-center gap-1">
                              {rule.approvers.map((a, i) => (
                                <div key={a} className="flex items-center gap-1">
                                  {i > 0 && <ChevronRight size={11} className="text-[var(--muted-foreground)]" />}
                                  <span
                                    className="text-[0.72rem] px-2 py-0.5 rounded-full font-500"
                                    style={{
                                      background: a === "ผู้บริหาร" ? "color-mix(in srgb, var(--primary) 12%, transparent)" : "color-mix(in srgb, var(--chart-2) 15%, transparent)",
                                      color: a === "ผู้บริหาร" ? "var(--primary)" : "oklch(0.5 0.16 60)",
                                    }}
                                  >
                                    {a}
                                  </span>
                                </div>
                              ))}
                              <span className="text-[0.68rem] text-[var(--muted-foreground)] ml-1">
                                ({rule.levels} ระดับ)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0 mt-1">
                        <span className="text-[0.72rem] text-[var(--muted-foreground)]">
                          {rule.active ? "เปิด" : "ปิด"}
                        </span>
                        <button
                          onClick={() => toggleRule(rule.id)}
                          className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0"
                          style={{ background: rule.active ? "var(--primary)" : "var(--border)" }}
                        >
                          <span
                            className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all"
                            style={{ left: rule.active ? "calc(100% - 1.125rem)" : "0.125rem" }}
                          />
                        </button>
                        <button className="text-[0.72rem] text-[var(--primary)] hover:underline whitespace-nowrap">
                          แก้ไข
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
              <div className="text-[0.78rem] font-600 mb-2" style={{ color: "var(--primary)" }}>หมายเหตุ</div>
              <ul className="space-y-1 text-[0.75rem] text-[var(--muted-foreground)]">
                <li>• เมื่อระบบตรวจพบเงื่อนไขที่ตรงกับ Rule ที่เปิดใช้งาน จะสร้าง Approval Request อัตโนมัติ</li>
                <li>• Rule ที่มี 2 ระดับ ต้องผ่านผู้อนุมัติลำดับแรกก่อน จึงส่งต่อลำดับถัดไป</li>
                <li>• Rule ที่ปิดใช้งาน รายการที่ trigger จะผ่านโดยอัตโนมัติโดยไม่ต้องรออนุมัติ</li>
              </ul>
            </div>
          </div>
        )}

        {tab === "log" && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-[var(--shadow-sm)]">
            <div className="overflow-x-auto">
              <table className="w-full text-[0.82rem]">
                <thead style={{ background: "var(--muted)" }}>
                  <tr>
                    {["เวลา", "ผู้ทำรายการ", "Action", "รายละเอียด", "Module"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockActivityLog.map((l) => (
                    <tr key={l.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)] whitespace-nowrap">{l.time}</td>
                      <td className="px-4 py-2.5 font-500">{l.user}</td>
                      <td className="px-4 py-2.5 font-500">{l.action}</td>
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)] max-w-[300px]">{l.detail}</td>
                      <td className="px-4 py-2.5"><Badge variant="secondary">{l.module}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "config" && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-sm)]">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <span className="font-600 text-sm">System Configuration</span>
              <span className="text-[0.72rem] text-[var(--muted-foreground)] ml-2">ค่าพารามิเตอร์ที่ผู้บริหารปรับได้</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {systemConfig.map((c) => (
                <div key={c.key} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-[0.83rem] font-500">{c.label}</div>
                    <div className="text-[0.72rem] text-[var(--muted-foreground)]">{c.desc}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      defaultValue={c.value}
                      className="w-28 h-8 px-3 text-[0.82rem] text-right border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)] bg-[var(--muted)]"
                    />
                    <button className="px-2.5 h-8 text-[0.78rem] font-500 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
                      บันทึก
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {userModal && (
        <UserModal
          user={userModal.mode === "edit" ? userModal.user : undefined}
          onClose={() => setUserModal(null)}
          onSubmit={(data) => {
            if (userModal.mode === "edit") updateUser(userModal.user.id, data);
            else addUser(data);
            setUserModal(null);
          }}
        />
      )}

      {deletingUser && (
        <ConfirmModal
          title="ยืนยันการลบผู้ใช้"
          message={<>ต้องการลบ <span className="font-700">{deletingUser.name}</span> ({roleLabel[deletingUser.role]}) ออกจากระบบหรือไม่?</>}
          onClose={() => setDeletingUser(null)}
          onConfirm={() => { deleteUser(deletingUser.id); setDeletingUser(null); }}
        />
      )}

      {deletingPerm && (
        <ConfirmModal
          title="ยืนยันการลบสิทธิ์"
          message={<>ต้องการลบสิทธิ์ <span className="font-700">{deletingPerm.feature}</span> ออกจาก Permission Matrix หรือไม่?</>}
          onClose={() => setDeletingPerm(null)}
          onConfirm={() => { deletePermission(deletingPerm.index); setDeletingPerm(null); }}
        />
      )}

      {permModal && (
        <PermissionModal
          row={permModal.mode === "edit" ? (permRows[permModal.index] as Extract<PermRow, { type: "row" }>) : undefined}
          groups={permGroups}
          onClose={() => setPermModal(null)}
          onSubmit={(data) => {
            savePermission(data, permModal.mode === "edit" ? permModal.index : undefined);
            setPermModal(null);
          }}
        />
      )}
    </>
  );
}

/* ── Modal เปลือก ── */
function Modal({ title, subtitle, onClose, children, footer }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--card)] rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-700 text-base">{title}</h2>
            {subtitle && <p className="text-[0.72rem] text-[var(--muted-foreground)]">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--muted)] transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-4 space-y-3.5 overflow-y-auto">{children}</div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]">{footer}</div>
      </div>
    </div>
  );
}

const fieldInput = "w-full h-9 px-3 text-[0.85rem] border border-[var(--border)] rounded-lg outline-none bg-[var(--card)] focus:border-[var(--ring)]";
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[0.78rem] font-500 mb-1.5">{label}{required && <span className="text-red-500"> *</span>}</label>
      {children}
    </div>
  );
}

/* ── เพิ่ม/แก้ไขผู้ใช้ ── */
function UserModal({ user, onClose, onSubmit }: {
  user?: User;
  onClose: () => void;
  onSubmit: (data: Omit<User, "id" | "lastLogin">) => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<string>(user?.role ?? "sales");
  const [dept, setDept] = useState(user?.dept ?? "-");
  const [status, setStatus] = useState<string>(user?.status ?? "active");
  const invalid = !name.trim() || !email.trim();

  return (
    <Modal
      title={user ? "แก้ไขผู้ใช้งาน" : "เพิ่มผู้ใช้งาน"}
      subtitle={user ? user.email : "เพิ่มบัญชีผู้ใช้และกำหนด Role"}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 h-9 rounded-lg text-[0.82rem] font-500 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">ยกเลิก</button>
          <button
            onClick={() => onSubmit({ name, email, role, dept, status })}
            disabled={invalid}
            className="flex items-center gap-1.5 px-5 h-9 rounded-lg text-[0.82rem] font-600 text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--primary)" }}
          >
            <Plus size={14} />{user ? "บันทึก" : "เพิ่มผู้ใช้"}
          </button>
        </>
      }
    >
      <Field label="ชื่อ-นามสกุล" required><input className={fieldInput} value={name} onChange={e => setName(e.target.value)} placeholder="เช่น สมชาย ใจดี" /></Field>
      <Field label="อีเมล" required><input className={fieldInput} value={email} onChange={e => setEmail(e.target.value)} placeholder="name@solarsell.co.th" /></Field>
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="Role" required>
          <select className={fieldInput} value={role} onChange={e => setRole(e.target.value)}>
            {ROLE_KEYS.map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}
          </select>
        </Field>
        <Field label="สถานะ">
          <select className={fieldInput} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="active">ใช้งาน</option>
            <option value="inactive">ปิดใช้</option>
          </select>
        </Field>
      </div>
      <Field label="แผนก"><input className={fieldInput} value={dept} onChange={e => setDept(e.target.value)} placeholder="-" /></Field>
    </Modal>
  );
}

/* ── เพิ่ม/แก้ไขสิทธิ์การเข้าถึง ── */
const PERM_OPTIONS: { value: PermVal; label: string }[] = [
  { value: true, label: "✓ มีสิทธิ์" },
  { value: "partial", label: "~ จำกัด / ต้องอนุมัติ" },
  { value: false, label: "— ไม่มีสิทธิ์" },
];
function PermissionModal({ row, groups, onClose, onSubmit }: {
  row?: Extract<PermRow, { type: "row" }>;
  groups: string[];
  onClose: () => void;
  onSubmit: (data: { group: string; feature: string; note?: string } & Record<RoleKey, PermVal>) => void;
}) {
  const [group, setGroup] = useState(groups[0] ?? "ทั่วไป");
  const [newGroup, setNewGroup] = useState("");
  const [feature, setFeature] = useState(row?.feature ?? "");
  const [note, setNote] = useState(row?.note ?? "");
  const [vals, setVals] = useState<Record<RoleKey, PermVal>>({
    admin: row?.admin ?? true, sales: row?.sales ?? false, marketing: row?.marketing ?? false,
    stock: row?.stock ?? false, accounting: row?.accounting ?? false,
  });
  const invalid = !feature.trim() || (!row && !group.trim() && !newGroup.trim());
  const setVal = (r: RoleKey, v: PermVal) => setVals(prev => ({ ...prev, [r]: v }));

  return (
    <Modal
      title={row ? "แก้ไขสิทธิ์การเข้าถึง" : "เพิ่มสิทธิ์การเข้าถึง"}
      subtitle={row ? row.feature : "กำหนดฟังก์ชันและสิทธิ์ของแต่ละ Role"}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 h-9 rounded-lg text-[0.82rem] font-500 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">ยกเลิก</button>
          <button
            onClick={() => onSubmit({ group: newGroup.trim() || group, feature, note: note.trim(), ...vals })}
            disabled={invalid}
            className="flex items-center gap-1.5 px-5 h-9 rounded-lg text-[0.82rem] font-600 text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--primary)" }}
          >
            <Plus size={14} />{row ? "บันทึก" : "เพิ่มสิทธิ์"}
          </button>
        </>
      }
    >
      {!row && (
        <Field label="หมวด" required>
          <select className={fieldInput} value={group} onChange={e => setGroup(e.target.value)}>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <input className={`${fieldInput} mt-2`} value={newGroup} onChange={e => setNewGroup(e.target.value)} placeholder="หรือพิมพ์หมวดใหม่..." />
        </Field>
      )}
      <Field label="ชื่อฟังก์ชัน / สิทธิ์" required><input className={fieldInput} value={feature} onChange={e => setFeature(e.target.value)} placeholder="เช่น Export รายงานยอดขาย" /></Field>
      <Field label="หมายเหตุ (ถ้ามี)"><input className={fieldInput} value={note} onChange={e => setNote(e.target.value)} placeholder="เช่น เซลส์: เห็นเฉพาะของตัวเอง" /></Field>
      <div className="space-y-2">
        <label className="block text-[0.78rem] font-500">สิทธิ์ของแต่ละ Role</label>
        {ROLE_KEYS.map(r => (
          <div key={r} className="flex items-center gap-2">
            <span className="w-20 text-[0.8rem] text-[var(--muted-foreground)]">{roleLabel[r]}</span>
            <div className="flex gap-1 flex-1">
              {PERM_OPTIONS.map(opt => {
                const on = vals[r] === opt.value;
                return (
                  <button
                    key={String(opt.value)}
                    onClick={() => setVal(r, opt.value)}
                    className={`flex-1 h-8 rounded-md text-[0.72rem] font-500 border transition-colors ${on ? "border-[var(--primary)] bg-[var(--accent)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ── ยืนยันการลบ ── */
function ConfirmModal({ title, message, onClose, onConfirm }: {
  title: string; message: React.ReactNode; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 h-9 rounded-lg text-[0.82rem] font-500 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">ยกเลิก</button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-5 h-9 rounded-lg text-[0.82rem] font-600 text-white transition-colors hover:opacity-90"
            style={{ background: "#dc2626" }}
          >
            <Trash2 size={14} />ลบ
          </button>
        </>
      }
    >
      <div className="text-[0.85rem]">{message}</div>
    </Modal>
  );
}
