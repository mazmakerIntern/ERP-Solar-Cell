"use client";

import Link from "next/link";
import { ROLE_CONFIG, type Role } from "@/components/layout/role-context";
import { ArrowRight } from "lucide-react";

const ORDER: Role[] = ["admin", "sales", "marketing", "stock", "accounting"];

export default function RoleSelectPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
            style={{ background: "linear-gradient(135deg, #e60023, #b30019)" }}
          >
            S
          </div>
          <div>
            <div className="text-base font-700 leading-tight">Solarsell ERP</div>
            <div className="text-[0.7rem] text-[var(--muted-foreground)]">เลือกสิทธิ์เพื่อเข้าใช้งาน · 1 ลิงก์ / 1 สิทธิ์</div>
          </div>
        </div>
        <p className="text-[0.82rem] text-[var(--muted-foreground)] mb-6 mt-3">
          แต่ละสิทธิ์มีลิงก์เข้าใช้งานแยกของตัวเอง — เปิดลิงก์แล้วระบบจะพาเข้าสู่หน้าหลักของสิทธิ์นั้นทันที
        </p>

        {/* Role cards */}
        <div className="grid sm:grid-cols-2 gap-3">
          {ORDER.map((r) => {
            const rc = ROLE_CONFIG[r];
            return (
              <Link
                key={r}
                href={`/r/${r}`}
                className="group flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] hover:border-[var(--ring)] transition-all"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${rc.color}1a` }}>
                  <rc.icon size={20} style={{ color: rc.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.9rem] font-700">{rc.label}</div>
                  <div className="text-[0.72rem] text-[var(--muted-foreground)] truncate">{rc.fullTitle}</div>
                  <div className="text-[0.66rem] font-mono text-[var(--muted-foreground)] mt-0.5">/r/{r}</div>
                </div>
                <ArrowRight size={16} className="text-[var(--muted-foreground)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
