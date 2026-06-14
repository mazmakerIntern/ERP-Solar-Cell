"use client";

import type { CSSProperties } from "react";

// ไอคอนสัญลักษณ์เงินบาท (฿) ใช้แทน DollarSign ของ lucide ที่แสดงเป็น "$"
// รับ props รูปแบบเดียวกับไอคอน lucide (size / className / style / color) เพื่อสลับได้ทันที
export function BahtSign({
  size = 16, className, style, color,
}: {
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  color?: string;
}) {
  const px = typeof size === "number" ? `${size}px` : size;
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: px,
        height: px,
        fontSize: `calc(${px} * 1.05)`,
        lineHeight: 1,
        fontWeight: 700,
        color,
        ...style,
      }}
    >
      ฿
    </span>
  );
}
