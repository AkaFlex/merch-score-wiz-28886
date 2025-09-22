import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center p-6">
          <Card className="max-w-md w-full shadow-elegant border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Ops! Algo deu errado</CardTitle>
              <CardDescription>
                Ocorreu um erro inesperado na aplicação. Você pode tentar recarregar a página ou voltar ao início.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground font-mono">
                  {this.state.error.message}
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={this.handleReset}
                  className="flex-1"
                >
                  Tentar Novamente
                </Button>
                <Button 
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recarregar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}