"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Badge, statusBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { mockApprovals } from "@/lib/mock-data";
import { useRole } from "@/components/layout/role-context";
import { CheckSquare, XCircle, Clock, CheckCircle, AlertTriangle } from "lucide-react";

export default function ApprovalsPage() {
  const { config } = useRole();
  const canApprove = config.perms.canApprove;
  const myName = config.user.name;

  const [approvals, setApprovals] = useState(mockApprovals.map(a => ({ ...a })));
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    setFilter(canApprove ? "pending" : "all");
  }, [canApprove]);

  const nowStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  const handleApprove = (id: string) => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: "approved", approveDate: nowStr() } : a));
    setSelected(null);
  };

  const handleReject = (id: string) => {
    if (!rejectReason.trim()) return;
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: "rejected", approveDate: nowStr(), rejectReason: rejectReason.trim() } : a));
    setRejectingId(null);
    setRejectReason("");
    setSelected(null);
  };

  const visibleApprovals = canApprove ? approvals : approvals.filter(a => a.requestBy === myName);
  const data = filter === "all" ? visibleApprovals : visibleApprovals.filter(a => a.status === filter);
  const selectedItem = approvals.find(a => a.id === selected);

  const counts = {
    pending: visibleApprovals.filter(a => a.status === "pending").length,
    approved: visibleApprovals.filter(a => a.status === "approved").length,
    rejected: visibleApprovals.filter(a => a.status === "rejected").length,
  };

  const typeIcon: Record<string, React.ElementType> = {
    "ส่วนลดเกินสิทธิ์": AlertTriangle,
    "รับสินค้าเข้าคลัง": CheckSquare,
    "ปรับยอดสต็อก": CheckSquare,
    "คืนสินค้าเกิน Return Period": XCircle,
    "บิลใหญ่เกิน Threshold": AlertTriangle,
  };

  return (
    <>
      <Topbar
        title="Approval Workflow"
        subtitle={canApprove ? "ระบบอนุมัติเอกสารและคำขอต่าง ๆ ในองค์กร" : `คำขออนุมัติของฉัน (${myName})`}
      />
      <div className="p-6">

        {/* Summary — ผู้อนุมัติเห็นในมุม "งานที่ต้องอนุมัติ", คนอื่นเห็นในมุม "สถานะคำขอของฉัน" */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: canApprove ? "รออนุมัติ" : "คำขอที่รอผล", count: counts.pending, color: "var(--warning)", icon: Clock },
            { label: canApprove ? "อนุมัติแล้ว" : "ได้รับอนุมัติ", count: counts.approved, color: "var(--success)", icon: CheckCircle },
            { label: canApprove ? "ปฏิเสธ" : "ถูกปฏิเสธ", count: counts.rejected, color: "var(--destructive)", icon: XCircle },
          ].map(({ label, count, color, icon: Icon }) => (
            <div key={label} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <div className="text-[1.4rem] font-700">{count}</div>
                <div className="text-[0.75rem] text-[var(--muted-foreground)]">{label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          {/* List */}
          <div className="flex-1 min-w-0">
            {/* Filter tabs */}
            <div className="flex gap-1 p-1 rounded-lg mb-4 w-fit" style={{ background: "var(--muted)" }}>
              {(canApprove
                ? (["all", "pending", "approved", "rejected"] as const)
                : (["all", "approved", "rejected"] as const)
              ).map(f => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setSelected(null); }}
                  className="px-3 py-1.5 rounded-md text-[0.78rem] font-500 transition-all"
                  style={{
                    background: filter === f ? "var(--card)" : "transparent",
                    color: filter === f ? "var(--foreground)" : "var(--muted-foreground)",
                    boxShadow: filter === f ? "var(--shadow-sm)" : "none",
                  }}
                >
                  {f === "all" ? "ทั้งหมด" : f === "pending" ? "รออนุมัติ" : f === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธ"}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {data.map((a) => {
                const Icon = typeIcon[a.type] ?? CheckSquare;
                const isSelected = selected === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelected(isSelected ? null : a.id)}
                    className="flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all"
                    style={{
                      background: isSelected ? "var(--accent)" : "var(--card)",
                      borderColor: isSelected ? "var(--primary)" : "var(--border)",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: a.status === "pending" ? "#fef3c7" : a.status === "approved" ? "#d1fae5" : "#fee2e2" }}
                    >
                      <Icon size={14} style={{ color: a.status === "pending" ? "#d97706" : a.status === "approved" ? "#059669" : "#dc2626" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-600 text-[0.85rem]">{a.type}</span>
                        {statusBadge(a.status)}
                      </div>
                      <div className="text-[0.78rem] text-[var(--muted-foreground)]">{a.detail}</div>
                      <div className="flex items-center gap-3 mt-1.5 text-[0.72rem] text-[var(--muted-foreground)]">
                        <span>อ้างอิง: <span className="font-mono font-500 text-[var(--foreground)]">{a.ref}</span></span>
                        <span>·</span>
                        <span>โดย: {a.requestBy}</span>
                        <span>·</span>
                        <span>{a.requestDate}</span>
                        {a.amount > 0 && (
                          <>
                            <span>·</span>
                            <span className="font-500 text-[var(--foreground)]">{formatCurrency(a.amount)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {a.status === "pending" && canApprove && (
                      rejectingId === a.id ? (
                        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                          <input
                            autoFocus
                            placeholder="เหตุผลที่ปฏิเสธ..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") handleReject(a.id);
                              if (e.key === "Escape") { setRejectingId(null); setRejectReason(""); }
                            }}
                            className="h-8 px-2.5 text-[0.75rem] border border-[var(--border)] rounded-lg outline-none w-36 focus:border-[var(--ring)]"
                          />
                          <button
                            onClick={() => handleReject(a.id)}
                            disabled={!rejectReason.trim()}
                            className="px-2.5 h-8 rounded-lg text-[0.72rem] font-500 text-white bg-red-500 disabled:opacity-40"
                          >ยืนยัน</button>
                          <button
                            onClick={() => { setRejectingId(null); setRejectReason(""); }}
                            className="px-2.5 h-8 rounded-lg text-[0.72rem] border border-[var(--border)] hover:bg-[var(--muted)]"
                          >ยกเลิก</button>
                        </div>
                      ) : (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={e => { e.stopPropagation(); handleApprove(a.id); }}
                            className="px-3 py-1.5 rounded-lg text-[0.75rem] font-500 text-white"
                            style={{ background: "var(--success)" }}
                          >อนุมัติ</button>
                          <button
                            onClick={e => { e.stopPropagation(); setRejectingId(a.id); setRejectReason(""); }}
                            className="px-3 py-1.5 rounded-lg text-[0.75rem] font-500 border border-[var(--border)] hover:bg-[var(--muted)]"
                          >ปฏิเสธ</button>
                        </div>
                      )
                    )}
                    {a.status === "pending" && !canApprove && (
                      <span className="text-[0.72rem] text-[var(--muted-foreground)] flex-shrink-0 mt-1">รออนุมัติ</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail panel */}
          {selectedItem && (
            <div
              className="w-72 flex-shrink-0 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 h-fit sticky top-20"
              style={{ boxShadow: "var(--shadow-md)" }}
            >
              <div className="font-600 text-sm mb-3">รายละเอียดคำขอ</div>
              <div className="space-y-2.5 text-[0.8rem]">
                <Row label="ประเภท" value={selectedItem.type} />
                <Row label="อ้างอิง" value={selectedItem.ref} mono />
                <Row label="ขอโดย" value={selectedItem.requestBy} />
                <Row label="วันที่ขอ" value={selectedItem.requestDate} />
                <Row label="ผู้อนุมัติ" value={selectedItem.approver} />
                {selectedItem.amount > 0 && <Row label="มูลค่า" value={formatCurrency(selectedItem.amount)} />}
                <Row label="สถานะ" value={statusBadge(selectedItem.status) as any} />
                {selectedItem.approveDate && <Row label="วันที่อนุมัติ" value={selectedItem.approveDate} />}
                {selectedItem.rejectReason && (
                  <div>
                    <div className="text-[var(--muted-foreground)] mb-0.5">เหตุผลปฏิเสธ</div>
                    <div className="p-2 rounded bg-red-50 text-red-700 text-[0.75rem]">{selectedItem.rejectReason}</div>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                <div className="text-[0.75rem] text-[var(--muted-foreground)]">รายละเอียด</div>
                <div className="text-[0.8rem] mt-1">{selectedItem.detail}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-[var(--muted-foreground)] shrink-0">{label}</span>
      <span className={`font-500 text-right ${mono ? "font-mono text-[0.75rem]" : ""}`}>{value}</span>
    </div>
  );
}
