import React from 'react';
import { PaperType } from '../types/template';
import { FileText, Layers, Info, Check } from 'lucide-react';

export interface PaperSelection {
  paperType: PaperType;
  weightGsm: number;
}

interface PaperMediaPanelProps {
  selection: PaperSelection;
  onChangeSelection: (selection: PaperSelection) => void;
  documentDimensions: { widthMm: number; heightMm: number };
}

const PAPER_TYPES: { id: PaperType; name: string; desc: string }[] = [
  { id: 'offset', name: 'Offset / Sulfite', desc: 'Textura porosa e fosca, excelente absorção de tinta' },
  { id: 'couche-fosco', name: 'Couché Fosco', desc: 'Revestimento acetinado antirreflexo, toque sedoso' },
  { id: 'couche-brilho', name: 'Couché Brilho', desc: 'Superfície espelhada, máxima vivacidade de cor' },
  { id: 'kraft', name: 'Kraft Rústico', desc: 'Pardo ecológico resistente com apelo artesanal' },
  { id: 'adesivo-couche', name: 'Adesivo Couché', desc: 'Base autocolante de alta fixação para rótulos' },
  { id: 'adesivo-vinil', name: 'Adesivo Vinil', desc: 'Plástico impermeável resistente a umidade' },
  { id: 'termico', name: 'Térmico Direto', desc: 'Sensível ao calor mecânico, sem necessidade de ribbon/tinta' },
];

const WEIGHT_OPTIONS = [75, 90, 120, 150, 180, 240, 300];

export const PaperMediaPanel: React.FC<PaperMediaPanelProps> = ({
  selection,
  onChangeSelection,
  documentDimensions,
}) => {
  const handleTypeChange = (paperType: PaperType) => {
    onChangeSelection({
      ...selection,
      paperType,
    });
  };

  const handleWeightChange = (weightGsm: number) => {
    onChangeSelection({
      ...selection,
      weightGsm,
    });
  };

  const getOperationalHint = (): string => {
    if (selection.weightGsm >= 240) {
      return '⚠️ Papel pesado (240g+): configure a bandeja manual (Bypass) da impressora e selecione a mídia "Cartão / Espesso 3" no driver para fusão perfeita do toner.';
    }
    if (selection.paperType === 'adesivo-couche' || selection.paperType === 'adesivo-vinil') {
      return '💡 Adesivo autocolante: verifique a pressão da guilhotina e limpe a lâmina periodicamente para evitar acúmulo de cola.';
    }
    if (selection.paperType === 'couche-brilho') {
      return '💡 Couché Brilho: requer tempo de secagem estendido em jato de tinta; excelente em impressoras laser/offset digital.';
    }
    if (selection.paperType === 'termico') {
      return '💡 Papel Térmico: evite exposição direta à luz solar ou fontes de calor para preservar a legibilidade.';
    }
    return '✅ Gramatura padrão: compatível com tração automática de gaveta principal da impressora.';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <FileText className="w-4 h-4 text-pastel-violet-text" strokeWidth={2} />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-primary">
          Papel, Mídia & Substrato
        </h3>
      </div>

      {/* Current Document Dimensions Preview */}
      <div className="p-2.5 bg-surface-subtle border border-border rounded-[6px] flex items-center justify-between text-xs">
        <div>
          <span className="text-foreground-muted block text-[10px]">Tamanho do Gabarito Atual</span>
          <span className="font-semibold text-foreground-primary">
            {documentDimensions.widthMm} × {documentDimensions.heightMm} mm
          </span>
        </div>
        <div className="px-2 py-0.5 bg-surface-card border border-border rounded text-[11px] font-mono text-foreground-secondary">
          {documentDimensions.widthMm === 210 && documentDimensions.heightMm === 297
            ? 'Padrão A4'
            : documentDimensions.widthMm === 297 && documentDimensions.heightMm === 420
            ? 'Padrão A3'
            : documentDimensions.widthMm === 320 && documentDimensions.heightMm === 450
            ? 'Gráfico SRA3'
            : 'Personalizado'}
        </div>
      </div>

      {/* Paper Type Selector */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-foreground-secondary block">
          Tipo de Substrato / Papel
        </label>
        <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-1">
          {PAPER_TYPES.map((type) => {
            const isSelected = selection.paperType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => handleTypeChange(type.id)}
                className={`w-full text-left p-2 rounded-[6px] border text-xs transition-colors flex items-start justify-between ${
                  isSelected
                    ? 'bg-pastel-violet-bg/40 border-pastel-violet-border text-foreground-primary'
                    : 'bg-surface-card border-border/80 text-foreground-secondary hover:border-border hover:bg-surface-subtle'
                }`}
              >
                <div>
                  <div className="font-medium text-foreground-primary flex items-center gap-1.5">
                    <span>{type.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-pastel-violet-text" />}
                  </div>
                  <div className="text-[10px] text-foreground-muted leading-tight mt-0.5">
                    {type.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gramatura (Weight) Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label className="font-medium text-foreground-secondary flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-foreground-muted" />
            <span>Gramatura / Espessura</span>
          </label>
          <span className="font-mono text-xs font-semibold text-foreground-primary">
            {selection.weightGsm} g/m²
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {WEIGHT_OPTIONS.map((weight) => (
            <button
              key={weight}
              type="button"
              onClick={() => handleWeightChange(weight)}
              className={`py-1.5 text-xs font-medium rounded-[4px] border transition-colors ${
                selection.weightGsm === weight
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-surface-subtle border-border text-foreground-secondary hover:text-foreground-primary hover:bg-surface-card'
              }`}
            >
              {weight}g
            </button>
          ))}
        </div>
      </div>

      {/* Print Shop Hint Box */}
      <div className="p-2.5 bg-surface-subtle border border-border rounded-[6px] flex items-start gap-2 text-[11px] text-foreground-secondary">
        <Info className="w-4 h-4 text-pastel-violet-text shrink-0 mt-0.5" />
        <div className="leading-snug">{getOperationalHint()}</div>
      </div>
    </div>
  );
};
