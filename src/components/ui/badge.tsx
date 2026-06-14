"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline" | "ghost" | "success" | "warning" | "error" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--primary)] text-white",
  secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)]",
  outline: "border border-[var(--border)] text-[var(--foreground)] bg-transparent",
  ghost: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  success: "bg-green-100 text-green-700 border border-green-300",
  warning: "bg-amber-100 text-amber-700 border border-amber-300",
  error: "bg-red-100 text-red-600 border border-red-300",
  info: "bg-blue-100 text-blue-700 border border-blue-300",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 h-5 text-[0.7rem] font-medium rounded-full whitespace-nowrap",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    active: { label: "ใช้งาน", variant: "success" },
    inactive: { label: "ปิดใช้", variant: "ghost" },
    pending: { label: "รออนุมัติ", variant: "warning" },
    approved: { label: "อนุมัติแล้ว", variant: "success" },
    rejected: { label: "ปฏิเสธ", variant: "error" },
    closed: { label: "ปิดแล้ว", variant: "success" },
    draft: { label: "ร่าง", variant: "secondary" },
    cancelled: { label: "ยกเลิก", variant: "ghost" },
    received: { label: "รับครบ", variant: "success" },
    partial: { label: "รับบางส่วน", variant: "warning" },
    confirmed: { label: "ยืนยันแล้ว", variant: "success" },
    error: { label: "Error", variant: "error" },
    success: { label: "สำเร็จ", variant: "success" },
    scheduled: { label: "กำหนดการณ์", variant: "info" },
    "pending-approval": { label: "รออนุมัติ", variant: "warning" },
    completed: { label: "เสร็จสิ้น", variant: "success" },
    "partial-credit": { label: "Partial Credit", variant: "warning" },
    inspecting: { label: "กำลังตรวจ", variant: "info" },
    pass: { label: "ผ่าน", variant: "success" },
    fail: { label: "ไม่ผ่าน", variant: "error" },
    "awaiting-pickup": { label: "รอสต๊อกรับสินค้า", variant: "warning" },
    "awaiting-admin-adjust": { label: "รอผู้บริหารอนุมัติปรับสต๊อก", variant: "warning" },
    "awaiting-cn": { label: "รอเซลล์ออก Credit Note", variant: "info" },
    "stock-rejected": { label: "สต๊อกปฏิเสธรับคืน", variant: "error" },
    pushing: { label: "กำลัง Push เข้า Peak", variant: "warning" },
  };
  const config = map[status] ?? { label: status, variant: "secondary" as BadgeVariant };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
