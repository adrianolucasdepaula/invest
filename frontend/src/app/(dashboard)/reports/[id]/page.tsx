'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReport } from '@/lib/hooks/use-report';
import {
  ArrowLeft,
  Download,
  PlayCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.id as string;

  const { data: report, isLoading, error } = useReport(reportId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-6 max-w-md">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-6 w-6" />
            <div>
              <p className="font-semibold">Erro ao Carregar Relatório</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Relatório não encontrado'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => router.push('/reports')}
              >
                Voltar para Relatórios
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const { asset, recommendation, confidenceScore, summary, analysis, currentPrice, changePercent } = report;

  const getRecommendationBadge = () => {
    const badges = {
      strong_buy: <Badge className="bg-green-600">Compra Forte</Badge>,
      buy: <Badge className="bg-green-500">Compra</Badge>,
      hold: <Badge variant="secondary">Manter</Badge>,
      sell: <Badge className="bg-red-500">Venda</Badge>,
      strong_sell: <Badge className="bg-red-600">Venda Forte</Badge>,
    };
    return badges[recommendation as keyof typeof badges] || null;
  };

  const handleDownload = (format: 'pdf' | 'json') => {
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101'}/api/v1/reports/${reportId}/download?format=${format}`,
      '_blank',
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Relatório: {asset.ticker}</h1>
            <p className="text-muted-foreground">{asset.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleDownload('pdf')}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={() => handleDownload('json')}>
            <Download className="mr-2 h-4 w-4" />
            Download JSON
          </Button>
          <Button>
            <PlayCircle className="mr-2 h-4 w-4" />
            Gerar Novo Relatório
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Recomendação</p>
            <div className="mt-2">{getRecommendationBadge()}</div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Confiança</p>
            <p className="text-2xl font-bold mt-1">
              {(confidenceScore * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Preço Atual</p>
            <p className="text-2xl font-bold mt-1">
              {currentPrice ? `R$ ${Number(currentPrice).toFixed(2)}` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gerado em</p>
            <p className="text-lg font-medium mt-1">
              {formatDate(new Date(report.createdAt), 'dd/MM/yyyy', {
                locale: ptBR,
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="fundamental">Fundamentalista</TabsTrigger>
          <TabsTrigger value="technical">Técnica</TabsTrigger>
          <TabsTrigger value="risks">Riscos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Resumo Executivo</h3>
            <p className="text-muted-foreground">{summary}</p>
          </Card>

          {analysis?.keyPoints && (
            <Card className="p-6">
              <h4 className="font-semibold mb-3">Pontos Chave</h4>
              <ul className="space-y-2">
                {analysis.keyPoints.map((point: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm">{point}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Adicionar mais seções conforme dados disponíveis */}
        </TabsContent>

        <TabsContent value="fundamental">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Análise Fundamentalista</h3>
            {analysis?.fundamental ? (
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(analysis.fundamental, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">
                Dados fundamentalistas não disponíveis
              </p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="technical">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Análise Técnica</h3>
            {analysis?.technical ? (
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(analysis.technical, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">
                Dados técnicos não disponíveis
              </p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="risks">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Análise de Riscos</h3>
            {report.risks ? (
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(report.risks, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">
                Análise de riscos não disponível
              </p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
