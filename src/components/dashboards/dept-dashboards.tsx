"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge, statusBadge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  mockSalesByDept, mockSalesTrend,
  mockApprovals, mockCommissions,
  mockProducts, mockPurchaseOrders, mockMovementLog, mockReturns,
  mockSalesOrders, mockCustomers, mockPromotions, mockPromoPerformance,
} from "@/lib/mock-data";
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, Package, AlertTriangle,
  ArrowUpRight, Clock,
  PackageCheck, Undo2, History, Users, Tag,
  ArrowDownLeft, RotateCcw, Edit2, Megaphone, BarChart2,
  Percent,
} from "lucide-react";
import { BahtSign } from "@/components/ui/baht-sign";

export function StatCard({
  title, value, sub, icon: Icon, trend, color = "var(--primary)",
}: {
  title: string; value: string; sub?: string;
  icon: React.ElementType; trend?: string; color?: string;
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
          <Icon size={17} style={{ color }} />
        </div>
        {trend && (
          <span className="flex items-center gap-0.5 text-[0.7rem] text-green-600 font-500">
            <ArrowUpRight size={11} />{trend}
          </span>
        )}
      </div>
      <div className="text-[1.5rem] font-700 leading-tight">{value}</div>
      <div className="text-[0.75rem] text-[var(--muted-foreground)] mt-0.5">{title}</div>
      {sub && <div className="text-[0.7rem] text-[var(--muted-foreground)] mt-1">{sub}</div>}
    </div>
  );
}

/* ── Stock Dashboard ── */
export function StockDashboard() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t); }, []);

  const lowStock = mockProducts.filter(p => p.stock <= p.reorderPoint);
  const pendingPO = mockPurchaseOrders.filter(po => po.status === "pending" || po.status === "partial" || po.status === "approved");
  const pendingReturns = mockReturns.filter(r => r.status === "inspecting");

  const stockChartData = mockProducts.slice(0, 6).map(p => ({
    name: p.sku.split("-").slice(0, 2).join("-"),
    stock: p.stock,
    reorder: p.reorderPoint,
  }));

  const movTypeColor: Record<string, string> = { in: "#22c55e", out: "#ef4444", adjust: "#f59e0b", return: "#3b82f6" };
  const movTypeLabel: Record<string, string> = { in: "รับเข้า", out: "ตัดออก", adjust: "ปรับยอด", return: "รับคืน" };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="สินค้าทั้งหมด" value={`${mockProducts.length} SKU`} sub="รายการสินค้าในระบบ" icon={Package} color="#0d9488" />
        <StatCard title="สต็อกต่ำกว่า Reorder" value={`${lowStock.length} SKU`} sub="ต้องสั่งซื้อเพิ่ม" icon={AlertTriangle} color="var(--destructive)" />
        <StatCard title="PO รอดำเนินการ" value={`${pendingPO.length} รายการ`} sub="รอรับสินค้าเข้าคลัง" icon={PackageCheck} color="var(--warning)" />
        <StatCard title="Return รอตรวจ" value={`${pendingReturns.length} รายการ`} sub="อยู่ระหว่างตรวจสภาพ" icon={Undo2} color="#0d9488" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
          <div className="font-600 text-sm mb-1">ระดับสต็อก vs Reorder Point</div>
          <div className="text-[0.72rem] text-[var(--muted-foreground)] mb-4">ยอดคงเหลือเปรียบเทียบกับจุดสั่งซื้อ</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart key={ready ? 1 : 0} data={stockChartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v, name) => [formatNumber(Number(v)), name === "stock" ? "สต็อกคงเหลือ" : "Reorder Point"]} />
              <Bar dataKey="stock" name="stock" radius={[4, 4, 0, 0]} animationDuration={1200}>
                {stockChartData.map((d, i) => (
                  <Cell key={i} fill={d.stock <= d.reorder ? "#e60023" : "#f87171"} />
                ))}
              </Bar>
              <Bar dataKey="reorder" name="reorder" fill="#fecaca" radius={[4, 4, 0, 0]} animationDuration={1200} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            {[["#f87171", "สต็อกปกติ"], ["#e60023", "ต่ำกว่า Reorder"], ["#fecaca", "Reorder Point"]].map(([bg, label]) => (
              <div key={label} className="flex items-center gap-1.5 text-[0.72rem] text-[var(--muted-foreground)]">
                <div className="w-3 h-3 rounded-sm" style={{ background: bg }} />{label}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-1.5 mb-3">
            <History size={14} className="text-[var(--muted-foreground)]" />
            <div className="font-600 text-sm">การเคลื่อนไหวล่าสุด</div>
          </div>
          <div className="space-y-2.5">
            {mockMovementLog.slice(0, 6).map((m) => (
              <div key={m.id} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: movTypeColor[m.type] + "20" }}>
                  {m.type === "in" && <ArrowUpRight size={11} style={{ color: movTypeColor.in }} />}
                  {m.type === "out" && <ArrowDownLeft size={11} style={{ color: movTypeColor.out }} />}
                  {m.type === "return" && <RotateCcw size={11} style={{ color: movTypeColor.return }} />}
                  {m.type === "adjust" && <Edit2 size={11} style={{ color: movTypeColor.adjust }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.73rem] font-500 truncate">{m.product.split(" ").slice(0, 3).join(" ")}</span>
                    <span className={`text-[0.72rem] font-600 ml-1 flex-shrink-0 ${m.qty > 0 ? "text-green-600" : "text-red-600"}`}>
                      {m.qty > 0 ? "+" : ""}{m.qty}
                    </span>
                  </div>
                  <div className="text-[0.68rem] text-[var(--muted-foreground)]">{movTypeLabel[m.type]} · {m.date.split(" ")[1]}</div>
                </div>
              </div>
            ))}
          </div>
          <Link href="/stock" className="mt-3 flex items-center justify-center gap-1 w-full py-1.5 rounded-lg text-[0.75rem] font-500 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
            ดู Movement Log ทั้งหมด <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} style={{ color: "var(--destructive)" }} />
            <div className="font-600 text-sm">สต็อกต่ำกว่า Reorder</div>
            {lowStock.length > 0 && <Badge variant="error">{lowStock.length} รายการ</Badge>}
          </div>
          <div className="space-y-2">
            {lowStock.map((p) => {
              const pct = Math.round((p.stock / p.reorderPoint) * 100);
              return (
                <div key={p.id} className="p-2.5 rounded-lg border border-red-100 bg-red-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[0.78rem] font-500">{p.name}</div>
                      <div className="text-[0.7rem] text-[var(--muted-foreground)] font-mono">{p.sku}</div>
                    </div>
                    <span className="text-[0.72rem] text-red-600 font-600 ml-2 flex-shrink-0">{p.stock} / {p.reorderPoint}</span>
                  </div>
                  <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: "#fecaca" }}>
                    <div className="h-full rounded-full" style={{ width: ready ? `${Math.min(pct, 100)}%` : "0%", background: "#ef4444", transition: "width 0.9s ease" }} />
                  </div>
                  <div className="text-[0.65rem] text-red-500 mt-1">ต้องสั่งซื้อเพิ่ม {p.reorderQty} ชิ้น</div>
                </div>
              );
            })}
            {lowStock.length === 0 && <div className="text-center text-[0.8rem] text-[var(--muted-foreground)] py-4">สต็อกทุกรายการปกติ</div>}
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2 mb-3">
            <PackageCheck size={15} className="text-amber-500" />
            <div className="font-600 text-sm">Purchase Order รอดำเนินการ</div>
          </div>
          <div className="space-y-2">
            {pendingPO.map((po) => (
              <div key={po.id} className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--muted)]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-[0.72rem] font-500" style={{ color: "var(--primary)" }}>{po.id}</div>
                    <div className="text-[0.75rem] font-500 mt-0.5">{po.supplierName.replace("บริษัท ", "").replace(" จำกัด", "")}</div>
                  </div>
                  {statusBadge(po.status)}
                </div>
                <div className="text-[0.7rem] text-[var(--muted-foreground)] mt-1">{po.items[0].product} ({po.items[0].qty} ชิ้น)</div>
                <div className="text-[0.72rem] font-500 mt-0.5">{formatCurrency(po.total)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2 mb-3">
            <Undo2 size={15} style={{ color: "#0d9488" }} />
            <div className="font-600 text-sm">Return รอตรวจสภาพ</div>
            {pendingReturns.length > 0 && <Badge variant="info">{pendingReturns.length} รายการ</Badge>}
          </div>
          <div className="space-y-2">
            {mockReturns.map((r) => (
              <div key={r.id} className={`p-2.5 rounded-lg border ${r.status === "inspecting" ? "border-teal-200 bg-teal-50" : "border-[var(--border)]"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-[0.72rem] font-500" style={{ color: "var(--primary)" }}>{r.id}</div>
                    <div className="text-[0.75rem] mt-0.5 truncate max-w-[160px]">{r.customer.replace("บริษัท ", "").replace(" จำกัด", "")}</div>
                  </div>
                  {statusBadge(r.status)}
                </div>
                <div className="text-[0.7rem] text-[var(--muted-foreground)] mt-1">{r.product} · {r.qty} ชิ้น</div>
                <div className="text-[0.7rem] mt-0.5">
                  <span className={r.withinPeriod ? "text-[var(--muted-foreground)]" : "text-red-600 font-500"}>
                    {r.returnDays} วัน {!r.withinPeriod && "(เกินกำหนด)"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sales Dashboard ── */
export function SalesDashboard() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t); }, []);

  const salesName = "วิภา สุขใจ";
  const mySOs = mockSalesOrders.filter(so => so.salesBy === salesName);
  const myClosedSOs = mySOs.filter(so => so.status === "closed");
  const myTotalSales = myClosedSOs.reduce((s, so) => s + so.total, 0);
  const myCommissions = mockCommissions.filter(c => c.sales === salesName);
  const myCommConfirmed = myCommissions.filter(c => c.status === "confirmed").reduce((s, c) => s + c.amount, 0);
  const myCommPending = myCommissions.filter(c => c.status === "pending").reduce((s, c) => s + c.amount, 0);
  const myCustomers = mockCustomers.filter(c => c.salesOwner === salesName);
  const myPendingApprovals = mockApprovals.filter(a => a.requestBy === salesName && a.status === "pending");
  const activePromotions = mockPromotions.filter(p => p.status === "active");

  const commByDept = myCommissions.reduce((acc, c) => {
    if (c.status === "cancelled") return acc;
    acc[c.dept] = (acc[c.dept] ?? 0) + c.amount;
    return acc;
  }, {} as Record<string, number>);
  const commChartData = Object.entries(commByDept).map(([dept, amount]) => ({ dept, amount }));

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="ยอดขาย (เดือน)" value={formatCurrency(myTotalSales)} sub={`${myClosedSOs.length} ใบสั่งขาย`} icon={TrendingUp} trend="+14.4%" color="#2563eb" />
        <StatCard title="คอมมิชชั่น (confirmed)" value={formatCurrency(myCommConfirmed)} sub={myCommPending > 0 ? `Pending ${formatCurrency(myCommPending)}` : "ยืนยันแล้วทั้งหมด"} icon={BahtSign} color="#059669" />
        <StatCard title="ลูกค้า" value={`${myCustomers.length} ราย`} sub={myCustomers.map(c => c.tier).filter((v, i, a) => a.indexOf(v) === i).join(", ")} icon={Users} color="#2563eb" />
        <StatCard title="รออนุมัติ" value={`${myPendingApprovals.length} รายการ`} sub="คำขอส่วนลดค้างอยู่" icon={Clock} color="var(--warning)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-600 text-sm">ยอดขายรายเดือน (ภาพรวมบริษัท)</div>
              <div className="text-[0.72rem] text-[var(--muted-foreground)]">มกราคม — มิถุนายน 2567</div>
            </div>
            <Badge variant="success">+14.4% MoM</Badge>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart key={ready ? 1 : 0} data={mockSalesTrend}>
              <defs>
                <linearGradient id="salesGradDept" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e60023" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e60023" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v) => [formatCurrency(Number(v)), "ยอดขาย"]} />
              <Area type="monotone" dataKey="value" stroke="#e60023" strokeWidth={2} fill="url(#salesGradDept)" animationDuration={1400} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
          <div className="font-600 text-sm mb-1">คอมมิชชั่น (รายแผนก)</div>
          <div className="text-[0.72rem] text-[var(--muted-foreground)] mb-4">มิถุนายน 2567</div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart key={ready ? 1 : 0} data={commChartData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <YAxis type="category" dataKey="dept" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={60} />
              <Tooltip formatter={(v) => [formatCurrency(Number(v)), "คอมมิชชั่น"]} />
              <Bar dataKey="amount" fill="#e60023" radius={[0, 4, 4, 0]} animationDuration={1200} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <div className="flex justify-between text-[0.75rem]">
              <span className="text-[var(--muted-foreground)]">รวม Confirmed</span>
              <span className="font-600 text-green-600">{formatCurrency(myCommConfirmed)}</span>
            </div>
            <div className="flex justify-between text-[0.75rem] mt-1">
              <span className="text-[var(--muted-foreground)]">รอยืนยัน</span>
              <span className="font-600 text-amber-600">{formatCurrency(myCommPending)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
          <div className="font-600 text-sm mb-3">ใบสั่งขายล่าสุด</div>
          <div className="space-y-2">
            {mySOs.map((so) => (
              <div key={so.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.72rem] font-500" style={{ color: "var(--primary)" }}>{so.id}</span>
                    {statusBadge(so.status)}
                  </div>
                  <div className="text-[0.78rem] font-500 mt-0.5 truncate">{so.customer}</div>
                  <div className="text-[0.7rem] text-[var(--muted-foreground)]">{so.items.map((i: any) => i.name.split(" ").slice(0, 3).join(" ")).join(", ")}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-600 text-[0.85rem]">{formatCurrency(so.total)}</div>
                  <div className="text-[0.68rem] text-[var(--muted-foreground)]">{so.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-1.5 mb-3">
              <Users size={14} style={{ color: "#2563eb" }} />
              <div className="font-600 text-sm">ลูกค้า</div>
            </div>
            <div className="space-y-2">
              {myCustomers.map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.78rem] font-500 truncate">{c.name.replace("บริษัท ", "").replace(" จำกัด", "")}</div>
                    <div className="text-[0.68rem] text-[var(--muted-foreground)]">{c.totalOrders} orders · {formatCurrency(c.totalValue)}</div>
                  </div>
                  <Badge variant="secondary">{c.tier}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-1.5 mb-3">
              <Tag size={14} className="text-green-600" />
              <div className="font-600 text-sm">โปรโมชั่น Active</div>
            </div>
            <div className="space-y-2">
              {activePromotions.map((pr) => (
                <div key={pr.id} className="p-2.5 rounded-lg border border-green-100 bg-green-50">
                  <div className="text-[0.78rem] font-500">{pr.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[0.7rem] text-green-700 font-600">
                      {pr.type === "percent" ? `-${pr.value}%` : `-${formatCurrency(pr.value)}`}
                    </span>
                    <span className="text-[0.65rem] text-[var(--muted-foreground)]">ถึง {pr.endDate}</span>
                  </div>
                  <div className="text-[0.65rem] text-[var(--muted-foreground)] mt-0.5">{pr.tier.join(", ")}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Marketing Dashboard ── */
export function MarketingDashboard() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t); }, []);

  const activePromos = mockPromotions.filter(p => p.status === "active");
  const pendingPromos = mockPromotions.filter(p => p.status === "pending-approval");
  const scheduledPromos = mockPromotions.filter(p => p.status === "scheduled");
  const totalPromoRevenueReal = mockPromoPerformance.reduce((s, m) => s + m.promoRevenue, 0);
  const conversionRate = 18.4;
  const pendingApprovals = mockApprovals.filter(a => a.status === "pending" && a.requestBy === "นิดา มาร์เก็ตติ้ง");

  const promoStatusColor: Record<string, string> = {
    active: "#059669", scheduled: "#2563eb", "pending-approval": "#d97706", expired: "#6b7280",
  };
  const promoStatusLabel: Record<string, string> = {
    active: "Active", scheduled: "Scheduled", "pending-approval": "รออนุมัติ", expired: "หมดอายุ",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="โปรโมชั่น Active" value={`${activePromos.length} แคมเปญ`} sub={`Scheduled: ${scheduledPromos.length}`} icon={Megaphone} color="#ea580c" trend="+1 เดือนนี้" />
        <StatCard title="รายได้จากโปร (มิ.ย.)" value={formatCurrency(mockPromoPerformance[5].promoRevenue)} sub={`รวมทุกเดือน ${formatCurrency(totalPromoRevenueReal)}`} icon={TrendingUp} color="#ea580c" trend="+37.8%" />
        <StatCard title="Conversion Rate" value={`${conversionRate}%`} sub="ใช้โปรต่อ Order ทั้งหมด" icon={BarChart2} color="#059669" trend="+2.1%" />
        <StatCard title="รออนุมัติ" value={`${pendingPromos.length + pendingApprovals.length} รายการ`} sub="โปรโมชั่นส่งขออนุมัติ" icon={Clock} color="#d97706" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
          <div className="text-[0.85rem] font-600 mb-1">รายได้: โปรโมชั่น vs ปกติ</div>
          <div className="text-[0.72rem] text-[var(--muted-foreground)] mb-4">เปรียบเทียบยอดขาย 6 เดือน</div>
          <div style={{ opacity: ready ? 1 : 0, transition: "opacity 0.4s" }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mockPromoPerformance} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="promoRevenue" name="ยอดขาย (ใช้โปร)" fill="#e60023" radius={[3, 3, 0, 0]} />
                <Bar dataKey="normalRevenue" name="ยอดขาย (ปกติ)" fill="#f87171" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2">
            {[["#e60023", "ยอดขาย (ใช้โปร)"], ["#f87171", "ยอดขาย (ปกติ)"]].map(([bg, label]) => (
              <div key={label} className="flex items-center gap-1.5 text-[0.7rem] text-[var(--muted-foreground)]">
                <div className="w-3 h-3 rounded-sm" style={{ background: bg }} />{label}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
          <div className="text-[0.85rem] font-600 mb-1">ผลงานโปรโมชั่นรายแคมเปญ</div>
          <div className="text-[0.72rem] text-[var(--muted-foreground)] mb-4">ยอดใช้งานและรายได้สะสม</div>
          <div className="space-y-2">
            {mockPromotions.filter(p => p.status !== "pending-approval").map(pr => (
              <div key={pr.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--muted)]">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${promoStatusColor[pr.status] ?? "#6b7280"}20` }}>
                  <Tag size={13} style={{ color: promoStatusColor[pr.status] ?? "#6b7280" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.78rem] font-500 truncate">{pr.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[0.65rem] text-[var(--muted-foreground)]">
                      {pr.type === "percent" ? `-${pr.value}%` : `-${pr.value.toLocaleString()} ฿`}
                    </span>
                    <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full font-600"
                      style={{ background: `${promoStatusColor[pr.status] ?? "#6b7280"}20`, color: promoStatusColor[pr.status] ?? "#6b7280" }}>
                      {promoStatusLabel[pr.status] ?? pr.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[0.78rem] font-600">{pr.usedCount} ครั้ง</div>
                  <div className="text-[0.65rem] text-[var(--muted-foreground)]">{pr.revenue > 0 ? formatCurrency(pr.revenue) : "—"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
          <div className="text-[0.85rem] font-600 mb-4">โปรโมชั่นทั้งหมด</div>
          <div className="space-y-2">
            {mockPromotions.map(pr => (
              <div key={pr.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[var(--border)]">
                <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${promoStatusColor[pr.status] ?? "#6b7280"}20` }}>
                  <Percent size={11} style={{ color: promoStatusColor[pr.status] ?? "#6b7280" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[0.75rem] font-500 truncate">{pr.name}</span>
                    <span className="text-[0.6rem] px-1 py-0.5 rounded font-600 flex-shrink-0"
                      style={{ background: `${promoStatusColor[pr.status] ?? "#6b7280"}20`, color: promoStatusColor[pr.status] ?? "#6b7280" }}>
                      {promoStatusLabel[pr.status] ?? pr.status}
                    </span>
                  </div>
                  <div className="text-[0.65rem] text-[var(--muted-foreground)] mt-0.5">
                    {pr.tier.join(" · ")} · {pr.startDate} – {pr.endDate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
          <div className="text-[0.85rem] font-600 mb-1">สรุปลูกค้าตาม Tier</div>
          <div className="text-[0.72rem] text-[var(--muted-foreground)] mb-4">ข้อมูล Customer Segment</div>
          {[
            { tier: "Founder", count: 1, color: "#7c3aed", revenue: 8200000 },
            { tier: "Dealer", count: 2, color: "#2563eb", revenue: 8450000 },
            { tier: "ผู้รับเหมา", count: 1, color: "#d97706", revenue: 2100000 },
            { tier: "ทั่วไป", count: 1, color: "#6b7280", revenue: 285000 },
          ].map(t => (
            <div key={t.tier} className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                  <span className="text-[0.75rem] font-500">{t.tier}</span>
                  <span className="text-[0.65rem] text-[var(--muted-foreground)]">{t.count} ราย</span>
                </div>
                <span className="text-[0.7rem] font-600">{(t.revenue / 1000000).toFixed(1)}M ฿</span>
              </div>
              <div className="w-full bg-[var(--muted)] rounded-full h-1.5">
                <div className="h-1.5 rounded-full" style={{ width: `${Math.round(t.revenue / 190350)}%`, background: t.color, maxWidth: "100%", transition: ready ? "width 0.8s ease" : "none" }} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
          <div className="text-[0.85rem] font-600 mb-1">รอดำเนินการ</div>
          <div className="text-[0.72rem] text-[var(--muted-foreground)] mb-3">คำขอที่ส่งไปแล้วรอผล</div>
          <div className="space-y-2 mb-4">
            {mockApprovals.filter(a => a.requestBy === "นิดา มาร์เก็ตติ้ง").map(a => (
              <div key={a.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[var(--muted)]">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.status === "pending" ? "bg-yellow-500" : a.status === "approved" ? "bg-green-500" : "bg-red-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[0.73rem] font-500 truncate">{a.type}</div>
                  <div className="text-[0.65rem] text-[var(--muted-foreground)] truncate">{a.detail}</div>
                </div>
                <span className={`text-[0.62rem] font-600 px-1.5 py-0.5 rounded-full ${
                  a.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                  a.status === "approved" ? "bg-green-100 text-green-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {a.status === "pending" ? "รออนุมัติ" : a.status === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธ"}
                </span>
              </div>
            ))}
            {mockApprovals.filter(a => a.requestBy === "นิดา มาร์เก็ตติ้ง").length === 0 && (
              <div className="text-[0.75rem] text-[var(--muted-foreground)] text-center py-4">ไม่มีคำขอค้างอยู่</div>
            )}
          </div>
          <Link href="/marketing" className="block w-full text-center text-[0.78rem] font-600 py-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors" style={{ color: "#ea580c" }}>
            จัดการโปรโมชั่น →
          </Link>
        </div>
      </div>
    </div>
  );
}
