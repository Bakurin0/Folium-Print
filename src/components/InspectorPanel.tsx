import React, { useState } from 'react';
import { 
  Edit3, 
  FileText, 
  Palette, 
  Crosshair, 
  RotateCcw, 
  Download 
} from 'lucide-react';
import { 
  Template, 
  TemplateFormData, 
  CalibrationOffset, 
  ColorAdjustments, 
  CropMarkSettings 
} from '../types/template';
import { DynamicForm } from './DynamicForm';
import { SheetGridOptions } from './SheetGridOptions';
import { PaperMediaPanel, PaperSelection } from './PaperMediaPanel';
import { ColorSettingsPanel } from './ColorSettingsPanel';
import { CropMarksPanel } from './CropMarksPanel';
import { CalibrationPanel } from './CalibrationPanel';

export type InspectorTab = 'data' | 'media' | 'colors' | 'calibration';

interface InspectorPanelProps {
  currentTemplate: Template | null;
  isOpen: boolean;
  formData: TemplateFormData;
  offset: CalibrationOffset;
  colorAdjustments: ColorAdjustments;
  cropMarks: CropMarkSettings;
  paperSelection: PaperSelection;
  firstInputRef?: React.RefObject<HTMLInputElement>;
  onChangeField: (key: string, value: any) => void;
  onChangeCopies: (copies: number) => void;
  onChangeStartPosition: (startPosition: number) => void;
  onChangeOffset: (offset: CalibrationOffset) => void;
  onChangeColorAdjustments: (adjustments: ColorAdjustments) => void;
  onChangeCropMarks: (settings: CropMarkSettings) => void;
  onChangePaperSelection: (selection: PaperSelection) => void;
  onResetForm: () => void;
  onExportPdf: () => void;
}

/**
 * Inspector Panel no padrão Apple macOS Pages/Keynote.
 * Agrupa seções contextuais através de um Segmented Control com pílula de vidro translúcida.
 */
export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  currentTemplate,
  isOpen,
  formData,
  offset,
  colorAdjustments,
  cropMarks,
  paperSelection,
  firstInputRef,
  onChangeField,
  onChangeCopies,
  onChangeStartPosition,
  onChangeOffset,
  onChangeColorAdjustments,
  onChangeCropMarks,
  onChangePaperSelection,
  onResetForm,
  onExportPdf,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>('data');

  if (!isOpen) return null;

  const hasColorOrCropActive =
    colorAdjustments.mode === 'cmyk-simulated' ||
    cropMarks.enabled ||
    colorAdjustments.brightness !== 0 ||
    colorAdjustments.contrast !== 0 ||
    colorAdjustments.saturation !== 0;

  const hasCalibrationActive = offset.offsetX !== 0 || offset.offsetY !== 0;

  return (
    <aside
      aria-label="Inspetor de Configurações"
      className="w-80 xl:w-96 h-full border-l border-border/80 bg-surface-card flex flex-col shrink-0 z-20 transition-all duration-snappy ease-out select-none"
    >
      {/* 1. Header com Segmented Control Apple HIG */}
      <div className="p-3 border-b border-border/70">
        <div
          role="tablist"
          aria-label="Abas do Inspetor"
          className="grid grid-cols-4 gap-1 p-1 bg-surface-subtle/90 border border-border/80 rounded-[8px]"
        >
          {/* Aba: Conteúdo / Dados */}
          <button
            type="button"
            id="tab-data"
            role="tab"
            aria-selected={activeTab === 'data'}
            aria-controls="panel-data"
            onClick={() => setActiveTab('data')}
            className={`btn-tactile py-1.5 px-1 rounded-[5px] text-[11px] font-medium flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'data'
                ? 'bg-surface-card text-foreground-primary shadow-xs border border-border/80'
                : 'text-foreground-secondary hover:text-foreground-primary'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-[#3a86ff]" />
            <span>Dados</span>
          </button>

          {/* Aba: Mídia / Papel */}
          <button
            type="button"
            id="tab-media"
            role="tab"
            aria-selected={activeTab === 'media'}
            aria-controls="panel-media"
            onClick={() => setActiveTab('media')}
            className={`btn-tactile py-1.5 px-1 rounded-[5px] text-[11px] font-medium flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'media'
                ? 'bg-surface-card text-foreground-primary shadow-xs border border-border/80'
                : 'text-foreground-secondary hover:text-foreground-primary'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#8338ec]" />
            <span>Mídia</span>
          </button>

          {/* Aba: Cores / Corte */}
          <button
            type="button"
            id="tab-colors"
            role="tab"
            aria-selected={activeTab === 'colors'}
            aria-controls="panel-colors"
            onClick={() => setActiveTab('colors')}
            className={`btn-tactile relative py-1.5 px-1 rounded-[5px] text-[11px] font-medium flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'colors'
                ? 'bg-surface-card text-foreground-primary shadow-xs border border-border/80'
                : 'text-foreground-secondary hover:text-foreground-primary'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-[#ff006e]" />
            <span>Cores/Corte</span>
            {hasColorOrCropActive && (
              <span
                className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#ff006e]"
                title="Ajustes de cor ou corte ativos"
              />
            )}
          </button>

          {/* Aba: Calibração */}
          <button
            type="button"
            id="tab-calibration"
            role="tab"
            aria-selected={activeTab === 'calibration'}
            aria-controls="panel-calibration"
            onClick={() => setActiveTab('calibration')}
            className={`btn-tactile relative py-1.5 px-1 rounded-[5px] text-[11px] font-medium flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'calibration'
                ? 'bg-surface-card text-foreground-primary shadow-xs border border-border/80'
                : 'text-foreground-secondary hover:text-foreground-primary'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 text-[#ffbe0b]" />
            <span>Calibração</span>
            {hasCalibrationActive && (
              <span
                className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#ffbe0b]"
                title="Deslocamento milimétrico ativo"
              />
            )}
          </button>
        </div>
      </div>

      {/* 2. Conteúdo da Seção Ativa */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentTemplate ? (
          <>
            {activeTab === 'data' && (
              <div id="panel-data" role="tabpanel" aria-labelledby="tab-data" className="space-y-4">
                <DynamicForm
                  fields={currentTemplate.fields}
                  formData={formData}
                  onChangeField={onChangeField}
                  firstInputRef={firstInputRef}
                />

                {currentTemplate.grid && (
                  <SheetGridOptions
                    grid={currentTemplate.grid}
                    copies={Number(formData._gridCopies ?? currentTemplate.grid.rows * currentTemplate.grid.cols)}
                    startPosition={Number(formData._gridStartPosition ?? 0)}
                    onChangeCopies={onChangeCopies}
                    onChangeStartPosition={onChangeStartPosition}
                  />
                )}
              </div>
            )}

            {activeTab === 'media' && (
              <div id="panel-media" role="tabpanel" aria-labelledby="tab-media" className="space-y-4">
                <PaperMediaPanel
                  selection={paperSelection}
                  onChangeSelection={onChangePaperSelection}
                  documentDimensions={currentTemplate.dimensions}
                />
              </div>
            )}

            {activeTab === 'colors' && (
              <div id="panel-colors" role="tabpanel" aria-labelledby="tab-colors" className="space-y-4">
                <ColorSettingsPanel
                  adjustments={colorAdjustments}
                  onChangeAdjustments={onChangeColorAdjustments}
                />
                <hr className="border-border/70" />
                <CropMarksPanel
                  settings={cropMarks}
                  onChangeSettings={onChangeCropMarks}
                  hasGrid={!!currentTemplate.grid}
                />
              </div>
            )}

            {activeTab === 'calibration' && (
              <div id="panel-calibration" role="tabpanel" aria-labelledby="tab-calibration" className="space-y-4">
                <CalibrationPanel
                  offset={offset}
                  onChangeOffset={onChangeOffset}
                  templateName={currentTemplate.name}
                />
              </div>
            )}
          </>
        ) : (
          <div className="p-4 text-center text-xs text-foreground-muted">
            Selecione um modelo para editar seus dados e ajustes.
          </div>
        )}
      </div>

      {/* 3. Rodapé com Ações Rápidas (Exportar PDF e Reset) */}
      {currentTemplate && (
        <div className="p-3 border-t border-border/70 bg-surface-subtle/50 flex items-center gap-2">
          <button
            type="button"
            onClick={onExportPdf}
            className="btn-tactile flex-1 py-1.5 px-2.5 border border-border/80 bg-surface-card hover:bg-surface-subtle text-foreground-primary rounded-[6px] text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs"
            title="Exportar documento como PDF"
          >
            <Download className="w-3.5 h-3.5 text-foreground-muted" />
            <span>Salvar PDF</span>
          </button>

          <button
            type="button"
            onClick={onResetForm}
            className="btn-tactile py-1.5 px-2.5 border border-border/80 bg-surface-card hover:bg-surface-subtle text-foreground-secondary hover:text-foreground-primary rounded-[6px] text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs"
            title="Restaurar dados padrão do modelo"
          >
            <RotateCcw className="w-3.5 h-3.5 text-foreground-muted" />
            <span>Resetar</span>
          </button>
        </div>
      )}
    </aside>
  );
};
