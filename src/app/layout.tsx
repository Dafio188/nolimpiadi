import type { Metadata } from "next";
import { cookies } from "next/headers";
import Navbar from "@/components/ui/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOLImpiadi 2026",
  description: "Dashboard Olimpica",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get("admin_session")?.value === "authenticated";

  return (
    <html lang="it" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Navbar isLoggedIn={isLoggedIn} />
        {children}
      </body>
    </html>
  );
}
