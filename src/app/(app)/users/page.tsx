"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Badge, statusBadge } from "@/components/ui/badge";
import { mockUsers, mockActivityLog, roleLabel } from "@/lib/mock-data";
import { Users, History, Shield, Settings, Plus, Search, GitBranch, ChevronRight } from "lucide-react";

type Tab = "users" | "permissions" | "approval" | "log" | "config";

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

const permissionMatrix = [
  { feature: "Product Master — สร้าง/แก้ไข", admin: true, sales: false, stock: true, accounting: false },
  { feature: "Product Master — ดูราคาทุน", admin: true, sales: false, stock: true, accounting: true },
  { feature: "Supplier Master — ข้อมูลทั่วไป", admin: true, sales: false, stock: true, accounting: false },
  { feature: "Supplier Master — ข้อมูลการเงิน", admin: true, sales: false, stock: false, accounting: true },
  { feature: "Purchase Order — สร้าง", admin: true, sales: false, stock: true, accounting: false },
  { feature: "Sales Order — สร้าง", admin: true, sales: true, stock: false, accounting: false },
  { feature: "Commission — ดูของตัวเอง", admin: true, sales: true, stock: false, accounting: false },
  { feature: "Commission — ดูทั้งหมด", admin: true, sales: false, stock: false, accounting: true },
  { feature: "Approval — อนุมัติ", admin: true, sales: false, stock: false, accounting: false },
  { feature: "System Configuration", admin: true, sales: false, stock: false, accounting: false },
  { feature: "Activity Log — ดูทั้งหมด", admin: true, sales: false, stock: false, accounting: false },
  { feature: "Peak Integration", admin: true, sales: false, stock: false, accounting: true },
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
                  {mockUsers.filter(u => u.name.includes(search) || u.email.includes(search)).map((u) => (
                    <tr key={u.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[0.65rem] font-600 flex-shrink-0"
                            style={{ background: u.role === "admin" ? "var(--primary)" : u.role === "sales" ? "var(--chart-3)" : u.role === "stock" ? "var(--chart-4)" : "var(--chart-2)" }}
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
                        <button className="text-[0.72rem] text-[var(--primary)] hover:underline">แก้ไข</button>
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
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
              <Shield size={14} style={{ color: "var(--primary)" }} />
              <span className="font-600 text-sm">Permission Matrix</span>
              <span className="text-[0.72rem] text-[var(--muted-foreground)] ml-1">สิทธิ์การเข้าถึงแต่ละฟังก์ชันตาม Role</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[0.8rem]">
                <thead style={{ background: "var(--muted)" }}>
                  <tr>
                    <th className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)]">ฟังก์ชัน</th>
                    {["ผู้บริหาร", "เซลส์", "สต็อก", "บัญชี"].map(r => (
                      <th key={r} className="px-4 py-2.5 text-center font-600 text-[0.75rem] text-[var(--muted-foreground)]">{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissionMatrix.map((p) => (
                    <tr key={p.feature} className="border-t border-[var(--border)]">
                      <td className="px-4 py-2">{p.feature}</td>
                      {[p.admin, p.sales, p.stock, p.accounting].map((has, i) => (
                        <td key={i} className="px-4 py-2 text-center">
                          {has
                            ? <span className="text-green-500 text-lg">✓</span>
                            : <span className="text-[var(--muted-foreground)] text-lg">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
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
    </>
  );
}
