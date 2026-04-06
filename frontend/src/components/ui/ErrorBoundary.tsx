// @ts-nocheck
import * as React from 'react';
import { ErrorState } from './ErrorState';

interface Props {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }


  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-4 w-full h-full min-h-[400px] flex items-center justify-center">
          <ErrorState 
            message={this.state.error?.message || "Error inesperado en la aplicación"} 
            onRetry={() => this.setState({ hasError: false, error: null })} 
          />
        </div>
      );
    }

    return this.props.children;
  }
}
