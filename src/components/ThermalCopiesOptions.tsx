import React from 'react';
import { Copy } from 'lucide-react';

interface ThermalCopiesOptionsProps {
  copies: number;
  hideSingleCopy: boolean;
  onChangeCopies: (copies: number) => void;
  onChangeHideSingleCopy: (hide: boolean) => void;
}

export const ThermalCopiesOptions: React.FC<ThermalCopiesOptionsProps> = ({
  copies,
  hideSingleCopy,
  onChangeCopies,
  onChangeHideSingleCopy,
}) => {
  return (
    <div className="p-3 bg-surface-card border border-black/[0.06] rounded-[10px] space-y-3 shadow-xs select-none">
      {/* Header com Ícone e Badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground-primary flex items-center gap-1.5">
          <Copy className="w-3.5 h-3.5 text-[#3a86ff]" strokeWidth={1.8} />
          <span>Cópias e Numeração de Volume</span>
        </span>
        <span className="text-[10px] font-mono text-foreground-secondary bg-black/[0.04] px-2 py-0.5 rounded-[5px] border border-black/[0.04]">
          {copies} {copies === 1 ? 'cópia' : 'cópias'}
        </span>
      </div>

      <div className="space-y-2.5">
        {/* Stepper Integrado no padrão Apple macOS */}
        <div>
          <label className="text-[11px] text-foreground-secondary block mb-1.5 font-medium">
            Quantidade de Cópias (Páginas):
          </label>
          <div className="flex items-center h-8 bg-black/[0.035] hover:bg-black/[0.05] focus-within:bg-white border border-black/[0.08] focus-within:border-[#3a86ff] focus-within:ring-2 focus-within:ring-[#3a86ff]/15 rounded-[7px] overflow-hidden transition-colors duration-snappy">
            <button
              type="button"
              onClick={() => onChangeCopies(Math.max(1, copies - 1))}
              disabled={copies <= 1}
              className="h-full w-8 flex items-center justify-center text-foreground-secondary hover:text-foreground-primary hover:bg-black/[0.05] active:scale-[0.96] disabled:opacity-30 disabled:pointer-events-none transition-colors transition-transform duration-instant select-none font-semibold text-sm border-r border-black/[0.06]"
              title="Diminuir cópias"
              aria-label="Diminuir quantidade de cópias"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={999}
              value={copies}
              onChange={(e) => onChangeCopies(Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
              className="flex-1 h-full text-center font-mono text-xs font-semibold bg-transparent text-foreground-primary outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => onChangeCopies(Math.min(999, copies + 1))}
              className="h-full w-8 flex items-center justify-center text-foreground-secondary hover:text-foreground-primary hover:bg-black/[0.05] active:scale-[0.96] transition-colors transition-transform duration-instant select-none font-semibold text-sm border-l border-black/[0.06]"
              title="Aumentar cópias"
              aria-label="Aumentar quantidade de cópias"
            >
              +
            </button>
          </div>
        </div>

        {/* Segmented Control de Atalhos Rápidos */}
        <div className="grid grid-cols-6 p-0.5 bg-black/[0.04] rounded-[7px] border border-black/[0.04] gap-0.5">
          {[1, 2, 3, 5, 10, 20].map((qty) => {
            const isSelected = copies === qty;
            return (
              <button
                key={qty}
                type="button"
                onClick={() => onChangeCopies(qty)}
                className={`h-6 text-[10.5px] font-mono rounded-[5px] flex items-center justify-center transition-colors transition-transform duration-instant active:scale-[0.97] ${
                  isSelected
                    ? 'bg-white text-foreground-primary font-semibold shadow-xs'
                    : 'text-foreground-secondary hover:text-foreground-primary hover:bg-black/[0.03]'
                }`}
              >
                {qty}
              </button>
            );
          })}
        </div>

        {/* Checkbox de Ocultação em Cópia Única */}
        <label className="flex items-center gap-2 pt-0.5 text-xs text-foreground-secondary hover:text-foreground-primary cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={hideSingleCopy}
            onChange={(e) => onChangeHideSingleCopy(e.target.checked)}
            className="w-3.5 h-3.5 rounded-[4px] border border-black/[0.15] text-[#111111] focus:ring-1 focus:ring-[#111111] focus:ring-offset-0 cursor-pointer accent-[#111111]"
          />
          <span className="text-[11px] leading-tight select-none">
            Ocultar identificador de volume se for apenas 1 cópia
          </span>
        </label>
      </div>
    </div>
  );
};
