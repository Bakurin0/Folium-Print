import React from 'react';
import { TemplateGrid } from '../types/template';
import { LayoutGrid, RotateCcw } from 'lucide-react';

interface SheetGridOptionsProps {
  grid: TemplateGrid;
  copies: number;
  startPosition: number;
  onChangeCopies: (copies: number) => void;
  onChangeStartPosition: (start: number) => void;
}

export const SheetGridOptions: React.FC<SheetGridOptionsProps> = ({
  grid,
  copies,
  startPosition,
  onChangeCopies,
  onChangeStartPosition,
}) => {
  const totalSlots = grid.rows * grid.cols;
  const endPosition = Math.min(totalSlots, startPosition + copies);

  return (
    <div className="p-3 bg-surface-card border border-border rounded-[6px] space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground-primary flex items-center gap-1.5">
          <LayoutGrid className="w-3.5 h-3.5 text-foreground-muted" strokeWidth={1.8} />
          <span>Configuração da Folha A4 ({totalSlots} etiquetas)</span>
        </span>
        <button
          type="button"
          onClick={() => {
            onChangeStartPosition(0);
            onChangeCopies(totalSlots);
          }}
          className="text-[10px] text-foreground-muted hover:text-foreground-primary flex items-center gap-1 font-medium transition-colors"
          title="Resetar para folha cheia"
        >
          <RotateCcw className="w-3 h-3" strokeWidth={1.8} />
          <span>Folha Cheia</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="text-[11px] text-foreground-secondary block mb-1">
            Qtd. de Cópias: <strong className="text-foreground-primary font-mono">{copies}</strong>
          </label>
          <input
            type="number"
            min={1}
            max={totalSlots}
            value={copies}
            onChange={(e) => onChangeCopies(Math.max(1, Math.min(totalSlots, Number(e.target.value) || 1)))}
            className="w-full text-xs px-2.5 py-1.5 bg-surface-subtle border border-border rounded-[4px] text-foreground-primary focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
          />
        </div>

        <div>
          <label className="text-[11px] text-foreground-secondary block mb-1">
            Posição Inicial: <strong className="text-foreground-primary font-mono">#{startPosition + 1}</strong>
          </label>
          <input
            type="number"
            min={1}
            max={totalSlots}
            value={startPosition + 1}
            onChange={(e) => {
              const pos = Math.max(0, Math.min(totalSlots - 1, (Number(e.target.value) || 1) - 1));
              onChangeStartPosition(pos);
            }}
            className="w-full text-xs px-2.5 py-1.5 bg-surface-subtle border border-border rounded-[4px] text-foreground-primary focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
          />
        </div>
      </div>

      {/* Mini-map interativo de etiquetas */}
      <div className="pt-1">
        <div className="text-[10px] text-foreground-muted mb-1.5 flex justify-between font-mono">
          <span>Mapa da folha (selecione o início):</span>
          <span>
            {Math.min(copies, totalSlots - startPosition)} de {totalSlots}
          </span>
        </div>
        <div
          className="grid gap-0.5 p-1 bg-surface-subtle rounded-[4px] border border-border"
          style={{
            gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: totalSlots }, (_, i) => {
            const isFilled = i >= startPosition && i < endPosition;
            const isFirst = i === startPosition;

            return (
              <button
                key={i}
                type="button"
                onClick={() => onChangeStartPosition(i)}
                title={`Etiqueta #${i + 1} ${isFilled ? '(Será impressa)' : '(Em branco/usada)'}`}
                className={`h-2.5 rounded-[2px] transition-[background-color,border-color,box-shadow] duration-instant ease text-[7px] flex items-center justify-center font-mono ${
                  isFirst
                    ? 'bg-[#111111] text-white font-bold ring-1 ring-[#111111]'
                    : isFilled
                    ? 'bg-pastel-violet-bg border border-pastel-violet-border hover:bg-pastel-violet-border'
                    : 'bg-surface-card hover:bg-border/60 border border-border/40'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
