import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "INNOVISION — Disaster Relief Intelligence",
  description:
    "From damage to recovery: village-level relief distribution and restoration tracking. Demo prototype.",
};

// Restore the user's saved theme before first paint to avoid a flash.
const themeInit = `
try{var t=localStorage.getItem('disaster-theme');if(t==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}