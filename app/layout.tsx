import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Installment Dashboard - ระบบติดตามรายจ่ายผ่อนชำระ",
  description:
    "ติดตามรายจ่ายผ่อนชำระ สรุปยอดรายเดือน ดูแนวโน้ม 6 เดือนล่วงหน้า Installment Expense Tracker Dashboard",
  keywords: ["expense tracker", "installment", "dashboard", "finance"],
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-mesh">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
