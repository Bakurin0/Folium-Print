import React, { useState } from 'react';
import { CalibrationOffset } from '../types/template';
import { Sliders, ChevronDown, ChevronUp, RotateCcw, HelpCircle } from 'lucide-react';

interface CalibrationPanelProps {
  offset: CalibrationOffset;
  onChangeOffset: (newOffset: CalibrationOffset) => void;
  templateName: string;
}

export const CalibrationPanel: React.FC<CalibrationPanelProps> = ({
  offset,
  onChangeOffset,
  templateName,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeOffset({ offsetX: 0, offsetY: 0 });
  };

  const hasOffset = offset.offsetX !== 0 || offset.offsetY !== 0;

  return (
    <div className="border border-border rounded-[6px] bg-surface-card overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-surface-subtle transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-foreground-muted" strokeWidth={1.8} />
          <span className="text-xs font-semibold text-foreground-primary">
            Calibração Mecânica (Offset mm)
          </span>
          {hasOffset && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-pastel-gold-bg text-pastel-gold-text border border-pastel-gold-border font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-gold" />
              <span>X:{offset.offsetX > 0 ? `+${offset.offsetX}` : offset.offsetX} Y:{offset.offsetY > 0 ? `+${offset.offsetY}` : offset.offsetY} mm</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-foreground-muted">
          {hasOffset && (
            <span
              onClick={handleReset}
              className="text-[10px] hover:text-foreground-primary p-1 rounded-[4px] hover:bg-surface-card"
              title="Resetar calibração para 0,0 mm"
            >
              <RotateCcw className="w-3 h-3" strokeWidth={1.8} />
            </span>
          )}
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.8} /> : <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.8} />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3 border-t border-border bg-surface-subtle/50 space-y-3">
          <p className="text-[11px] text-foreground-muted flex items-start gap-1 leading-normal">
            <HelpCircle className="w-3.5 h-3.5 text-foreground-muted shrink-0 mt-0.5" strokeWidth={1.8} />
            <span>
              Compensa tração mecânica do rolete da impressora para <strong>{templateName}</strong>. Salvo localmente.
            </span>
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Offset X */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <label className="text-foreground-secondary font-medium">Offset X:</label>
                <span className="font-mono font-medium text-foreground-primary">
                  {offset.offsetX > 0 ? `+${offset.offsetX}` : offset.offsetX} mm
                </span>
              </div>
              <input
                type="range"
                min={-15}
                max={15}
                step={0.5}
                value={offset.offsetX}
                onChange={(e) =>
                  onChangeOffset({ ...offset, offsetX: parseFloat(e.target.value) })
                }
                className="w-full accent-[#111111] h-1 bg-border rounded cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-foreground-muted font-mono">
                <span>-15 mm</span>
                <span>+15 mm</span>
              </div>
            </div>

            {/* Offset Y */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <label className="text-foreground-secondary font-medium">Offset Y:</label>
                <span className="font-mono font-medium text-foreground-primary">
                  {offset.offsetY > 0 ? `+${offset.offsetY}` : offset.offsetY} mm
                </span>
              </div>
              <input
                type="range"
                min={-15}
                max={15}
                step={0.5}
                value={offset.offsetY}
                onChange={(e) =>
                  onChangeOffset({ ...offset, offsetY: parseFloat(e.target.value) })
                }
                className="w-full accent-[#111111] h-1 bg-border rounded cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-foreground-muted font-mono">
                <span>-15 mm</span>
                <span>+15 mm</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
