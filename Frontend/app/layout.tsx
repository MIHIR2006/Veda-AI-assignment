import type { Metadata } from "next";
import { DM_Sans, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ServerWarmup } from "@/components/ServerWarmup";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["200", "800"], // Supporting the requested weight 800
});

export const metadata: Metadata = {
  title: "VedaAI - AI Teacher's Toolkit",
  description: "Create assignments and grade with the power of AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${bricolageGrotesque.variable} font-sans antialiased min-h-screen`} suppressHydrationWarning>
        <Providers>
          <ServerWarmup />
          {children}
        </Providers>
      </body>
    </html>
  );
}
