'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AssetDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Asset detail error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="p-8 max-w-md w-full">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Erro ao Carregar Ativo</h2>
            <p className="text-muted-foreground mt-2">
              Ocorreu um erro ao carregar os detalhes do ativo. Verifique se o ticker existe.
            </p>
          </div>
          {error.message && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
              {error.message}
            </p>
          )}
          <div className="flex gap-3">
            <Button onClick={reset} variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            <Link href="/assets">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Ativos
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
