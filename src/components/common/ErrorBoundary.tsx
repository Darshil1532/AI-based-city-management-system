import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

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
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught application error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="max-w-xl mx-auto my-12 p-8 clay-card rounded-3xl text-center space-y-5 animate-in fade-in">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">
              Something went wrong loading this view
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              An unexpected render error occurred. Your complaints and civic records remain safely cached.
            </p>
          </div>

          {this.state.error?.message && (
            <div className="text-left text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono text-slate-700 overflow-x-auto">
              <code>{this.state.error.message}</code>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl clay-btn clay-btn-primary text-xs font-bold"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Page</span>
            </button>
            <a
              href="/citizen/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl clay-btn clay-btn-secondary text-xs font-bold text-slate-700"
            >
              <Home className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
