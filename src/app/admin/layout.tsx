import AdminNavbar from "@/components/ui/AdminNavbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <AdminNavbar />
      <main className="p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
