'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, AlertCircle, TrendingUp, TrendingDown, Clock, Globe, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface EconomicEvent {
  id: string;
  name: string;
  nameEn?: string;
  country: string;
  importance: 'low' | 'medium' | 'high';
  category: string;
  eventDate: string;
  isAllDay: boolean;
  actual?: number;
  forecast?: number;
  previous?: number;
  unit?: string;
  impactDirection?: 'positive' | 'negative' | 'neutral';
}

interface CalendarResponse {
  events: EconomicEvent[];
  count: number;
}

/**
 * FASE 90: Resposta do endpoint de coleta com contagem precisa
 */
interface CollectResponse {
  message: string;
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  bySource: Record<string, number>;
}

const importanceColors = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const countryFlags: Record<string, string> = {
  BRA: '🇧🇷',
  USA: '🇺🇸',
  EUR: '🇪🇺',
  GBR: '🇬🇧',
  JPN: '🇯🇵',
  CHN: '🇨🇳',
  XXX: '🌐',
};

const categoryLabels: Record<string, string> = {
  interest_rate: 'Juros',
  inflation: 'Inflação',
  employment: 'Emprego',
  gdp: 'PIB',
  trade: 'Comércio',
  consumer: 'Consumo',
  manufacturing: 'Indústria',
  housing: 'Imóveis',
  central_bank: 'Banco Central',
  other: 'Outros',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) {
    return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (isTomorrow) {
    return `Amanhã, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatEventValue(val: unknown, unit?: string): string {
  // Handle null/undefined/empty
  if (val === undefined || val === null || val === '') return '-';

  // Safely convert to number
  let num: number;
  if (typeof val === 'string') {
    num = parseFloat(val);
  } else if (typeof val === 'number') {
    num = val;
  } else {
    num = Number(val);
  }

  // Validate conversion
  if (Number.isNaN(num) || !Number.isFinite(num)) return '-';

  // Format with 2 decimals
  return `${num.toFixed(2)}${unit ?? ''}`;
}

export function EconomicCalendarWidget() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<CalendarResponse>({
    queryKey: ['economic-calendar', 'high-impact'],
    queryFn: async () => {
      const response = await api.get('/news/economic-calendar/high-impact', {
        params: { limit: 5 },
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });

  // FASE 90: Mutation com toast contextual baseado no resultado
  const syncMutation = useMutation({
    mutationFn: async (): Promise<CollectResponse> => {
      const response = await api.post('/news/economic-calendar/collect', null, {
        timeout: 60000, // 60s para coleta (pode demorar)
      });
      return response.data;
    },
    onSuccess: (data) => {
      // FASE 90: Toast contextual baseado no resultado
      const inserted = data?.inserted ?? 0;
      const updated = data?.updated ?? 0;
      const skipped = data?.skipped ?? 0;

      if (inserted > 0 && updated > 0) {
        toast.success(`Calendário atualizado: ${inserted} novos, ${updated} atualizados`);
      } else if (inserted > 0) {
        toast.success(`${inserted} eventos novos adicionados`);
      } else if (updated > 0) {
        toast.success(`${updated} eventos atualizados`);
      } else if (skipped > 0) {
        toast.info('Calendário já está atualizado', {
          description: `${skipped} eventos verificados, sem alterações`,
        });
      } else {
        toast.warning('Nenhum evento encontrado nas fontes', {
          description: 'Verifique a conectividade com BCB e Investing.com',
        });
      }

      // Force refetch para atualizar cache
      queryClient.invalidateQueries({ queryKey: ['economic-calendar'] });
      queryClient.refetchQueries({ queryKey: ['economic-calendar'] });
    },
    onError: (error: Error) => {
      // FASE 90: Error handling com detalhes
      let description = error.message;

      if (error.message.includes('timeout')) {
        description = 'A coleta está demorando. Tente novamente em alguns minutos.';
      } else if (error.message.includes('Network Error')) {
        description = 'Sem conexão com o servidor. Verifique sua internet.';
      }

      toast.error('Erro ao sincronizar calendário', {
        description,
      });
    },
    retry: 1,
    retryDelay: 3000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendário Econômico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendário Econômico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Erro ao carregar eventos</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const events = data?.events || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendário Econômico
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            title="Sincronizar calendário"
            className="h-7 w-7"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', syncMutation.isPending && 'animate-spin')} />
          </Button>
        </CardTitle>
        <CardDescription>
          Próximos eventos de alto impacto
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum evento de alto impacto próximo</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Country Flag */}
                <div className="text-2xl">
                  {countryFlags[event.country] || countryFlags.XXX}
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{event.name}</h4>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', importanceColors[event.importance])}
                    >
                      {event.importance === 'high' ? 'Alto' : event.importance === 'medium' ? 'Médio' : 'Baixo'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(event.eventDate)}</span>
                    <span className="opacity-50">|</span>
                    <Globe className="h-3 w-3" />
                    <span>{categoryLabels[event.category] || event.category}</span>
                  </div>

                  {/* Values Row */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Anterior: </span>
                      <span className="font-medium">{formatEventValue(event.previous, event.unit)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Previsão: </span>
                      <span className="font-medium">{formatEventValue(event.forecast, event.unit)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Atual: </span>
                      {event.actual !== undefined ? (
                        <>
                          <span className="font-semibold">
                            {formatEventValue(event.actual, event.unit)}
                          </span>
                          {event.impactDirection === 'positive' && (
                            <TrendingUp className="h-3 w-3 text-success" />
                          )}
                          {event.impactDirection === 'negative' && (
                            <TrendingDown className="h-3 w-3 text-destructive" />
                          )}
                        </>
                      ) : (
                        <span className="font-medium text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
