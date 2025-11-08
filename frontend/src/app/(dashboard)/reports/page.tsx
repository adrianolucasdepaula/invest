'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Download,
  Eye,
  Clock,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  FileJson,
  FileType,
  ChevronDown,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useReports, useGenerateReport } from '@/lib/hooks/use-reports';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

const getRecommendationColor = (recommendation: string) => {
  const rec = recommendation?.toUpperCase() || '';
  if (rec.includes('STRONG_BUY') || rec === 'STRONG BUY') {
    return 'text-success bg-success/10 border-success/20';
  }
  if (rec.includes('BUY')) {
    return 'text-success bg-success/10 border-success/20';
  }
  if (rec.includes('HOLD')) {
    return 'text-warning bg-warning/10 border-warning/20';
  }
  if (rec.includes('SELL') && !rec.includes('STRONG')) {
    return 'text-destructive bg-destructive/10 border-destructive/20';
  }
  if (rec.includes('STRONG_SELL') || rec === 'STRONG SELL') {
    return 'text-destructive bg-destructive/10 border-destructive/20';
  }
  return 'text-muted-foreground bg-muted/10 border-muted/20';
};

const getRecommendationLabel = (recommendation: string) => {
  const rec = recommendation?.toUpperCase() || '';
  if (rec.includes('STRONG_BUY') || rec === 'STRONG BUY') return 'Compra Forte';
  if (rec.includes('BUY')) return 'Compra';
  if (rec.includes('HOLD')) return 'Manter';
  if (rec.includes('STRONG_SELL') || rec === 'STRONG SELL') return 'Venda Forte';
  if (rec.includes('SELL')) return 'Venda';
  return recommendation || 'N/A';
};

const getRecommendationIcon = (recommendation: string) => {
  const rec = recommendation?.toUpperCase() || '';
  if (rec.includes('BUY')) return <TrendingUp className="h-4 w-4" />;
  if (rec.includes('HOLD')) return <Minus className="h-4 w-4" />;
  if (rec.includes('SELL')) return <TrendingDown className="h-4 w-4" />;
  return null;
};

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: reports, isLoading, error } = useReports();
  const generateReport = useGenerateReport();
  const { toast } = useToast();

  const handleDownload = async (reportId: string, format: 'pdf' | 'html' | 'json') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/${reportId}/download?format=${format}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Falha ao baixar relatório');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Get filename from Content-Disposition header or create a default one
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/);
      const filename = filenameMatch?.[1] || `report_${reportId}.${format}`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Download concluído!',
        description: `Relatório baixado em formato ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao baixar relatório',
        description: 'Não foi possível baixar o relatório. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const filteredReports = (reports || []).filter(
    (report: any) =>
      report.asset?.ticker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.asset?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-4">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
                <div className="grid grid-cols-4 gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Relatórios de análise gerados com inteligência artificial
          </p>
        </div>
        <Button disabled={true}>
          <Plus className="mr-2 h-4 w-4" />
          Gerar Novo Relatório
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar relatórios por ticker ou ativo..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {filteredReports.length > 0 ? (
        <div className="grid gap-4">
          {filteredReports.map((report: any) => {
            const ticker = report.asset?.ticker || 'N/A';
            const assetName = report.asset?.name || 'Desconhecido';
            const recommendation = report.result?.recommendation || report.recommendation || 'N/A';
            const confidence = report.result?.confidence || report.confidence || 0;
            const targetPrice = report.result?.targetPrice || report.targetPrice || 0;
            const currentPrice = report.result?.currentPrice || report.asset?.price || 0;
            const upside = targetPrice && currentPrice
              ? ((targetPrice - currentPrice) / currentPrice) * 100
              : 0;

            return (
              <Card key={report.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-xl font-semibold">{ticker}</h3>
                        <p className="text-sm text-muted-foreground">{assetName}</p>
                      </div>
                      <div
                        className={cn(
                          'flex items-center space-x-2 rounded-full border px-3 py-1',
                          getRecommendationColor(recommendation),
                        )}
                      >
                        {getRecommendationIcon(recommendation)}
                        <span className="text-sm font-semibold">
                          {getRecommendationLabel(recommendation)}
                        </span>
                      </div>
                      {confidence > 0 && (
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <span>Confiança:</span>
                          <span className="font-semibold text-foreground">
                            {confidence}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Preço Atual</p>
                        <p className="text-lg font-semibold">
                          {currentPrice > 0 ? formatCurrency(currentPrice) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Preço Alvo</p>
                        <p className="text-lg font-semibold">
                          {targetPrice > 0 ? formatCurrency(targetPrice) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Potencial</p>
                        <p
                          className={cn(
                            'text-lg font-semibold',
                            upside >= 0 ? 'text-success' : 'text-destructive',
                          )}
                        >
                          {upside !== 0 ? `${upside >= 0 ? '+' : ''}${upside.toFixed(2)}%` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Gerado em</p>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Link href={`/reports/${report.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                          <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(report.id, 'pdf')}>
                          <FileText className="mr-2 h-4 w-4" />
                          PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(report.id, 'html')}>
                          <FileType className="mr-2 h-4 w-4" />
                          HTML
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(report.id, 'json')}>
                          <FileJson className="mr-2 h-4 w-4" />
                          JSON
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <FileText className="h-16 w-16 text-muted-foreground/50" />
            <div>
              <h3 className="text-lg font-semibold">
                {searchTerm ? 'Nenhum relatório encontrado' : 'Nenhum relatório gerado ainda'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? 'Tente buscar por outro termo ou gere um novo relatório'
                  : 'Gere relatórios completos de análise para acompanhar seus ativos'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
