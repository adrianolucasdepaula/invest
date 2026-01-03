'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, Clock, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TestResult {
  scraperId: string;
  scraperName: string;
  query: string;
  status: 'success' | 'error' | 'running';
  data?: any;
  error?: string;
  executionTime?: number;
  timestamp: Date;
}

interface TestResultModalProps {
  result: TestResult;
  onClose: () => void;
}

export default function TestResultModal({ result, onClose }: TestResultModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('formatted');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatJSON = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return 'Error formatting JSON';
    }
  };

  const renderFormattedData = (data: any, level = 0): React.ReactNode => {
    if (data === null || data === undefined) {
      return <span className="text-gray-500">null</span>;
    }

    if (typeof data === 'boolean') {
      return <span className="text-blue-600">{data.toString()}</span>;
    }

    if (typeof data === 'number') {
      return <span className="text-green-600">{data}</span>;
    }

    if (typeof data === 'string') {
      return <span className="text-orange-600">&quot;{data}&quot;</span>;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return <span className="text-gray-500">[]</span>;
      }

      return (
        <div className={level > 0 ? 'ml-4' : ''}>
          <span className="text-gray-500">[</span>
          {data.map((item, idx) => (
            <div key={idx} className="ml-4">
              {renderFormattedData(item, level + 1)}
              {idx < data.length - 1 && <span className="text-gray-500">,</span>}
            </div>
          ))}
          <span className="text-gray-500">]</span>
        </div>
      );
    }

    if (typeof data === 'object') {
      const keys = Object.keys(data);
      if (keys.length === 0) {
        return <span className="text-gray-500">{'{}'}</span>;
      }

      return (
        <div className={level > 0 ? 'ml-4' : ''}>
          <span className="text-gray-500">{'{'}</span>
          {keys.map((key, idx) => (
            <div key={key} className="ml-4">
              <span className="text-purple-600">&quot;{key}&quot;</span>
              <span className="text-gray-500">: </span>
              {renderFormattedData(data[key], level + 1)}
              {idx < keys.length - 1 && <span className="text-gray-500">,</span>}
            </div>
          ))}
          <span className="text-gray-500">{'}'}</span>
        </div>
      );
    }

    return <span>{String(data)}</span>;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                {result.scraperName}
                {result.status === 'success' && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Sucesso
                  </Badge>
                )}
                {result.status === 'error' && (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Erro
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="mt-2">
                <div className="flex items-center gap-4 text-sm">
                  <span>Query: <strong>{result.query}</strong></span>
                  {result.executionTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {result.executionTime}ms
                    </span>
                  )}
                  <span>{result.timestamp.toLocaleString()}</span>
                </div>
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar modal">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {/* Error Display */}
          {result.status === 'error' && result.error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <h3 className="font-semibold text-red-800 mb-2">Erro:</h3>
              <p className="text-sm text-red-700 font-mono">{result.error}</p>
            </div>
          )}

          {/* Success Display */}
          {result.status === 'success' && result.data && (
            <div className="space-y-4">
              {/* Copy Button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar JSON
                    </>
                  )}
                </Button>
              </div>

              {/* Tabs for different views */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="formatted">Formatado</TabsTrigger>
                  <TabsTrigger value="raw">JSON Raw</TabsTrigger>
                </TabsList>

                <TabsContent value="formatted" className="mt-4">
                  <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                    <div className="font-mono text-sm">
                      {renderFormattedData(result.data)}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="raw" className="mt-4">
                  <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                    <pre className="font-mono text-sm whitespace-pre-wrap">
                      {formatJSON(result.data)}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              {/* Data Summary */}
              <div className="p-4 rounded-lg bg-gray-50 border">
                <h3 className="font-semibold mb-2">Resumo dos Dados</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>{' '}
                    <strong>{Array.isArray(result.data) ? 'Array' : typeof result.data}</strong>
                  </div>
                  {Array.isArray(result.data) && (
                    <div>
                      <span className="text-muted-foreground">Itens:</span>{' '}
                      <strong>{result.data.length}</strong>
                    </div>
                  )}
                  {typeof result.data === 'object' && !Array.isArray(result.data) && (
                    <div>
                      <span className="text-muted-foreground">Propriedades:</span>{' '}
                      <strong>{Object.keys(result.data).length}</strong>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Tamanho:</span>{' '}
                    <strong>{formatJSON(result.data).length} bytes</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Running Display */}
          {result.status === 'running' && (
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                <span className="text-blue-800">Executando teste...</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
