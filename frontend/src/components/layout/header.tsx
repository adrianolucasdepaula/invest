'use client';

import { Bell, Search, LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useEffect, useState } from 'react';
import { useSidebar } from '@/contexts/sidebar-context';

export function Header() {
  const router = useRouter();
  const { toast } = useToast();
  const { toggle } = useSidebar();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Buscar dados do usuário
    const fetchUser = async () => {
      try {
        const userData = await api.getProfile();
        setUser(userData);
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado com sucesso.',
      });
      window.location.href = '/login';
    } catch (error) {
      toast({
        title: 'Erro ao fazer logout',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <div className="flex items-center space-x-4 flex-1 max-w-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="shrink-0"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar ativos, análises..."
            className="pl-9 w-full"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {user && (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-muted/50">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {user.firstName} {user.lastName}
            </span>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="flex items-center space-x-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </Button>
      </div>
    </header>
  );
}
