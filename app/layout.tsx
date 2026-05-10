import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { PageTransition } from "@/components/page-transition";
import { AuthProvider } from "@/components/session-provider";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "nznt's hub | #1 Script Hub",
  description:
    "The #1 Roblox script hub. Multi-game support, undetectable autofarms, anti-ban, and premium features.",
  generator: "nznt's hub",
  icons: {
    icon: "/avatar.png",
    apple: "/avatar.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <PageTransition>{children}</PageTransition>
          {process.env.NODE_ENV === "production" && <Analytics />}
        </AuthProvider>
      </body>
    </html>
  );
}
