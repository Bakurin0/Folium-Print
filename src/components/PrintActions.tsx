import React from 'react';
import { Printer, Download, RotateCcw } from 'lucide-react';

interface PrintActionsProps {
  onPrint: () => void;
  onReset: () => void;
  isPrinting?: boolean;
  disabled?: boolean;
}

export const PrintActions: React.FC<PrintActionsProps> = ({
  onPrint,
  onReset,
  isPrinting = false,
  disabled = false,
}) => {
  return (
    <div className="space-y-2 pt-2 border-t border-border">
      {/* Botão de Destaque Primário: Sólido Charcoal #111111 (Protocol Minimalist UI) */}
      <button
        type="button"
        onClick={onPrint}
        disabled={isPrinting || disabled}
        className="btn-tactile w-full bg-[#111111] hover:bg-[#27272a] text-white font-medium py-2.5 px-4 rounded-[6px] border border-[#111111] flex items-center justify-between text-xs disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-azure-blue group-hover:scale-125 transition-transform duration-snappy ease-emil-out" />
          <Printer className="w-3.5 h-3.5 text-white/90" strokeWidth={1.8} />
          <span>{isPrinting ? 'Enviando ao spooler...' : 'Disparar Impressão'}</span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[10px] bg-white/10 px-1.5 py-0.5 rounded-[4px] text-white/80 border border-white/10">
          <span>Ctrl</span>+<span>P</span>
        </div>
      </button>

      {/* Ações Secundárias Utilitárias com Feedback Tátil */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onPrint}
          disabled={disabled || isPrinting}
          className="btn-tactile w-full py-1.5 px-3 border border-border bg-surface-card hover:bg-surface-subtle text-foreground-primary rounded-[6px] text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
          title="Abrir diálogo de impressão e escolher Salvar como PDF"
        >
          <Download className="w-3.5 h-3.5 text-foreground-muted" strokeWidth={1.8} />
          <span>Salvar PDF</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          className="btn-tactile w-full py-1.5 px-3 border border-border bg-surface-card hover:bg-surface-subtle text-foreground-secondary hover:text-foreground-primary rounded-[6px] text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
          title="Resetar dados para os valores padrão do modelo"
        >
          <RotateCcw className="w-3.5 h-3.5 text-foreground-muted" strokeWidth={1.8} />
          <span>Resetar</span>
          <kbd className="text-[10px] font-mono text-foreground-muted border border-border bg-surface-subtle px-1 rounded-[4px]">
            Esc
          </kbd>
        </button>
      </div>
    </div>
  );
};
