'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { SidebarProvider, useSidebar } from '@/contexts/sidebar-context';

// Skeleton para loading state - garante mesmo layout durante carregamento
function SidebarSkeleton() {
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <div className="h-8 w-8 rounded bg-muted animate-pulse" />
        <div className="ml-2 h-6 w-32 rounded bg-muted animate-pulse" />
      </div>
      <div className="flex-1 space-y-2 px-3 py-4">
        {Array(12).fill(0).map((_, i) => (
          <div key={i} className="h-10 rounded bg-muted animate-pulse" />
        ))}
      </div>
      <div className="border-t p-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-20 bg-muted rounded animate-pulse mb-1" />
            <div className="h-3 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Client-only Sidebar wrapper - evita problemas de hydration e webpack
function ClientOnlySidebar() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <SidebarSkeleton />;
  }

  return <Sidebar />;
}

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
      {/* Sidebar Navigation - Client-only rendering */}
      <div
        className={`transition-all duration-300 ease-in-out ${sidebarWidth} overflow-hidden`}
        suppressHydrationWarning
      >
        <ClientOnlySidebar />
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
