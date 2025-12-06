'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: unknown[];
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary - Captura erros em componentes React
 *
 * FASE 76.3: Frontend Error Boundaries
 *
 * Funcionalidades:
 * - Captura erros de renderização, lifecycle e event handlers
 * - Integração com frontend logger
 * - UI de fallback amigável
 * - Opção de retry/reset
 * - Suporte a resetKeys para auto-reset quando props mudam
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log do erro com nosso logger centralizado
    logger.error('React Error Boundary caught error', {
      component: 'ErrorBoundary',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({ errorInfo });

    // Callback opcional para handlers externos
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props): void {
    // Reset automático quando resetKeys mudam
    if (this.state.hasError && this.props.resetKeys) {
      const hasChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      if (hasChanged) {
        this.reset();
      }
    }
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Algo deu errado</CardTitle>
              <CardDescription>
                Ocorreu um erro inesperado nesta seção. Nossa equipe foi notificada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p className="font-mono text-destructive">
                    {this.state.error.message}
                  </p>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="mt-2 max-h-32 overflow-auto text-xs text-muted-foreground">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center gap-2">
              <Button variant="outline" onClick={this.reset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
              <Button variant="default" onClick={() => window.location.href = '/'}>
                <Home className="mr-2 h-4 w-4" />
                Ir para início
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * withErrorBoundary - HOC para envolver componentes com ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

/**
 * QueryErrorBoundary - Especializado para erros de React Query
 */
export function QueryErrorBoundary({
  children,
  queryKey,
}: {
  children: ReactNode;
  queryKey?: unknown[];
}): React.ReactElement {
  return (
    <ErrorBoundary
      resetKeys={queryKey}
      onError={(error) => {
        logger.queryError(queryKey, error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * ChartErrorBoundary - Especializado para erros em gráficos
 */
export function ChartErrorBoundary({
  children,
  chartType,
}: {
  children: ReactNode;
  chartType?: string;
}): React.ReactElement {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center h-[300px] bg-muted/50 rounded-lg">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Erro ao renderizar {chartType || 'gráfico'}</p>
          </div>
        </div>
      }
      onError={(error) => {
        logger.error('Chart rendering error', {
          component: 'ChartErrorBoundary',
          chartType,
          error: error.message,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
