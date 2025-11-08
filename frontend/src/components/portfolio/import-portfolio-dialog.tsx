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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useImportPortfolio } from '@/lib/hooks/use-portfolio';
import { Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

interface ImportPortfolioDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function ImportPortfolioDialog({
  trigger,
  onSuccess,
}: ImportPortfolioDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<'b3' | 'kinvo' | 'myprofit' | 'nuinvest'>('b3');
  const { toast } = useToast();
  const importMutation = useImportPortfolio();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: 'Arquivo não selecionado',
        description: 'Por favor, selecione um arquivo para importar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await importMutation.mutateAsync({ file, source });
      toast({
        title: 'Importação concluída!',
        description: 'Seu portfólio foi importado com sucesso.',
        variant: 'default',
      });
      setOpen(false);
      setFile(null);
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Erro na importação',
        description: 'Não foi possível importar o portfólio. Verifique o arquivo e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Importar Portfólio
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Importar Portfólio</DialogTitle>
          <DialogDescription>
            Importe seu portfólio de investimentos de diversas plataformas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Origem dos Dados</label>
            <Select value={source} onValueChange={(value: any) => setSource(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="b3">
                  <div className="flex items-center">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    B3 (CEI)
                  </div>
                </SelectItem>
                <SelectItem value="kinvo">
                  <div className="flex items-center">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Kinvo
                  </div>
                </SelectItem>
                <SelectItem value="myprofit">
                  <div className="flex items-center">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    MyProfit
                  </div>
                </SelectItem>
                <SelectItem value="nuinvest">
                  <div className="flex items-center">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Nu Invest
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selecione de onde você está importando os dados
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Arquivo</label>
            <div className="flex items-center gap-2">
              <label
                htmlFor="file-upload"
                className="flex-1 cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent transition-colors flex items-center justify-center"
              >
                <Upload className="mr-2 h-4 w-4" />
                {file ? file.name : 'Selecionar arquivo'}
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {file && (
                <CheckCircle2 className="h-5 w-5 text-success" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: .xlsx, .xls, .csv
            </p>
          </div>

          {source === 'b3' && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h4 className="text-sm font-semibold">Como exportar da B3:</h4>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Acesse o Canal Eletrônico do Investidor (CEI)</li>
                <li>Vá em &quot;Consultas&quot; → &quot;Posição Consolidada&quot;</li>
                <li>Selecione &quot;Exportar para Excel&quot;</li>
                <li>Faça o upload do arquivo aqui</li>
              </ol>
            </div>
          )}

          {source === 'kinvo' && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h4 className="text-sm font-semibold">Como exportar do Kinvo:</h4>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Entre no Kinvo Web</li>
                <li>Acesse sua carteira de investimentos</li>
                <li>Clique em &quot;Exportar&quot; no canto superior direito</li>
                <li>Escolha o formato Excel ou CSV</li>
                <li>Faça o upload do arquivo aqui</li>
              </ol>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || importMutation.isPending}
          >
            {importMutation.isPending ? 'Importando...' : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
