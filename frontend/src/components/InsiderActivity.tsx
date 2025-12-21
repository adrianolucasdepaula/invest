'use client';

import React from 'react';
import { TrendingUp, TrendingDown, User, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/utils';

type TransactionType = 'buy' | 'sell';

interface InsiderTransaction {
  id: string;
  insiderName: string;
  insiderRole: string;
  transactionType: TransactionType;
  quantity: number;
  price: number;
  totalValue: number;
  date: Date | string;
}

interface InsiderActivityProps {
  ticker: string;
  transactions: InsiderTransaction[];
  summary?: {
    totalBuys: number;
    totalSells: number;
    netActivity: number;
  };
}

export default function InsiderActivity({
  ticker,
  transactions,
  summary,
}: InsiderActivityProps) {
  const getTransactionBadge = (type: TransactionType) => {
    if (type === 'buy') {
      return (
        <Badge variant="success" className="text-xs">
          <TrendingUp className="h-3 w-3 mr-1" />
          COMPRA
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="text-xs">
          <TrendingDown className="h-3 w-3 mr-1" />
          VENDA
        </Badge>
      );
    }
  };

  const calculateSummary = () => {
    if (summary) return summary;

    const buys = transactions.filter((t) => t.transactionType === 'buy');
    const sells = transactions.filter((t) => t.transactionType === 'sell');

    const totalBuys = buys.reduce((sum, t) => sum + t.totalValue, 0);
    const totalSells = sells.reduce((sum, t) => sum + t.totalValue, 0);

    return {
      totalBuys,
      totalSells,
      netActivity: totalBuys - totalSells,
    };
  };

  const summaryData = calculateSummary();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <div>
            <CardTitle>Atividade de Insiders</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Transações recentes de executivos e administradores
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Total Buys */}
          <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Total Compras
              </span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(summaryData.totalBuys)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {transactions.filter((t) => t.transactionType === 'buy').length}{' '}
              transações
            </p>
          </div>

          {/* Total Sells */}
          <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Total Vendas
              </span>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(summaryData.totalSells)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {transactions.filter((t) => t.transactionType === 'sell').length}{' '}
              transações
            </p>
          </div>

          {/* Net Activity */}
          <div
            className={cn(
              'p-4 rounded-lg border',
              summaryData.netActivity >= 0
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Atividade Líquida
              </span>
              <DollarSign
                className={cn(
                  'h-4 w-4',
                  summaryData.netActivity >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              />
            </div>
            <p
              className={cn(
                'text-xl font-bold',
                summaryData.netActivity >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {formatCurrency(Math.abs(summaryData.netActivity))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {summaryData.netActivity >= 0 ? 'Fluxo positivo' : 'Fluxo negativo'}
            </p>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-2" />
              <p>Nenhuma transação de insider registrada recentemente</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="p-4 rounded-lg border hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-sm">
                        {transaction.insiderName}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {transaction.insiderRole}
                    </p>
                  </div>
                  {getTransactionBadge(transaction.transactionType)}
                </div>

                {/* Transaction Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-md bg-muted/50">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Quantidade</p>
                    <p className="text-sm font-semibold">
                      {new Intl.NumberFormat('pt-BR').format(transaction.quantity)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Preço</p>
                    <p className="text-sm font-semibold">
                      {formatCurrency(transaction.price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Valor Total</p>
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        transaction.transactionType === 'buy'
                          ? 'text-green-600'
                          : 'text-red-600'
                      )}
                    >
                      {formatCurrency(transaction.totalValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Data</p>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs font-semibold">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Disclaimer */}
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-900 dark:text-blue-100">
            <strong>Nota:</strong> As transações de insiders são reportadas com até 2
            dias úteis de atraso conforme regulamentação da CVM. Estas informações não
            constituem recomendação de investimento.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
