import React, { useState } from 'react';
import { 
  Edit3, 
  FileText, 
  Palette, 
  Crosshair, 
  RotateCcw, 
  Download,
  Sliders,
} from 'lucide-react';
import { 
  Template, 
  TemplateFormData, 
  CalibrationOffset, 
  ColorAdjustments, 
  CropMarkSettings,
  FontWeightOption
} from '../types/template';
import { DynamicForm } from './DynamicForm';
import { SheetGridOptions } from './SheetGridOptions';
import { ThermalCopiesOptions } from './ThermalCopiesOptions';
import { PaperMediaPanel, PaperSelection } from './PaperMediaPanel';
import { ColorSettingsPanel } from './ColorSettingsPanel';
import { CropMarksPanel } from './CropMarksPanel';
import { CalibrationPanel } from './CalibrationPanel';

export type InspectorTab = 'data' | 'media' | 'colors' | 'calibration';

interface InspectorPanelProps {
  currentTemplate: Template | null;
  isOpen: boolean;
  activeTab?: InspectorTab;
  onChangeTab?: (tab: InspectorTab) => void;
  formData: TemplateFormData;
  offset: CalibrationOffset;
  colorAdjustments: ColorAdjustments;
  cropMarks: CropMarkSettings;
  paperSelection: PaperSelection;
  firstInputRef?: React.RefObject<HTMLInputElement>;
  onChangeField: (key: string, value: any) => void;
  onChangeFieldWeight?: (key: string, weight: FontWeightOption) => void;
  onChangeCopies: (copies: number) => void;
  onChangeStartPosition: (startPosition: number) => void;
  onChangeOffset: (offset: CalibrationOffset) => void;
  onChangeColorAdjustments: (adjustments: ColorAdjustments) => void;
  onChangeCropMarks: (settings: CropMarkSettings) => void;
  onChangePaperSelection: (selection: PaperSelection) => void;
  onResetForm: () => void;
  onExportPdf: () => void;
  printerName?: string;
  onChangePrinterName?: (name: string) => void;
}

/**
 * Inspector Panel no padrão Apple macOS Pages/Keynote.
 * Agrupa seções contextuais através de um Segmented Control com pílula de vidro translúcida.
 */
export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  currentTemplate,
  isOpen,
  activeTab: controlledTab,
  onChangeTab,
  formData,
  offset,
  colorAdjustments,
  cropMarks,
  paperSelection,
  firstInputRef,
  onChangeField,
  onChangeFieldWeight,
  onChangeCopies,
  onChangeStartPosition,
  onChangeOffset,
  onChangeColorAdjustments,
  onChangeCropMarks,
  onChangePaperSelection,
  onResetForm,
  onExportPdf,
  printerName,
  onChangePrinterName,
}) => {
  const [internalTab, setInternalTab] = useState<InspectorTab>('data');
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: InspectorTab) => {
    setInternalTab(tab);
    if (onChangeTab) onChangeTab(tab);
  };

  return (
    <aside
      aria-label="Inspetor de Configurações"
      aria-hidden={!isOpen}
      className={`h-full border-black/[0.06] bg-surface-card flex flex-col shrink-0 z-20 transition-[width,opacity] duration-snappy ease-emil-out select-none overflow-hidden ${
        isOpen
          ? 'w-80 xl:w-96 border-l opacity-100 pointer-events-auto'
          : 'w-0 border-l-0 opacity-0 pointer-events-none'
      }`}
    >
      <div className="w-80 xl:w-96 h-full flex flex-col shrink-0">
      {/* 1. Header com Segmented Control Horizontal Apple HIG */}
      <div className="p-2.5 border-b border-border/70 bg-surface-subtle/40">
        <div
          role="tablist"
          aria-label="Abas do Inspetor"
          className={`grid grid-cols-4 p-0.5 bg-black/[0.05] rounded-[8px] border border-black/[0.04] transition-opacity duration-snappy ${
            !currentTemplate ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          {/* Aba: Conteúdo / Dados */}
          <button
            type="button"
            id="tab-data"
            role="tab"
            aria-selected={activeTab === 'data'}
            aria-controls="panel-data"
            onClick={() => setActiveTab('data')}
            className={`btn-tactile h-7 rounded-[6px] text-[11px] font-medium flex items-center justify-center gap-1 transition-colors duration-instant ${
              currentTemplate && activeTab === 'data'
                ? 'bg-white text-foreground-primary shadow-xs font-semibold'
                : 'text-foreground-secondary hover:text-foreground-primary'
            }`}
          >
            <Edit3 className="w-3 h-3 text-[#3a86ff]" />
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
            className={`btn-tactile h-7 rounded-[6px] text-[11px] font-medium flex items-center justify-center gap-1 transition-colors duration-instant ${
              currentTemplate && activeTab === 'media'
                ? 'bg-white text-foreground-primary shadow-xs font-semibold'
                : 'text-foreground-secondary hover:text-foreground-primary'
            }`}
          >
            <FileText className="w-3 h-3 text-[#8338ec]" />
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
            className={`btn-tactile relative h-7 rounded-[6px] text-[11px] font-medium flex items-center justify-center gap-1 transition-colors duration-instant ${
              currentTemplate && activeTab === 'colors'
                ? 'bg-white text-foreground-primary shadow-xs font-semibold'
                : 'text-foreground-secondary hover:text-foreground-primary'
            }`}
          >
            <Palette className="w-3 h-3 text-[#ff006e]" />
            <span>Corte</span>
          </button>

          {/* Aba: Calibração */}
          <button
            type="button"
            id="tab-calibration"
            role="tab"
            aria-selected={activeTab === 'calibration'}
            aria-controls="panel-calibration"
            onClick={() => setActiveTab('calibration')}
            className={`btn-tactile relative h-7 rounded-[6px] text-[11px] font-medium flex items-center justify-center gap-1 transition-colors duration-instant ${
              currentTemplate && activeTab === 'calibration'
                ? 'bg-white text-foreground-primary shadow-xs font-semibold'
                : 'text-foreground-secondary hover:text-foreground-primary'
            }`}
          >
            <Crosshair className="w-3 h-3 text-[#ffbe0b]" />
            <span>Calibrar</span>
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
                  defaultFontWeight={currentTemplate.defaultFontWeight}
                  onChangeField={onChangeField}
                  onChangeFieldWeight={onChangeFieldWeight}
                  firstInputRef={firstInputRef}
                  onClearAll={onResetForm}
                />

                {currentTemplate.grid ? (
                  <SheetGridOptions
                    grid={currentTemplate.grid}
                    copies={Number(formData._gridCopies ?? currentTemplate.grid.rows * currentTemplate.grid.cols)}
                    startPosition={Number(formData._gridStartPosition ?? 0)}
                    hideSingleCopy={formData._hideSingleCopy !== false}
                    onChangeCopies={onChangeCopies}
                    onChangeStartPosition={onChangeStartPosition}
                    onChangeHideSingleCopy={(hide) => onChangeField('_hideSingleCopy', hide)}
                  />
                ) : (
                  <ThermalCopiesOptions
                    copies={Number(formData._thermalCopies ?? 1)}
                    hideSingleCopy={formData._hideSingleCopy !== false}
                    onChangeCopies={(copies) => onChangeField('_thermalCopies', copies)}
                    onChangeHideSingleCopy={(hide) => onChangeField('_hideSingleCopy', hide)}
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
                  printerName={printerName}
                  onChangePrinterName={onChangePrinterName}
                />
              </div>
            )}
          </>
        ) : (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center space-y-3.5 my-auto animate-modal-enter">
            <div className="w-11 h-11 rounded-full bg-black/[0.04] border border-black/[0.06] flex items-center justify-center text-foreground-muted">
              <Sliders className="w-5 h-5 text-foreground-muted" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-foreground-primary">Inspetor Inativo</h4>
              <p className="text-[11px] text-foreground-muted leading-relaxed max-w-[200px]">
                Selecione ou crie um modelo para preencher campos, escolher substratos e calibrar medidas.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Rodapé com Ações Rápidas (Exportar PDF e Reset) */}
      {currentTemplate && (
        <div className="p-3 border-t border-border/70 bg-surface-subtle/40 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onExportPdf}
            className="btn-tactile py-1.5 px-3 bg-surface-card hover:bg-black/[0.04] text-foreground-primary border border-border/80 rounded-[6px] text-xs font-medium flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.97] transition-colors duration-instant"
            title="Exportar documento como PDF"
          >
            <Download className="w-3.5 h-3.5 text-foreground-secondary" />
            <span>Salvar PDF</span>
          </button>

          <button
            type="button"
            onClick={onResetForm}
            className="btn-tactile py-1.5 px-3 bg-surface-card hover:bg-black/[0.04] text-foreground-secondary hover:text-foreground-primary border border-border/80 rounded-[6px] text-xs font-medium flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.97] transition-colors duration-instant"
            title="Restaurar dados padrão do modelo"
          >
            <RotateCcw className="w-3.5 h-3.5 text-foreground-muted" />
            <span>Resetar</span>
          </button>
        </div>
      )}
      </div>
    </aside>
  );
};
