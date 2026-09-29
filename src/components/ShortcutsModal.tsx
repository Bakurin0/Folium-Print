import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Ctrl', 'P'], label: 'Disparar impressão imediata calibrada' },
    { keys: ['Ctrl', 'Enter'], label: 'Confirmar formulário e imprimir' },
    { keys: ['Ctrl', 'T'], label: 'Alternar para o próximo modelo de impressão' },
    { keys: ['Esc'], label: 'Resetar dados para os valores padrão do modelo' },
    { keys: ['Tab'], label: 'Navegar para o próximo campo do formulário' },
    { keys: ['Shift', 'Tab'], label: 'Navegar para o campo anterior' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-surface-card border border-border rounded-[8px] shadow-subtle max-w-md w-full overflow-hidden">
        {/* Window Chrome Minimalist Header */}
        <div className="p-3.5 border-b border-border flex items-center justify-between bg-surface-subtle/50">
          <div className="flex items-center gap-2 text-foreground-primary">
            <Keyboard className="w-4 h-4 text-foreground-muted" strokeWidth={1.8} />
            <h3 className="font-semibold text-xs tracking-tight">Atalhos Operacionais de Teclado</h3>
          </div>
          <button
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground-primary p-1 rounded-[4px] hover:bg-surface-subtle"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.8} />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs py-1.5 border-b border-border/60 last:border-0"
            >
              <span className="text-foreground-secondary">{sc.label}</span>
              <div className="flex items-center gap-1 font-mono">
                {sc.keys.map((k, kIdx) => (
                  <React.Fragment key={k}>
                    {kIdx > 0 && <span className="text-foreground-muted text-[10px]">+</span>}
                    <kbd className="px-1.5 py-0.5 rounded-[4px] bg-surface-subtle border border-border text-[10px] font-mono font-medium text-foreground-primary">
                      {k}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-surface-subtle border-t border-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[#111111] hover:bg-[#27272a] text-white text-xs font-medium rounded-[6px] transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
