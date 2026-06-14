"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ROLE_CONFIG, type Role } from "@/components/layout/role-context";

export default function RoleEntryPage() {
  const params = useParams();
  const role = String(params.role) as Role;
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const config = ROLE_CONFIG[role];
    if (config) {
      // ตั้งสิทธิ์แล้วรีโหลดเต็มหน้า เพื่อให้ RoleProvider อ่านค่าใหม่จาก localStorage
      localStorage.setItem("demo-role", role);
      window.location.replace(config.landing);
    } else {
      setInvalid(true);
    }
  }, [role]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen text-center px-6"
      style={{ background: "var(--background)" }}
    >
      {invalid ? (
        <>
          <h1 className="text-lg font-700 mb-2">ไม่พบสิทธิ์ &quot;{role}&quot;</h1>
          <p className="text-[0.85rem] text-[var(--muted-foreground)] mb-5">
            ลิงก์สิทธิ์ที่รองรับ: admin · sales · stock · accounting · marketing
          </p>
          <a
            href="/r"
            className="px-4 h-9 inline-flex items-center rounded-lg text-[0.82rem] font-600 text-white"
            style={{ background: "var(--primary)" }}
          >
            เลือกสิทธิ์เข้าใช้งาน
          </a>
        </>
      ) : (
        <>
          <div
            className="w-10 h-10 rounded-full border-2 border-[var(--border)] border-t-[var(--primary)] animate-spin mb-4"
            aria-hidden
          />
          <p className="text-[0.85rem] text-[var(--muted-foreground)]">
            กำลังเข้าสู่ระบบในสิทธิ์ {ROLE_CONFIG[role]?.label ?? role}…
          </p>
        </>
      )}
    </div>
  );
}
