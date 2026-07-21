import type { Metadata, Viewport } from "next";
import { Fredoka, Quicksand } from "next/font/google";
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
  title: "Cozy Planner",
  description: "A cozy calendar + to-do planner with an AI assistant.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f4ef",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className={`${quicksand.variable} ${fredoka.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
