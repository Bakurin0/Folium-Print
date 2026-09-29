import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary robusto conforme as melhores práticas do Lighthouse e React.
 * Captura exceções na árvore de renderização e exibe interface de recuperação elegante.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Folium Print] Erro não capturado na renderização:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    try {
      localStorage.removeItem('folium-custom-templates');
      localStorage.removeItem('folium-color-settings');
      localStorage.removeItem('folium-crop-marks');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen w-screen bg-surface-app text-foreground-primary p-6">
          <div className="max-w-md w-full bg-surface-card border border-border rounded-[8px] p-6 shadow-subtle space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-pastel-pink-bg border border-pastel-pink-border text-neon-pink flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" strokeWidth={2} />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground-primary">
                Ocorreu um erro inesperado
              </h2>
              <p className="text-xs text-foreground-muted">
                A aplicação encontrou um problema ao renderizar a interface. Seus dados salvos permanecem protegidos.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-surface-subtle p-2.5 rounded-[4px] border border-border text-left">
                <code className="text-[11px] font-mono text-neon-pink break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn-tactile px-3.5 py-2 bg-[#111111] hover:bg-[#27272a] text-white text-xs font-medium rounded-[6px] inline-flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recarregar Aplicação</span>
              </button>
              <button
                type="button"
                onClick={this.handleResetData}
                className="btn-tactile px-3 py-2 bg-surface-card hover:bg-surface-subtle text-foreground-secondary border border-border text-xs font-medium rounded-[6px]"
                title="Restaura os modelos padrão se houver corrupção local"
              >
                <span>Restaurar Padrões</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
