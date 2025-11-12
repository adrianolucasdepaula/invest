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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRequestAnalysis } from '@/lib/hooks/use-analysis';
import { useToast } from '@/components/ui/use-toast';
import { Play, Loader2 } from 'lucide-react';

interface RequestAnalysisDialogProps {
  trigger?: React.ReactNode;
}

export function RequestAnalysisDialog({ trigger }: RequestAnalysisDialogProps) {
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState('');
  const [type, setType] = useState<'fundamental' | 'technical' | 'complete'>('complete');
  const { toast } = useToast();
  const requestAnalysis = useRequestAnalysis();

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

    try {
      await requestAnalysis.mutateAsync({
        ticker: ticker.toUpperCase(),
        type,
      });

      toast({
        title: 'Análise solicitada!',
        description: `A análise ${type === 'complete' ? 'completa' : type === 'fundamental' ? 'fundamentalista' : 'técnica'} de ${ticker.toUpperCase()} foi solicitada.`,
      });

      setOpen(false);
      setTicker('');
      setType('complete');
    } catch (error: any) {
      toast({
        title: 'Erro ao solicitar análise',
        description: error.response?.data?.message || 'Ocorreu um erro ao solicitar a análise.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
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
              <Label htmlFor="ticker">Ticker *</Label>
              <Input
                id="ticker"
                placeholder="Ex: PETR4"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                disabled={requestAnalysis.isPending}
              />
              <p className="text-sm text-muted-foreground">
                Código do ativo na B3
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Análise *</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as 'fundamental' | 'technical' | 'complete')}
                disabled={requestAnalysis.isPending}
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
              <p className="text-sm text-muted-foreground">
                Escolha o tipo de análise desejada
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={requestAnalysis.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={requestAnalysis.isPending}>
              {requestAnalysis.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Solicitando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Solicitar Análise
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
