"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Badge, statusBadge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  mockDashboardKPI, mockSalesByDept, mockSalesTrend,
  mockStockAlerts, mockApprovals, mockCommissions, mockActivityLog,
} from "@/lib/mock-data";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  TrendingUp, Package, CheckSquare, AlertTriangle,
  DollarSign, Zap, ArrowUpRight, Clock, Activity,
} from "lucide-react";

function StatCard({
  title, value, sub, icon: Icon, trend, color = "var(--primary)",
}: {
  title: string; value: string; sub?: string;
  icon: React.ElementType; trend?: string; color?: string;
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: "var(--accent)" }}
        >
          <Icon size={17} style={{ color }} />
        </div>
        {trend && (
          <span className="flex items-center gap-0.5 text-[0.7rem] text-green-600 font-500">
            <ArrowUpRight size={11} />
            {trend}
          </span>
        )}
      </div>
      <div className="text-[1.5rem] font-700 leading-tight">{value}</div>
      <div className="text-[0.75rem] text-[var(--muted-foreground)] mt-0.5">{title}</div>
      {sub && <div className="text-[0.7rem] text-[var(--muted-foreground)] mt-1">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const kpi = mockDashboardKPI;
  const salesProgress = Math.round((kpi.totalSalesMonth / kpi.totalSalesTarget) * 100);

  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t); }, []);


  const pendingApprovals = mockApprovals.filter(a => a.status === "pending");

  return (
    <>
      <Topbar title="Executive Dashboard" subtitle="ภาพรวมธุรกิจและ KPI ประจำเดือน มิถุนายน 2567" />
      <div className="p-6 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="ยอดขายเดือนนี้"
            value={formatCurrency(kpi.totalSalesMonth)}
            sub={`เป้า ${formatCurrency(kpi.totalSalesTarget)}`}
            icon={TrendingUp}
            trend="+14.4%"
          />
          <StatCard
            title="จำนวน Order"
            value={formatNumber(kpi.totalOrders)}
            sub="ใบสั่งขายเดือนนี้"
            icon={DollarSign}
            trend="+2 จากเดือนที่แล้ว"
          />
          <StatCard
            title="รอการอนุมัติ"
            value={formatNumber(kpi.pendingApprovals)}
            sub="คำขอค้างอยู่ในระบบ"
            icon={CheckSquare}
            color="var(--warning)"
          />
          <StatCard
            title="สต็อกใกล้หมด"
            value={formatNumber(kpi.lowStockCount)}
            sub="SKU ต่ำกว่า Reorder Point"
            icon={AlertTriangle}
            color="var(--destructive)"
          />
        </div>

        {/* Sales Trend + Dept KPI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Sales Trend */}
          <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-600 text-sm">ยอดขายรายเดือน</div>
                <div className="text-[0.72rem] text-[var(--muted-foreground)]">มกราคม — มิถุนายน 2567</div>
              </div>
              <Badge variant="success">+14.4% MoM</Badge>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart key={ready ? 1 : 0} data={mockSalesTrend}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e60023" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#e60023" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), "ยอดขาย"]} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#e60023"
                  strokeWidth={2}
                  fill="url(#salesGrad)"
                  animationDuration={1400}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Dept KPI */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
            <div className="font-600 text-sm mb-1">KPI รายแผนก</div>
            <div className="text-[0.72rem] text-[var(--muted-foreground)] mb-4">Actual vs Target</div>
            <div className="space-y-3">
              {mockSalesByDept.map((d) => {
                const pct = Math.round((d.actual / d.target) * 100);
                return (
                  <div key={d.dept}>
                    <div className="flex justify-between text-[0.75rem] mb-1">
                      <span>{d.dept}</span>
                      <span className="font-500">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: ready ? `${Math.min(pct, 100)}%` : "0%",
                          background: pct >= 100 ? "var(--success)" : pct >= 70 ? "var(--primary)" : "var(--warning)",
                          transition: "width 0.9s cubic-bezier(0.4,0,0.2,1)",
                        }}
                      />
                    </div>
                    <div className="text-[0.68rem] text-[var(--muted-foreground)] mt-0.5">
                      {formatCurrency(d.actual)} / {formatCurrency(d.target)}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Overall progress */}
            <div className="mt-4 pt-3 border-t border-[var(--border)]">
              <div className="flex justify-between text-[0.75rem] mb-1">
                <span className="font-500">รวมทั้งหมด</span>
                <span className="font-600" style={{ color: "var(--primary)" }}>{salesProgress}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: ready ? `${salesProgress}%` : "0%",
                    background: "var(--primary)",
                    transition: "width 1.1s cubic-bezier(0.4,0,0.2,1)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Commission + Stock Alert + Peak */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

          {/* Commission Summary */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
            <div className="font-600 text-sm mb-1">Commission Summary</div>
            <div className="text-[0.72rem] text-[var(--muted-foreground)] mb-3">สรุปคอมมิชชั่นเดือนนี้</div>
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Confirmed</span>
                <span className="font-600 text-green-600">{formatCurrency(kpi.commissionConfirmed)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Pending</span>
                <span className="font-600 text-amber-600">{formatCurrency(kpi.commissionPending)}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-[var(--border)]">
              {mockCommissions.slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-center justify-between py-1.5 text-[0.75rem]">
                  <div>
                    <span className="font-500">{c.sales}</span>
                    <span className="text-[var(--muted-foreground)] ml-1">· {c.dept}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>{formatCurrency(c.amount)}</span>
                    {statusBadge(c.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Alert */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} style={{ color: "var(--destructive)" }} />
              <div className="font-600 text-sm">Stock Alert</div>
              <Badge variant="error">{mockStockAlerts.length} รายการ</Badge>
            </div>
            <div className="space-y-2">
              {mockStockAlerts.map((p) => (
                <div key={p.id} className="p-2.5 rounded-lg border border-red-100 bg-red-50">
                  <div className="text-[0.78rem] font-500">{p.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[0.7rem] text-[var(--muted-foreground)]">{p.sku}</span>
                    <span className="text-[0.72rem] text-red-600 font-500">
                      เหลือ {p.stock} / Reorder {p.reorderPoint}
                    </span>
                  </div>
                </div>
              ))}
              {mockStockAlerts.length === 0 && (
                <div className="text-center text-[0.8rem] text-[var(--muted-foreground)] py-4">
                  สต็อกทุกรายการปกติ
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-1.5 mb-3">
              <Activity size={14} className="text-[var(--muted-foreground)]" />
              <div className="font-600 text-sm">กิจกรรมล่าสุด</div>
            </div>
            <div className="space-y-2.5">
              {mockActivityLog.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-start gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[0.6rem] font-700 text-white"
                    style={{ background: a.module === "Stock" ? "var(--chart-4)" : a.module === "Sales" ? "var(--primary)" : "var(--chart-2)" }}
                  >
                    {a.module[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.75rem] font-500 leading-snug">{a.action}</div>
                    <div className="text-[0.68rem] text-[var(--muted-foreground)] truncate">{a.user} · {a.time.split(" ")[1]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Overview + Pending Approvals */}
          <div className="space-y-4">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-1.5 mb-3">
                <Zap size={14} style={{ color: "var(--primary)" }} />
                <div className="font-600 text-sm">Financial Overview</div>
                <span className="text-[0.65rem] text-[var(--muted-foreground)] ml-auto">Sync: {kpi.lastPeakSync.split(" ")[1]}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">เก็บได้แล้ว (AR)</span>
                  <span className="font-600 text-green-600">{formatCurrency(kpi.arCollected)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">ค้างชำระ</span>
                  <span className="font-600 text-amber-600">{formatCurrency(kpi.arOutstanding)}</span>
                </div>
              </div>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-1.5 mb-3">
                <Clock size={14} className="text-amber-500" />
                <div className="font-600 text-sm">รออนุมัติ</div>
                {pendingApprovals.length > 0 && <Badge variant="warning">{pendingApprovals.length}</Badge>}
              </div>
              <div className="space-y-2">
                {pendingApprovals.map((a) => (
                  <div key={a.id} className="p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                    <div className="text-[0.78rem] font-500">{a.type}</div>
                    <div className="text-[0.7rem] text-[var(--muted-foreground)] mt-0.5">
                      {a.ref} · {a.requestBy}
                    </div>
                  </div>
                ))}
                {pendingApprovals.length === 0 && (
                  <div className="text-center text-[0.78rem] text-[var(--muted-foreground)] py-3">
                    ไม่มีคำขอค้างอนุมัติ
                  </div>
                )}
              </div>
              <Link
                href="/approvals"
                className="mt-3 flex items-center justify-center gap-1 w-full py-1.5 rounded-lg text-[0.75rem] font-500 text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--primary)" }}
              >
                ตรวจสอบและอนุมัติ
                <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
