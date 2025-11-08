'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      // Redirecionar para login com mensagem de erro
      router.push(`/login?error=${error}`);
      return;
    }

    if (token) {
      // Salvar token no cookie
      Cookies.set('access_token', token, {
        expires: 7, // 7 dias
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });

      // Redirecionar para o dashboard
      router.push('/dashboard');
    } else {
      // Token não encontrado, redirecionar para login
      router.push('/login?error=google_auth_failed');
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="p-8 space-y-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <h2 className="text-xl font-semibold">Processando login com Google...</h2>
        <p className="text-sm text-muted-foreground">
          Aguarde enquanto validamos suas credenciais.
        </p>
      </Card>
    </div>
  );
}
