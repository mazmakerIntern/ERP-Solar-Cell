"use client";

import { useState } from "react";
import { Bell, Search, X, CheckCircle, XCircle, Clock, AlertTriangle, Zap, Menu } from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { useRole, type Role } from "./role-context";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

const ALL_NOTIFICATIONS: {
  id: number; roles: Role[]; icon: React.ElementType;
  color: string; bg: string; title: string; desc: string; time: string; unread: boolean;
}[] = [
  // ผู้บริหาร + บัญชี — รออนุมัติ
  { id: 1, roles: ["admin", "accounting"], icon: Clock, color: "#d97706", bg: "#fef3c7",
    title: "รออนุมัติ: ส่วนลดเกินสิทธิ์", desc: "SO2406013 · สมศักดิ์ รักดี · 9,920 ฿", time: "10 นาทีที่แล้ว", unread: true },
  // ผู้บริหาร + สต็อก — สต็อกต่ำ
  { id: 2, roles: ["admin", "stock"], icon: AlertTriangle, color: "#dc2626", bg: "#fee2e2",
    title: "สต็อกต่ำกว่า Reorder Point", desc: "SC-MON-550W เหลือ 28 / Reorder 40", time: "1 ชั่วโมงที่แล้ว", unread: true },
  // ผู้บริหาร + บัญชี — Peak sync
  { id: 3, roles: ["admin", "accounting"], icon: Zap, color: "#e60023", bg: "#fff1f2",
    title: "Invoice ส่ง Peak สำเร็จ", desc: "SO2406015 · INV-2024-0615 · 25,680 ฿", time: "2 ชั่วโมงที่แล้ว", unread: false },
  // ผู้บริหาร + เซลส์ — SO ปิดแล้ว
  { id: 4, roles: ["admin", "sales"], icon: CheckCircle, color: "#059669", bg: "#d1fae5",
    title: "Sales Order ปิดการขายแล้ว", desc: "SO2406014 · 147,660 ฿ · วิภา สุขใจ", time: "3 ชั่วโมงที่แล้ว", unread: false },
  // สต็อก (สมหญิง) — คำขอ GR ได้รับอนุมัติ
  { id: 5, roles: ["stock"], icon: CheckCircle, color: "#059669", bg: "#d1fae5",
    title: "คำขอรับสินค้าเข้าคลังได้รับอนุมัติ", desc: "PO2406002 · อินเวอร์เตอร์ 8 เครื่อง · 220,000 ฿", time: "6 ชั่วโมงที่แล้ว", unread: true },
  // เซลส์ (วิภา) — บิลใหญ่ได้รับอนุมัติ
  { id: 6, roles: ["sales"], icon: CheckCircle, color: "#059669", bg: "#d1fae5",
    title: "อนุมัติบิลใหญ่เกิน Threshold แล้ว", desc: "SO2406014 · 147,660 ฿ · ดำเนินการต่อได้", time: "7 ชั่วโมงที่แล้ว", unread: true },
  // เซลส์ (วิภา) — คำขอคืนสินค้าถูกปฏิเสธ
  { id: 7, roles: ["sales"], icon: XCircle, color: "#dc2626", bg: "#fee2e2",
    title: "คำขอคืนสินค้าถูกปฏิเสธ", desc: "RET2406002 · เกิน Return Period · 16,500 ฿", time: "2 วันที่แล้ว", unread: false },
  // บัญชี — Peak sync error
  { id: 8, roles: ["accounting"], icon: AlertTriangle, color: "#dc2626", bg: "#fee2e2",
    title: "Sync Error: เอกสารส่ง Peak ล้มเหลว", desc: "INV-2024-0612 · กรุณา Retry", time: "5 ชั่วโมงที่แล้ว", unread: true },
];

export function Topbar({ title, subtitle }: TopbarProps) {
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { toggle } = useSidebar();
  const { role, config } = useRole();

  const notifications = ALL_NOTIFICATIONS.filter(n => n.roles.includes(role));
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header
      className="fixed top-0 right-0 left-0 h-14 flex items-center justify-between px-4 sm:px-5 bg-[var(--card)] border-b border-[var(--border)] z-40 lg:left-[var(--sidebar-width,240px)]"
    >
      {/* Title */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Hamburger (mobile) */}
        <button
          onClick={toggle}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] transition-colors flex-shrink-0"
        >
          <Menu size={17} />
        </button>
        {showSearch ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              placeholder="ค้นหา SKU, ลูกค้า, SO..."
              className="w-40 sm:w-64 h-8 px-3 text-sm border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)] bg-[var(--muted)]"
            />
            <button onClick={() => setShowSearch(false)}>
              <X size={14} className="text-[var(--muted-foreground)]" />
            </button>
          </div>
        ) : (
          <div className="min-w-0">
            <h1 className="text-[0.9rem] sm:text-[0.95rem] font-700 leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-[0.7rem] text-[var(--muted-foreground)] truncate hidden sm:block">{subtitle}</p>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* Search */}
        {!showSearch && (
          <button
            onClick={() => setShowSearch(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            <Search size={15} className="text-[var(--muted-foreground)]" />
          </button>
        )}

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            <Bell size={15} className="text-[var(--muted-foreground)]" />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[0.55rem] font-700 text-white px-0.5"
                style={{ background: "var(--primary)" }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showNotif && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotif(false)}
              />
              <div
                className="absolute right-0 top-10 w-80 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-lg)] z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                  <span className="font-600 text-sm">การแจ้งเตือน</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <span
                        className="text-[0.68rem] font-500 px-1.5 py-0.5 rounded-full text-white"
                        style={{ background: "var(--primary)" }}
                      >
                        {unreadCount} ใหม่
                      </span>
                    )}
                    <button onClick={() => setShowNotif(false)}>
                      <X size={13} className="text-[var(--muted-foreground)]" />
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-[var(--border)] max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="flex gap-3 px-4 py-3 hover:bg-[var(--muted)] transition-colors cursor-pointer"
                      style={{ background: n.unread ? "oklch(0.99 0.005 25)" : "transparent" }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: n.bg }}
                      >
                        <n.icon size={14} style={{ color: n.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.78rem] font-500 leading-tight">{n.title}</div>
                        <div className="text-[0.7rem] text-[var(--muted-foreground)] mt-0.5 truncate">{n.desc}</div>
                        <div className="text-[0.65rem] text-[var(--muted-foreground)] mt-1">{n.time}</div>
                      </div>
                      {n.unread && (
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                          style={{ background: "var(--primary)" }}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-[var(--border)]">
                  <button
                    className="w-full text-center text-[0.75rem] font-500 py-1 rounded-lg hover:bg-[var(--muted)] transition-colors"
                    style={{ color: "var(--primary)" }}
                  >
                    ดูทั้งหมด
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--border)] mx-1" />

        {/* Date */}
        <div className="text-[0.72rem] text-[var(--muted-foreground)]">
          จ. 14 มิ.ย. 2567
        </div>

        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[0.7rem] font-700 ml-1 cursor-pointer shadow-sm"
          style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)` }}
          title={config.user.name}
        >
          {config.user.initial}
        </div>
      </div>
    </header>
  );
}
