import type { Metadata, Viewport } from "next";
import { FontSizeProvider } from "../lib/font-size";
import { MomOnboarding } from "../components/mom-onboarding";
import { ServiceWorkerRegister } from "../components/sw-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Học Lái Xe WA — Luyện thi bằng lái xe Washington",
  description:
    "Hệ thống AI giúp người Việt luyện thi bằng lái xe Washington. Đọc to, chữ lớn, dễ học.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Học Lái Xe WA" },
  openGraph: {
    title: "Học Lái Xe WA",
    description: "Luyện thi bằng lái xe Washington cho người Việt",
    type: "website",
    locale: "vi_VN",
  },
  keywords: ["Washington driver test", "bằng lái xe", "Vietnamese", "AI tutor"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0b5cad",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body>
        <FontSizeProvider>
          {children}
          <MomOnboarding />
          <ServiceWorkerRegister />
        </FontSizeProvider>
      </body>
    </html>
  );
}
