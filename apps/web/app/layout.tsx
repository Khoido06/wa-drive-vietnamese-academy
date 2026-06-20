import type { Metadata, Viewport } from "next";
import { FontSizeProvider } from "../lib/font-size";
import { MomOnboarding } from "../components/mom-onboarding";
import { PushPrompt } from "../components/push-prompt";
import { TtsPreload } from "../components/tts-preload";
import { ConfettiOverlay } from "../components/confetti-overlay";
import { ServiceWorkerRegister } from "../components/sw-register";
import { AppProviders } from "../components/app-providers";
import { OptionalClerkProvider } from "../components/clerk-provider";
import { ClerkTokenBridge } from "../components/clerk-token-bridge";
import { OptionalUserSync } from "../components/user-sync";
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
  maximumScale: 5,
  themeColor: "#0b5cad",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body>
        <OptionalClerkProvider>
          <AppProviders>
            <FontSizeProvider>
              <ClerkTokenBridge />
              <OptionalUserSync />
              {children}
              <TtsPreload />
              <ConfettiOverlay />
              <MomOnboarding />
              <PushPrompt />
              <ServiceWorkerRegister />
            </FontSizeProvider>
          </AppProviders>
        </OptionalClerkProvider>
      </body>
    </html>
  );
}
