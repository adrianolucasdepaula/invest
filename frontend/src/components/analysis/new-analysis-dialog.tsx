'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Play } from 'lucide-react';

interface NewAnalysisDialogProps {
  children?: React.ReactNode;
}

export function NewAnalysisDialog({ children }: NewAnalysisDialogProps) {
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState('');
  const [type, setType] = useState<'fundamental' | 'technical' | 'complete'>('complete');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ticker) {
      toast({
        title: 'Ticker obrigatório',
        description: 'Por favor, informe o ticker do ativo.',
        variant: 'destructive',
      });
      return;
    }

    // Validar token
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: 'Não autorizado',
        description: 'Você precisa estar autenticado. Por favor, faça login novamente.',
        variant: 'destructive',
      });
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/${ticker.toUpperCase()}/${type}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: 'Sessão expirada',
            description: 'Sua sessão expirou. Por favor, faça login novamente.',
            variant: 'destructive',
          });
          // Limpar token e redirecionar
          localStorage.removeItem('token');
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 2000);
          return;
        }

        const error = await response.json().catch(() => ({ message: 'Falha ao solicitar análise' }));
        throw new Error(error.message || 'Falha ao solicitar análise');
      }

      const data = await response.json();

      toast({
        title: 'Análise solicitada!',
        description: `A análise ${
          type === 'complete' ? 'completa' : type === 'fundamental' ? 'fundamentalista' : 'técnica'
        } de ${ticker.toUpperCase()} foi solicitada com sucesso. ID: ${data.id}`,
      });

      setOpen(false);
      setTicker('');
      setType('complete');

      // Refresh page to show new analysis
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      console.error('Erro ao solicitar análise:', error);
      toast({
        title: 'Erro ao solicitar análise',
        description: error.message || 'Ocorreu um erro ao solicitar a análise. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Play className="mr-2 h-4 w-4" />
            Nova Análise
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Solicitar Nova Análise</DialogTitle>
            <DialogDescription>
              Solicite uma análise técnica, fundamentalista ou completa de um ativo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="ticker" className="text-sm font-medium">
                Ticker *
              </label>
              <Input
                id="ticker"
                placeholder="Ex: PETR4"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                required
              />
              <p className="text-xs text-muted-foreground">
                Código do ativo na B3
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                Tipo de Análise *
              </label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as 'fundamental' | 'technical' | 'complete')}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complete">Completa (IA + Fundamentalista + Técnica)</SelectItem>
                  <SelectItem value="fundamental">Fundamentalista</SelectItem>
                  <SelectItem value="technical">Técnica</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Escolha o tipo de análise desejada
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              <Play className="mr-2 h-4 w-4" />
              Solicitar Análise
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
