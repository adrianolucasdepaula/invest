'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/header';
import { SidebarProvider, useSidebar } from '@/contexts/sidebar-context';
import { TrendingUp } from 'lucide-react';

// Skeleton sidebar for loading state - used consistently on server and client
function SidebarSkeleton() {
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">B3 AI Analysis</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center space-x-3 rounded-lg px-3 py-2"
          >
            <div className="h-5 w-5 bg-muted rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </nav>
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

// Lazy load sidebar - renders skeleton during loading
const LazySidebar = dynamic(
  () => import('@/components/layout/sidebar').then((mod) => mod.Sidebar),
  {
    ssr: false,
  }
);

// Wrapper that handles the suspense boundary consistently
function SidebarWrapper() {
  return (
    <Suspense fallback={<SidebarSkeleton />}>
      <LazySidebar />
    </Suspense>
  );
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
      {/* Sidebar Navigation */}
      <div
        className={`transition-all duration-300 ease-in-out ${sidebarWidth} overflow-hidden`}
        suppressHydrationWarning
      >
        <SidebarWrapper />
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
