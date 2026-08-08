import type { Metadata, Viewport } from "next";
import { Fredoka, Quicksand } from "next/font/google";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { Providers } from "./providers";
import "./globals.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fredoka",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cozy-planner-seven.vercel.app"),
  title: "Cozy Planner",
  description: "A cozy calendar + to-do planner with an AI assistant.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/cozy-planner-icon.png",
    apple: "/cozy-planner-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Cozy Planner",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Required for the `env(safe-area-inset-*)` offsets the bottom nav and the
  // calendar action bar rely on; without it iOS reports every inset as 0.
  viewportFit: "cover",
  themeColor: "#fff4df",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className={`${quicksand.variable} ${fredoka.variable}`}>
        <Providers>
          <ServiceWorkerRegistrar />
          <PwaInstallPrompt />
          {children}
        </Providers>
      </body>
    </html>
  );
}
