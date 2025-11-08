import { Injectable } from '@nestjs/common';
import { Analysis } from '@database/entities/analysis.entity';

@Injectable()
export class ReportTemplateService {
  /**
   * Generates a complete HTML report from analysis data
   */
  generateHtmlReport(analysis: Analysis): string {
    const createdAt = new Date(analysis.createdAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Análise - ${analysis.asset?.ticker || 'N/A'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: #ffffff;
            padding: 40px 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
        }

        .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .header h1 {
            font-size: 32px;
            color: #1a1a1a;
            margin-bottom: 10px;
        }

        .header .subtitle {
            font-size: 18px;
            color: #6b7280;
        }

        .metadata {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
        }

        .metadata-item {
            display: flex;
            flex-direction: column;
        }

        .metadata-item .label {
            font-size: 12px;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 4px;
            font-weight: 600;
            letter-spacing: 0.5px;
        }

        .metadata-item .value {
            font-size: 16px;
            color: #1a1a1a;
            font-weight: 600;
        }

        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }

        .section-title {
            font-size: 22px;
            color: #1a1a1a;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
        }

        .recommendation-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .recommendation-comprar {
            background: #dcfce7;
            color: #166534;
        }

        .recommendation-vender {
            background: #fee2e2;
            color: #991b1b;
        }

        .recommendation-manter {
            background: #fef3c7;
            color: #92400e;
        }

        .confidence-bar {
            width: 100%;
            height: 24px;
            background: #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            margin-top: 8px;
        }

        .confidence-fill {
            height: 100%;
            background: linear-gradient(to right, #3b82f6, #2563eb);
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 12px;
            color: white;
            font-weight: 600;
            font-size: 12px;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .metric-card {
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }

        .metric-card .metric-label {
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 8px;
            font-weight: 500;
        }

        .metric-card .metric-value {
            font-size: 24px;
            color: #1a1a1a;
            font-weight: 700;
        }

        .metric-card .metric-subtitle {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 4px;
        }

        .content-block {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin-top: 15px;
            white-space: pre-wrap;
            line-height: 1.8;
        }

        .analysis-text {
            font-size: 15px;
            color: #374151;
            line-height: 1.8;
        }

        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 13px;
        }

        .highlights {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 15px;
        }

        .highlight-item {
            padding: 12px 16px;
            background: white;
            border-left: 4px solid #2563eb;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .risk-level {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 13px;
        }

        .risk-baixo { background: #dcfce7; color: #166534; }
        .risk-medio { background: #fef3c7; color: #92400e; }
        .risk-alto { background: #fee2e2; color: #991b1b; }

        @media print {
            body {
                padding: 0;
            }
            .container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Relatório de Análise ${analysis.type === 'complete' ? 'Completa' : 'Técnica'}</h1>
            <div class="subtitle">${analysis.asset?.name || analysis.asset?.ticker || 'Ativo Desconhecido'}</div>
        </div>

        <!-- Metadata -->
        <div class="metadata">
            <div class="metadata-item">
                <span class="label">Ticker</span>
                <span class="value">${analysis.asset?.ticker || 'N/A'}</span>
            </div>
            <div class="metadata-item">
                <span class="label">Tipo de Análise</span>
                <span class="value">${analysis.type === 'complete' ? 'Completa' : analysis.type === 'technical' ? 'Técnica' : 'Fundamental'}</span>
            </div>
            <div class="metadata-item">
                <span class="label">Data de Geração</span>
                <span class="value">${createdAt}</span>
            </div>
            <div class="metadata-item">
                <span class="label">Status</span>
                <span class="value">${analysis.status === 'completed' ? 'Concluída' : analysis.status === 'pending' ? 'Pendente' : 'Processando'}</span>
            </div>
        </div>

        ${this.generateRecommendationSection(analysis)}
        ${this.generateMetricsSection(analysis)}
        ${this.generateAnalysisSection(analysis)}
        ${this.generateRisksSection(analysis)}

        <!-- Footer -->
        <div class="footer">
            <p>Relatório gerado automaticamente pela plataforma B3 AI Analysis Platform</p>
            <p>Este documento é apenas informativo e não constitui recomendação de investimento.</p>
            <p>Gerado em: ${createdAt}</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  private generateRecommendationSection(analysis: Analysis): string {
    const recommendation = this.formatRecommendation(analysis.recommendation);
    const confidence = (analysis.confidenceScore || 0) * 100; // Convert 0-1 to 0-100

    const badgeClass = recommendation.toLowerCase().includes('comprar') || recommendation.toLowerCase().includes('compra')
      ? 'recommendation-comprar'
      : recommendation.toLowerCase().includes('vender') || recommendation.toLowerCase().includes('venda')
      ? 'recommendation-vender'
      : 'recommendation-manter';

    return `
        <div class="section">
            <h2 class="section-title">Recomendação</h2>
            <div style="margin-top: 20px;">
                <span class="recommendation-badge ${badgeClass}">${recommendation}</span>
                <div style="margin-top: 20px;">
                    <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
                        Nível de Confiança
                    </div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${confidence}%">
                            ${confidence.toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
  }

  private generateMetricsSection(analysis: Analysis): string {
    const targetPrice = analysis.targetPrices?.medium || analysis.targetPrices?.high || 0;
    const currentPrice = analysis.analysis?.currentPrice || 0;
    const upside = targetPrice && currentPrice
      ? ((targetPrice - currentPrice) / currentPrice) * 100
      : 0;

    return `
        <div class="section">
            <h2 class="section-title">Métricas Principais</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-label">Preço Atual</div>
                    <div class="metric-value">R$ ${currentPrice.toFixed(2)}</div>
                    <div class="metric-subtitle">Última cotação</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Preço Alvo</div>
                    <div class="metric-value">R$ ${targetPrice.toFixed(2)}</div>
                    <div class="metric-subtitle">Estimativa 12 meses</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Potencial de Valorização</div>
                    <div class="metric-value" style="color: ${upside >= 0 ? '#059669' : '#dc2626'}">
                        ${upside >= 0 ? '+' : ''}${upside.toFixed(2)}%
                    </div>
                    <div class="metric-subtitle">Upside esperado</div>
                </div>
            </div>
        </div>
    `;
  }

  private generateAnalysisSection(analysis: Analysis): string {
    const summary = analysis.summary || 'Análise não disponível';
    const keyPoints = analysis.analysis?.keyPoints || [];

    let keyPointsHtml = '';
    if (Array.isArray(keyPoints) && keyPoints.length > 0) {
      keyPointsHtml = `
        <div class="highlights">
          ${keyPoints.map((point: string) => `<div class="highlight-item">${point}</div>`).join('\n')}
        </div>
      `;
    }

    return `
        <div class="section">
            <h2 class="section-title">Análise Detalhada</h2>
            <div class="content-block">
                <div class="analysis-text">${summary}</div>
            </div>
            ${keyPointsHtml}
        </div>
    `;
  }

  private generateRisksSection(analysis: Analysis): string {
    const risks = analysis.risks?.list || [];
    const riskLevel = analysis.risks?.level || 'Médio';

    let risksHtml = '';
    if (Array.isArray(risks) && risks.length > 0) {
      risksHtml = `
        <div class="highlights">
          ${risks.map((risk: string) => `<div class="highlight-item">${risk}</div>`).join('\n')}
        </div>
      `;
    } else {
      risksHtml = '<p style="color: #6b7280; margin-top: 15px;">Nenhum risco específico identificado nesta análise.</p>';
    }

    const riskClass = riskLevel.toLowerCase().includes('baixo')
      ? 'risk-baixo'
      : riskLevel.toLowerCase().includes('alto')
      ? 'risk-alto'
      : 'risk-medio';

    return `
        <div class="section">
            <h2 class="section-title">Riscos e Considerações</h2>
            <div style="margin-top: 15px;">
                <span style="font-size: 14px; color: #6b7280; margin-right: 10px;">Nível de Risco:</span>
                <span class="risk-level ${riskClass}">${riskLevel}</span>
            </div>
            ${risksHtml}
        </div>
    `;
  }

  /**
   * Helper method to format recommendation enum to Portuguese
   */
  private formatRecommendation(recommendation: any): string {
    if (!recommendation) return 'N/A';

    const map: Record<string, string> = {
      strong_buy: 'Compra Forte',
      buy: 'Compra',
      hold: 'Manter',
      sell: 'Venda',
      strong_sell: 'Venda Forte',
    };

    return map[recommendation] || recommendation.toString();
  }
}
