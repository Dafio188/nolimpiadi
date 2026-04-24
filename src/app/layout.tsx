import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOLImpiadi 2026",
  description: "Dashboard Olimpica",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}
