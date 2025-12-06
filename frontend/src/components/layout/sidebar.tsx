'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  FileText,
  Database,
  Settings,
  BarChart3,
  Shield,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Ativos', href: '/assets', icon: TrendingUp },
  { name: 'Análises', href: '/analysis', icon: BarChart3 },
  { name: 'Portfólio', href: '/portfolio', icon: Briefcase },
  { name: 'Relatórios', href: '/reports', icon: FileText },
  { name: 'Fontes de Dados', href: '/data-sources', icon: Database },
  { name: 'Discrepancias', href: '/discrepancies', icon: AlertTriangle },
  { name: 'Gerenciamento de Dados', href: '/data-management', icon: RefreshCw },
  { name: 'OAuth Manager', href: '/oauth-manager', icon: Shield },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">B3 AI Analysis</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (pathname && pathname.startsWith(item.href + '/'));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <UserProfile />
      </div>
    </div>
  );
}

function UserProfile() {
  const { user, loading } = useUser();

  if (loading || !user) {
    return (
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 animate-pulse" />
        <div className="flex-1">
          <div className="h-4 w-20 bg-muted rounded animate-pulse mb-1" />
          <div className="h-3 w-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();

  return (
    <div className="flex items-center space-x-3">
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
    </div>
  );
}
