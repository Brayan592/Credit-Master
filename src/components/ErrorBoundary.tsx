import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in CrediMaster:', error, errorInfo);
  }

  private handleReset = () => {
    window.location.reload();
  };

  private handleClearStorageAndReset = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f6f8fb] text-slate-800 flex items-center justify-center p-4">
          <div className="max-w-md w-full liquid-glass rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(15,23,42,0.12)] border border-rose-300">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4 shadow-sm">
              <AlertOctagon className="w-6 h-6" />
            </div>

            <h1 className="text-xl font-bold text-slate-900 mb-2">
              Se produjo un error inesperado
            </h1>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Ocurrió un problema al inicializar la aplicación. Puedes intentar recargar la página o restablecer los datos guardados en tu navegador.
            </p>

            {this.state.error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs font-mono text-rose-800 mb-6 overflow-x-auto max-h-32">
                {this.state.error.message || 'Error desconocido'}
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                onClick={this.handleReset}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 text-white rounded-xl font-semibold text-sm transition-all shadow-[0_4px_16px_rgba(16,185,129,0.3)]"
              >
                <RefreshCw className="w-4 h-4" />
                Recargar página
              </button>
              <button
                onClick={this.handleClearStorageAndReset}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Limpiar datos locales y reiniciar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
