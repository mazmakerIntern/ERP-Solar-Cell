import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solar Cell ERP | Solarsell",
  description: "ระบบ ERP สำหรับธุรกิจโซลาร์เซลล์",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="h-full">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}
