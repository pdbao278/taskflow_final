import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import OfflineBanner from "@/components/OfflineBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaskFlow — Quản lý công việc nhóm",
  description: "Nền tảng quản lý task cho team nhỏ, đơn giản và hiệu quả.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <OfflineBanner />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '14px',
              borderRadius: '8px',
            },
            success: {
              style: {
                background: 'hsl(142 76% 96%)',
                border: '1px solid hsl(142 71% 45%)',
                color: 'hsl(142 71% 30%)',
              },
            },
            error: {
              style: {
                background: 'hsl(0 86% 97%)',
                border: '1px solid hsl(0 84% 60%)',
                color: 'hsl(0 84% 40%)',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
