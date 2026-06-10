"use client";

import { Topbar } from "@/components/layout/topbar";
import { Badge, statusBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { mockPeakSync, mockDashboardKPI } from "@/lib/mock-data";
import { Zap, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

export default function PeakPage() {
  const success = mockPeakSync.filter(s => s.status === "success").length;
  const pending = mockPeakSync.filter(s => s.status === "pending").length;
  const error = mockPeakSync.filter(s => s.status === "error").length;

  const typeColor: Record<string, string> = {
    Invoice: "info",
    "Purchase Order": "secondary",
    "Expense by PO": "secondary",
    "Credit Note": "warning",
    "Supplier Contact": "ghost",
  };

  return (
    <>
      <Topbar title="Peak Integration" subtitle="การเชื่อมต่อระบบบัญชี Peak — ส่งเอกสารและซิงค์ข้อมูลการเงิน" />
      <div className="p-6">

        {/* Status Cards */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-green-100">
              <CheckCircle size={18} className="text-green-600" />
            </div>
            <div>
              <div className="text-[1.4rem] font-700 text-green-600">{success}</div>
              <div className="text-[0.75rem] text-[var(--muted-foreground)]">ส่งสำเร็จ</div>
            </div>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-amber-100">
              <Clock size={18} className="text-amber-600" />
            </div>
            <div>
              <div className="text-[1.4rem] font-700 text-amber-600">{pending}</div>
              <div className="text-[0.75rem] text-[var(--muted-foreground)]">รอส่ง</div>
            </div>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-red-100">
              <XCircle size={18} className="text-red-600" />
            </div>
            <div>
              <div className="text-[1.4rem] font-700 text-red-600">{error}</div>
              <div className="text-[0.75rem] text-[var(--muted-foreground)]">Error</div>
            </div>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--accent)" }}>
              <Zap size={18} style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <div className="text-[0.78rem] font-600">Last Sync</div>
              <div className="text-[0.7rem] text-[var(--muted-foreground)]">{mockDashboardKPI.lastPeakSync}</div>
            </div>
          </div>
        </div>

        {/* Financial Sync Summary */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
            <div className="font-600 text-sm mb-3">Financial Sync (จาก Peak)</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">ยอดเก็บได้จริง (Collected)</span>
                <span className="font-600 text-green-600">{formatCurrency(mockDashboardKPI.arCollected)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">ยอดค้างชำระ (Outstanding AR)</span>
                <span className="font-600 text-amber-600">{formatCurrency(mockDashboardKPI.arOutstanding)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-2 text-[0.72rem] text-[var(--muted-foreground)]">
              <RefreshCw size={11} />
              <span>Scheduled Pull ทุก 1 ชั่วโมง · ซิงค์ล่าสุด {mockDashboardKPI.lastPeakSync}</span>
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
            <div className="font-600 text-sm mb-3">API Endpoints ที่เชื่อมต่อ</div>
            <div className="space-y-1.5 text-[0.78rem]">
              {[
                { label: "Create Invoice (AR)", status: "connected" },
                { label: "Create Credit Note", status: "connected" },
                { label: "Create Purchase Order (AP)", status: "connected" },
                { label: "Create Expense by PO", status: "connected" },
                { label: "Create Received Tax Invoice", status: "connected" },
                { label: "Create Expense Payment", status: "connected" },
                { label: "Create Contact (Supplier)", status: "connected" },
                { label: "Get Invoice Status (Pull)", status: "connected" },
              ].map((ep) => (
                <div key={ep.label} className="flex items-center justify-between py-1 border-b border-[var(--border)] last:border-0">
                  <span>{ep.label}</span>
                  <Badge variant="success">เชื่อมต่อแล้ว</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Document Log */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-[var(--shadow-sm)]">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <span className="font-600 text-sm">Document Sync Log</span>
            <button className="flex items-center gap-1.5 px-3 h-7 text-[0.75rem] font-500 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
              <RefreshCw size={12} />
              Sync ตอนนี้
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[0.82rem]">
              <thead style={{ background: "var(--muted)" }}>
                <tr>
                  {["ประเภทเอกสาร", "อ้างอิง ERP", "Document ID (Peak)", "มูลค่า", "เวลาส่ง", "สถานะ", ""].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockPeakSync.map((s) => (
                  <tr key={s.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-2.5">
                      <Badge variant={typeColor[s.type] as any}>{s.type}</Badge>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[0.75rem]">{s.ref}</td>
                    <td className="px-4 py-2.5 font-mono text-[0.75rem]">
                      {s.docId ?? <span className="text-[var(--muted-foreground)]">—</span>}
                    </td>
                    <td className="px-4 py-2.5">{s.amount > 0 ? formatCurrency(s.amount) : "—"}</td>
                    <td className="px-4 py-2.5 text-[var(--muted-foreground)] whitespace-nowrap">
                      {s.pushedAt ?? <span className="text-amber-500">รอส่ง</span>}
                    </td>
                    <td className="px-4 py-2.5">{statusBadge(s.status)}</td>
                    <td className="px-4 py-2.5">
                      {s.status === "error" && (
                        <div>
                          <div className="text-[0.7rem] text-red-500 mb-1">{s.errorMsg}</div>
                          <button className="text-[0.72rem] text-[var(--primary)] hover:underline">Retry</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}
