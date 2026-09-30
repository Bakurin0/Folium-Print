import React, { useState } from 'react';
import { CalibrationOffset } from '../types/template';
import { Sliders, ChevronDown, RotateCcw, HelpCircle, Printer, X } from 'lucide-react';

export const COMMON_PRINTER_MODELS = [
  'Zebra ZD220',
  'Elgin L42 Pro',
  'Argox OS-214 Plus',
  'Bematech MP-4200',
  'Epson TM-T20',
];

interface CalibrationPanelProps {
  offset: CalibrationOffset;
  onChangeOffset: (newOffset: CalibrationOffset) => void;
  templateName: string;
  printerName?: string;
  onChangePrinterName?: (name: string) => void;
}

export const CalibrationPanel: React.FC<CalibrationPanelProps> = ({
  offset,
  onChangeOffset,
  templateName,
  printerName = '',
  onChangePrinterName,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeOffset({ offsetX: 0, offsetY: 0 });
  };

  const hasOffset = offset.offsetX !== 0 || offset.offsetY !== 0;

  return (
    <div className="border border-border rounded-[6px] bg-surface-card overflow-hidden">
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
              className="btn-tactile text-[10px] hover:text-foreground-primary p-1 rounded-[4px] hover:bg-surface-card"
              title="Resetar calibração para 0,0 mm"
            >
              <RotateCcw className="w-3 h-3" strokeWidth={1.8} />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-snappy ease-emil-out ${
              isOpen ? 'rotate-180' : 'rotate-0'
            }`}
            strokeWidth={1.8}
          />
        </div>
      </button>

      {/* Accordion suave usando CSS Grid com overflow-hidden */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-normal ease-emil-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden">
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

            {/* Configuração do Nome da Impressora do Usuário */}
            <div className="pt-3 border-t border-border/70 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-foreground-primary flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-[#3a86ff]" />
                  <span>Dispositivo & Impressora</span>
                </label>
                {printerName && (
                  <button
                    type="button"
                    onClick={() => onChangePrinterName?.('')}
                    className="btn-tactile text-[10px] text-foreground-muted hover:text-foreground-primary flex items-center gap-0.5"
                    title="Restaurar nome padrão"
                  >
                    <X className="w-3 h-3" />
                    <span>Limpar</span>
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={printerName}
                  onChange={(e) => onChangePrinterName?.(e.target.value)}
                  placeholder="ex: Zebra ZD220, Elgin L42 Pro..."
                  className="w-full text-xs font-medium px-2.5 py-1.5 bg-white border border-border/80 focus:border-[#3a86ff] focus:ring-2 focus:ring-[#3a86ff]/15 rounded-[6px] text-foreground-primary placeholder:text-foreground-muted outline-none transition-colors"
                />
              </div>

              {/* Chips rápidos de modelos industriais e comerciais populares */}
              <div className="space-y-1">
                <span className="text-[10px] text-foreground-muted block">Sugestões de marcas:</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {COMMON_PRINTER_MODELS.map((model) => {
                    const isSelected = printerName.toLowerCase() === model.toLowerCase();
                    return (
                      <button
                        key={model}
                        type="button"
                        onClick={() => onChangePrinterName?.(model)}
                        className={`btn-tactile text-[10px] px-2 py-0.5 rounded-[4px] border font-medium ${
                          isSelected
                            ? 'bg-[#3a86ff]/10 text-[#3a86ff] border-[#3a86ff]/30 font-semibold shadow-xs'
                            : 'bg-white hover:bg-surface-subtle text-foreground-secondary border-border/80'
                        }`}
                      >
                        {model}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-[10px] text-foreground-muted leading-tight">
                Este nome é gravado no chassi frontal durante a animação industrial de impressão.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
