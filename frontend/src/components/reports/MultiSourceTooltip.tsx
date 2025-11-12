import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Componente: Tooltip explicando coleta multi-fonte
 *
 * Mostra ao usuário que as análises são feitas a partir de múltiplas fontes
 * com cross-validation e scoring de confiança.
 */
export function MultiSourceTooltip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <Info className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm">
          <div className="space-y-2">
            <p className="font-semibold">Coleta Multi-Fonte</p>
            <p className="text-sm">
              As análises são geradas a partir de <strong>4 fontes de dados</strong>:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1">
              <li>Fundamentus (público)</li>
              <li>BRAPI (API pública)</li>
              <li>StatusInvest (autenticado)</li>
              <li>Investidor10 (autenticado)</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Os dados são cruzados e validados para gerar um score de confiança de 0 a 100%.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
