'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { SidebarProvider, useSidebar } from '@/contexts/sidebar-context';

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, isMounted } = useSidebar();

  // Use consistent initial state (w-64) until client is mounted to avoid hydration mismatch
  const sidebarWidth = !isMounted ? 'w-64' : isOpen ? 'w-64' : 'w-0';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Navigation - Semantic aside landmark */}
      <div
        className={`transition-all duration-300 ease-in-out ${sidebarWidth} overflow-hidden`}
      >
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        {/* Main Content - Semantic main landmark with skip-link target */}
        <main
          id="main-content"
          role="main"
          aria-label="Conteúdo principal"
          className="flex-1 overflow-y-auto bg-muted/10 p-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}
