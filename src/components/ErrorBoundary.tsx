import { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen pt-20 bg-background flex items-center justify-center">
          <Card className="p-6 max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Oops! Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We encountered an unexpected error. Please try refreshing the page or going back.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => window.location.reload()}
                  variant="default"
                >
                  Refresh Page
                </Button>
                <Button 
                  onClick={() => window.history.back()}
                  variant="outline"
                >
                  Go Back
                </Button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-2 bg-gray-100 rounded text-xs">
                  <summary className="cursor-pointer font-medium">Error Details (Dev)</summary>
                  <pre className="mt-2 text-xs overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
