import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#eef3fb] text-[var(--foreground)]">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1 bg-[#eef3fb]">
          <Topbar />
          <main className="px-4 py-6 md:px-8 lg:px-9">{children}</main>
        </div>
      </div>
    </div>
  );
}
