import React, { useRef } from 'react';
import {
  Template,
  TemplateField,
  DateFormat,
  CustomTemplateDefinition,
} from '../types/template';
import {
  Type,
  Barcode,
  QrCode,
  Calendar,
  Image as ImageIcon,
  FileText,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Save,
  Download,
  Upload,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { FontWeightControl } from './FontWeightControl';
import { DatePropertiesControl } from './DatePropertiesControl';
import { SvgPropertiesControl } from './SvgPropertiesControl';
import { importTemplateFromFile, ExportFormat } from '../utils/templateFileIO';
import { formatShortcut } from '../utils/platform';

interface DesignInspectorProps {
  currentTemplate: Template;
  selectedField: TemplateField | null;
  onUpdateField: (key: string, updates: Partial<TemplateField>) => void;
  onRemoveField: (key: string) => void;
  onDuplicateField: (field: TemplateField) => void;
  onUpdateTemplateProps: (updates: Partial<Template>) => void;
  onSaveTemplate: () => void;
  onDiscardChanges: () => void;
  hasUnsavedChanges: boolean;
  isCustom: boolean;
  onExportTemplate?: (format: ExportFormat) => void;
  onImportTemplate?: (templateDef: CustomTemplateDefinition) => void;
}

export const DesignInspector: React.FC<DesignInspectorProps> = ({
  currentTemplate,
  selectedField,
  onUpdateField,
  onRemoveField,
  onDuplicateField,
  onUpdateTemplateProps,
  onSaveTemplate,
  onDiscardChanges,
  hasUnsavedChanges,
  isCustom,
  onExportTemplate,
  onImportTemplate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importTemplateFromFile(file);
      if (result.success && result.data && onImportTemplate) {
        const importedDef: CustomTemplateDefinition = {
          id: result.data.id || `custom-${Date.now()}`,
          name: result.data.name || file.name.replace(/\.[^/.]+$/, ''),
          category: result.data.category || 'thermal',
          description: result.data.description || `Importado de ${file.name}`,
          dimensions: result.data.dimensions || {
            widthMm: 100,
            heightMm: 50,
            orientation: 'landscape',
          },
          grid: result.data.grid,
          backgroundSvg: result.data.backgroundSvg,
          fields: result.data.fields || [],
          isCustom: true,
        };
        onImportTemplate(importedDef);
      } else if (result.error) {
        alert(`Erro ao importar modelo: ${result.error}`);
      }
    } catch (err: any) {
      alert(`Erro inesperado ao importar modelo: ${err.message}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'barcode':
        return <Barcode className="w-4 h-4 text-[#8338ec]" />;
      case 'qrcode':
        return <QrCode className="w-4 h-4 text-[#ff006e]" />;
      case 'date':
        return <Calendar className="w-4 h-4 text-[#fb5607]" />;
      case 'svg':
        return <ImageIcon className="w-4 h-4 text-[#ffbe0b]" />;
      case 'textarea':
        return <FileText className="w-4 h-4 text-[#00b4d8]" />;
      default:
        return <Type className="w-4 h-4 text-[#3a86ff]" />;
    }
  };

  const getFieldTypeName = (type: string) => {
    switch (type) {
      case 'barcode':
        return 'Código de Barras';
      case 'qrcode':
        return 'QR Code';
      case 'date':
        return 'Data Dinâmica';
      case 'svg':
        return 'Logotipo / Vetor SVG';
      case 'textarea':
        return 'Área de Texto Multilinha';
      default:
        return 'Texto Simples';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-surface-card">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {selectedField ? (
          /* ==============================================================
             PAINEL 1: PROPRIEDADES DO ELEMENTO SELECIONADO
             ============================================================== */
          <>
            {/* Cabeçalho do Elemento */}
            <div className="p-3 bg-surface-subtle border border-border/80 rounded-[10px] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-[6px] bg-white dark:bg-black/20 shadow-2xs border border-border/60">
                    {getFieldIcon(selectedField.type)}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-foreground-muted block">
                      {getFieldTypeName(selectedField.type)}
                    </span>
                    <input
                      type="text"
                      value={selectedField.label}
                      onChange={(e) => onUpdateField(selectedField.key, { label: e.target.value })}
                      placeholder="Rótulo do elemento"
                      className="text-xs font-semibold text-foreground-primary bg-transparent border-b border-dashed border-border hover:border-foreground-primary focus:border-[#3a86ff] focus:outline-none px-0.5 py-0.5"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onUpdateField(selectedField.key, { locked: !selectedField.locked })}
                    className={`btn-tactile p-1.5 rounded-[6px] border transition-colors ${
                      selectedField.locked
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        : 'text-foreground-secondary hover:text-foreground-primary border-transparent hover:bg-black/[0.05]'
                    }`}
                    title={selectedField.locked ? 'Desbloquear elemento' : 'Bloquear posição'}
                  >
                    {selectedField.locked ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicateField(selectedField)}
                    className="btn-tactile p-1.5 rounded-[6px] text-foreground-secondary hover:text-foreground-primary border border-transparent hover:bg-black/[0.05] transition-colors"
                    title={`Duplicar elemento (${formatShortcut('D')})`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveField(selectedField.key)}
                    className="btn-tactile p-1.5 rounded-[6px] text-destructive hover:bg-destructive/10 border border-transparent transition-colors"
                    title="Excluir elemento (Delete)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Seção: Geometria & Posição (mm) */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-foreground-secondary uppercase tracking-wider block">
                Posição e Dimensões (mm)
              </label>
              <div className="grid grid-cols-2 gap-2 bg-surface-subtle/50 p-2.5 rounded-[8px] border border-border/60">
                <div>
                  <span className="text-[10px] text-foreground-muted block mb-1">X (horizontal)</span>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={selectedField.xMm ?? 0}
                      onChange={(e) => onUpdateField(selectedField.key, { xMm: Math.max(0, parseFloat(e.target.value) || 0) })}
                      className="clean-number-input w-full text-xs font-mono pl-2 pr-7 py-1 bg-white border border-border rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#3a86ff]"
                    />
                    <span className="absolute right-2 text-[10px] font-mono font-medium text-foreground-muted pointer-events-none select-none">
                      mm
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-foreground-muted block mb-1">Y (vertical)</span>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={selectedField.yMm ?? 0}
                      onChange={(e) => onUpdateField(selectedField.key, { yMm: Math.max(0, parseFloat(e.target.value) || 0) })}
                      className="clean-number-input w-full text-xs font-mono pl-2 pr-7 py-1 bg-white border border-border rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#3a86ff]"
                    />
                    <span className="absolute right-2 text-[10px] font-mono font-medium text-foreground-muted pointer-events-none select-none">
                      mm
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-foreground-muted block mb-1">Largura</span>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="1"
                      min="3"
                      value={selectedField.widthMm ?? 30}
                      onChange={(e) => onUpdateField(selectedField.key, { widthMm: Math.max(3, parseFloat(e.target.value) || 3) })}
                      className="clean-number-input w-full text-xs font-mono pl-2 pr-7 py-1 bg-white border border-border rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#3a86ff]"
                    />
                    <span className="absolute right-2 text-[10px] font-mono font-medium text-foreground-muted pointer-events-none select-none">
                      mm
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-foreground-muted block mb-1">Altura</span>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="1"
                      min="3"
                      value={selectedField.heightMm ?? 8}
                      onChange={(e) => onUpdateField(selectedField.key, { heightMm: Math.max(3, parseFloat(e.target.value) || 3) })}
                      className="clean-number-input w-full text-xs font-mono pl-2 pr-7 py-1 bg-white border border-border rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#3a86ff]"
                    />
                    <span className="absolute right-2 text-[10px] font-mono font-medium text-foreground-muted pointer-events-none select-none">
                      mm
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção: Tipografia & Alinhamento (se aplicável) */}
            {selectedField.type !== 'svg' && (
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-foreground-secondary uppercase tracking-wider block">
                  Tipografia e Alinhamento
                </label>
                <div className="bg-surface-subtle/50 p-2.5 rounded-[8px] border border-border/60 space-y-3">
                  {/* Tamanho da Fonte */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground-secondary">Tamanho da Fonte</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="5"
                        max="36"
                        step="0.5"
                        value={selectedField.fontSizePt || 8.5}
                        onChange={(e) => onUpdateField(selectedField.key, { fontSizePt: parseFloat(e.target.value) })}
                        className="w-24 accent-[#3a86ff] cursor-pointer"
                      />
                      <span className="text-xs font-mono font-medium text-foreground-primary w-12 text-right">
                        {(selectedField.fontSizePt || 8.5).toFixed(1)} pt
                      </span>
                    </div>
                  </div>

                  {/* Peso Tipográfico */}
                  <div className="space-y-1">
                    <span className="text-[10.5px] text-foreground-muted block">Peso Tipográfico</span>
                    <FontWeightControl
                      value={selectedField.fontWeight || 'normal'}
                      onChange={(w) => onUpdateField(selectedField.key, { fontWeight: w })}
                    />
                  </div>

                  {/* Alinhamento de Texto */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-foreground-secondary">Alinhamento</span>
                    <div className="flex items-center gap-1 p-0.5 bg-black/[0.04] rounded-[6px] border border-border/60">
                      <button
                        type="button"
                        onClick={() => onUpdateField(selectedField.key, { textAlign: 'left' })}
                        className={`p-1 rounded-[4px] transition-colors ${
                          (selectedField.textAlign || 'left') === 'left'
                            ? 'bg-white shadow-2xs text-[#3a86ff]'
                            : 'text-foreground-muted hover:text-foreground-primary'
                        }`}
                        title="Alinhar à Esquerda"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateField(selectedField.key, { textAlign: 'center' })}
                        className={`p-1 rounded-[4px] transition-colors ${
                          selectedField.textAlign === 'center'
                            ? 'bg-white shadow-2xs text-[#3a86ff]'
                            : 'text-foreground-muted hover:text-foreground-primary'
                        }`}
                        title="Centralizar Texto"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateField(selectedField.key, { textAlign: 'right' })}
                        className={`p-1 rounded-[4px] transition-colors ${
                          selectedField.textAlign === 'right'
                            ? 'bg-white shadow-2xs text-[#3a86ff]'
                            : 'text-foreground-muted hover:text-foreground-primary'
                        }`}
                        title="Alinhar à Direita"
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Alinhamento Vertical */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground-secondary">Alinhamento Vertical</span>
                    <div className="flex items-center gap-1 p-0.5 bg-black/[0.04] rounded-[6px] border border-border/60">
                      <button
                        type="button"
                        onClick={() => onUpdateField(selectedField.key, { verticalAlign: 'top' })}
                        className={`p-1 rounded-[4px] transition-colors ${
                          (selectedField.verticalAlign || 'top') === 'top'
                            ? 'bg-white shadow-2xs text-[#3a86ff]'
                            : 'text-foreground-muted hover:text-foreground-primary'
                        }`}
                        title="Alinhar ao Topo"
                      >
                        <AlignVerticalJustifyStart className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateField(selectedField.key, { verticalAlign: 'middle' })}
                        className={`p-1 rounded-[4px] transition-colors ${
                          selectedField.verticalAlign === 'middle'
                            ? 'bg-white shadow-2xs text-[#3a86ff]'
                            : 'text-foreground-muted hover:text-foreground-primary'
                        }`}
                        title="Alinhar ao Meio"
                      >
                        <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateField(selectedField.key, { verticalAlign: 'bottom' })}
                        className={`p-1 rounded-[4px] transition-colors ${
                          selectedField.verticalAlign === 'bottom'
                            ? 'bg-white shadow-2xs text-[#3a86ff]'
                            : 'text-foreground-muted hover:text-foreground-primary'
                        }`}
                        title="Alinhar à Base"
                      >
                        <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Opções de Borda e Rótulo */}
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedField.showLabel ?? false}
                        onChange={(e) => onUpdateField(selectedField.key, { showLabel: e.target.checked })}
                        className="rounded-[4px] border-border text-[#3a86ff] focus:ring-[#3a86ff]"
                      />
                      <span className="text-xs text-foreground-secondary">Exibir rótulo acima do valor</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedField.showBorder ?? false}
                        onChange={(e) => onUpdateField(selectedField.key, { showBorder: e.target.checked })}
                        className="rounded-[4px] border-border text-[#3a86ff] focus:ring-[#3a86ff]"
                      />
                      <span className="text-xs text-foreground-secondary">Borda delimitadora de corte</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Seção: Propriedades Específicas do Tipo */}
            {selectedField.type === 'barcode' && (
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-foreground-secondary uppercase tracking-wider block">
                  Configurações do Código de Barras
                </label>
                <div className="bg-surface-subtle/50 p-2.5 rounded-[8px] border border-border/60 space-y-3">
                  <div>
                    <span className="text-[10.5px] text-foreground-muted block mb-1">Padrão Simbólico</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onUpdateField(selectedField.key, { barcodeFormat: 'CODE128' })}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-[6px] border transition-colors ${
                          (selectedField.barcodeFormat || 'CODE128') === 'CODE128'
                            ? 'bg-[#8338ec] text-white border-[#8338ec]'
                            : 'bg-white text-foreground-secondary border-border hover:bg-black/[0.02]'
                        }`}
                      >
                        Code 128 (Alfa)
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateField(selectedField.key, { barcodeFormat: 'EAN13' })}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-[6px] border transition-colors ${
                          selectedField.barcodeFormat === 'EAN13'
                            ? 'bg-[#8338ec] text-white border-[#8338ec]'
                            : 'bg-white text-foreground-secondary border-border hover:bg-black/[0.02]'
                        }`}
                      >
                        EAN-13 (Varejo)
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10.5px] text-foreground-muted block mb-1">Valor Padrão Inicial</span>
                    <input
                      type="text"
                      value={String(selectedField.defaultValue ?? '')}
                      onChange={(e) => onUpdateField(selectedField.key, { defaultValue: e.target.value })}
                      placeholder="Ex: 7891234567890"
                      className="w-full text-xs font-mono px-2 py-1.5 bg-white border border-border rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#8338ec]"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedField.type === 'qrcode' && (
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-foreground-secondary uppercase tracking-wider block">
                  Configurações do QR Code
                </label>
                <div className="bg-surface-subtle/50 p-2.5 rounded-[8px] border border-border/60 space-y-2">
                  <span className="text-[10.5px] text-foreground-muted block">Conteúdo ou URL Padrão</span>
                  <input
                    type="text"
                    value={String(selectedField.defaultValue ?? '')}
                    onChange={(e) => onUpdateField(selectedField.key, { defaultValue: e.target.value })}
                    placeholder="https://..."
                    className="w-full text-xs font-mono px-2 py-1.5 bg-white border border-border rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#ff006e]"
                  />
                </div>
              </div>
            )}

            {selectedField.type === 'date' && (
              <DatePropertiesControl
                dateFormat={selectedField.dateFormat || 'DD/MM/YYYY'}
                onChangeDateFormat={(format: DateFormat) => onUpdateField(selectedField.key, { dateFormat: format })}
                datePrefix={selectedField.datePrefix || ''}
                onChangeDatePrefix={(prefix: string) => onUpdateField(selectedField.key, { datePrefix: prefix })}
                isAutoDate={selectedField.isAutoDate ?? true}
                onChangeIsAutoDate={(auto: boolean) => onUpdateField(selectedField.key, { isAutoDate: auto })}
              />
            )}

            {selectedField.type === 'svg' && (
              <SvgPropertiesControl
                svgContent={selectedField.svgContent || ''}
                onChangeSvgContent={(content: string) => onUpdateField(selectedField.key, { svgContent: content })}
                fill={selectedField.svgFill || '#000000'}
                onChangeFill={(fill: string) => onUpdateField(selectedField.key, { svgFill: fill })}
                stroke={selectedField.svgStroke || ''}
                onChangeStroke={(stroke: string) => onUpdateField(selectedField.key, { svgStroke: stroke })}
                strokeWidth={selectedField.svgStrokeWidth || 0}
                onChangeStrokeWidth={(w: number) => onUpdateField(selectedField.key, { svgStrokeWidth: w })}
                rotation={selectedField.svgRotation || 0}
                onChangeRotation={(rot: 0 | 90 | 180 | 270) => onUpdateField(selectedField.key, { svgRotation: rot })}
                flipH={selectedField.svgFlipH ?? false}
                onChangeFlipH={(flip: boolean) => onUpdateField(selectedField.key, { svgFlipH: flip })}
                flipV={selectedField.svgFlipV ?? false}
                onChangeFlipV={(flip: boolean) => onUpdateField(selectedField.key, { svgFlipV: flip })}
                onFileUpload={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const content = evt.target?.result as string;
                    if (content) {
                      onUpdateField(selectedField.key, { svgContent: content });
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            )}

            {selectedField.type === 'text' && (
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-foreground-secondary uppercase tracking-wider block">
                  Valor Inicial
                </label>
                <div className="bg-surface-subtle/50 p-2.5 rounded-[8px] border border-border/60">
                  <input
                    type="text"
                    value={String(selectedField.defaultValue ?? '')}
                    onChange={(e) => onUpdateField(selectedField.key, { defaultValue: e.target.value })}
                    placeholder="Texto padrão da etiqueta"
                    className="w-full text-xs px-2 py-1.5 bg-white border border-border rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#3a86ff]"
                  />
                </div>
              </div>
            )}

            {selectedField.type === 'textarea' && (
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-foreground-secondary uppercase tracking-wider block">
                  Texto Inicial Multilinha
                </label>
                <div className="bg-surface-subtle/50 p-2.5 rounded-[8px] border border-border/60">
                  <textarea
                    rows={3}
                    value={String(selectedField.defaultValue ?? '')}
                    onChange={(e) => onUpdateField(selectedField.key, { defaultValue: e.target.value })}
                    placeholder="Texto padrão com quebras de linha..."
                    className="w-full text-xs px-2 py-1.5 bg-white border border-border rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#00b4d8]"
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          /* ==============================================================
             PAINEL 2: PROPRIEDADES GERAIS DO MODELO / FOLHA FÍSICA
             ============================================================== */
          <>
            {/* Nome e Descrição */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-foreground-muted" />
                <label className="text-[11px] font-semibold text-foreground-secondary uppercase tracking-wider">
                  Identificação do Modelo
                </label>
              </div>
              <div className="bg-surface-subtle/50 p-2.5 rounded-[8px] border border-border/60 space-y-2.5">
                <div>
                  <span className="text-[10px] text-foreground-muted block mb-1">Nome de Exibição</span>
                  <input
                    type="text"
                    value={currentTemplate.name}
                    onChange={(e) => onUpdateTemplateProps({ name: e.target.value })}
                    className="w-full text-xs font-medium px-2 py-1.5 bg-white border border-border rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#3a86ff]"
                    placeholder="Ex: Etiqueta de Envio 100x50"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-foreground-muted block mb-1">Descrição Breve</span>
                  <input
                    type="text"
                    value={currentTemplate.description || ''}
                    onChange={(e) => onUpdateTemplateProps({ description: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 bg-white border border-border rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#3a86ff]"
                    placeholder="Ex: Uso em impressoras térmicas Zebra / Elgin"
                  />
                </div>
              </div>
            </div>

            {/* Dimensões Físicas (mm) */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-foreground-secondary uppercase tracking-wider block">
                Dimensões da Etiqueta (mm)
              </label>
              <div className="grid grid-cols-2 gap-2 bg-surface-subtle/50 p-2.5 rounded-[8px] border border-border/60">
                <div>
                  <span className="text-[10px] text-foreground-muted block mb-1">Largura</span>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="1"
                      min="20"
                      max="300"
                      value={currentTemplate.dimensions.widthMm}
                      onChange={(e) =>
                        onUpdateTemplateProps({
                          dimensions: {
                            ...currentTemplate.dimensions,
                            widthMm: Math.max(20, parseFloat(e.target.value) || 20),
                          },
                        })
                      }
                      className="clean-number-input w-full text-xs font-mono pl-2 pr-7 py-1 bg-white border border-border rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#3a86ff]"
                    />
                    <span className="absolute right-2 text-[10px] font-mono font-medium text-foreground-muted pointer-events-none select-none">
                      mm
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-foreground-muted block mb-1">Altura</span>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="1"
                      min="15"
                      max="300"
                      value={currentTemplate.dimensions.heightMm}
                      onChange={(e) =>
                        onUpdateTemplateProps({
                          dimensions: {
                            ...currentTemplate.dimensions,
                            heightMm: Math.max(15, parseFloat(e.target.value) || 15),
                          },
                        })
                      }
                      className="clean-number-input w-full text-xs font-mono pl-2 pr-7 py-1 bg-white border border-border rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#3a86ff]"
                    />
                    <span className="absolute right-2 text-[10px] font-mono font-medium text-foreground-muted pointer-events-none select-none">
                      mm
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SVG / Marca D'água de Fundo */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-foreground-secondary uppercase tracking-wider block">
                Logotipo / Fundo SVG
              </label>
              <SvgPropertiesControl
                label="Logotipo de Fundo"
                svgContent={currentTemplate.backgroundSvg || ''}
                onChangeSvgContent={(content: string) => onUpdateTemplateProps({ backgroundSvg: content })}
                fill={currentTemplate.backgroundSvgFill || ''}
                onChangeFill={(fill: string) => onUpdateTemplateProps({ backgroundSvgFill: fill })}
                stroke={currentTemplate.backgroundSvgStroke || ''}
                onChangeStroke={(stroke: string) => onUpdateTemplateProps({ backgroundSvgStroke: stroke })}
                strokeWidth={currentTemplate.backgroundSvgStrokeWidth || 0}
                onChangeStrokeWidth={(w: number) => onUpdateTemplateProps({ backgroundSvgStrokeWidth: w })}
                rotation={currentTemplate.backgroundSvgRotation || 0}
                onChangeRotation={(rot: 0 | 90 | 180 | 270) => onUpdateTemplateProps({ backgroundSvgRotation: rot })}
                flipH={currentTemplate.backgroundSvgFlipH ?? false}
                onChangeFlipH={(flip: boolean) => onUpdateTemplateProps({ backgroundSvgFlipH: flip })}
                flipV={currentTemplate.backgroundSvgFlipV ?? false}
                onChangeFlipV={(flip: boolean) => onUpdateTemplateProps({ backgroundSvgFlipV: flip })}
                onFileUpload={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const content = evt.target?.result as string;
                    if (content) {
                      onUpdateTemplateProps({ backgroundSvg: content });
                    }
                  };
                  reader.readAsText(file);
                }}
                onRemove={currentTemplate.backgroundSvg ? () => onUpdateTemplateProps({ backgroundSvg: '' }) : undefined}
              />
            </div>

            {/* Importar e Exportar Arquivo */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <label className="text-[11px] font-semibold text-foreground-secondary uppercase tracking-wider block">
                Arquivos do Modelo
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onExportTemplate && onExportTemplate('json')}
                  className="btn-tactile px-2.5 py-1.5 bg-surface-subtle hover:bg-black/[0.05] border border-border/80 rounded-[6px] text-xs font-medium text-foreground-secondary hover:text-foreground-primary flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-tactile px-2.5 py-1.5 bg-surface-subtle hover:bg-black/[0.05] border border-border/80 rounded-[6px] text-xs font-medium text-foreground-secondary hover:text-foreground-primary flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importar</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.folium"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Rodapé Fixo de Persistência e Ações */}
      <div className="p-3 border-t border-border/80 bg-surface-subtle space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-foreground-muted flex items-center gap-1">
            {hasUnsavedChanges ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-600 font-medium">Alterações não salvas</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Modelo salvo</span>
              </>
            )}
          </span>

          {!isCustom && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20">
              Nativo Protegido
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={onDiscardChanges}
              className="btn-tactile px-3 py-1.5 text-xs text-foreground-secondary hover:text-foreground-primary hover:bg-black/[0.05] border border-border rounded-[6px] transition-colors"
              title="Reverter alterações não salvas"
            >
              Descartar
            </button>
          )}

          <button
            type="button"
            onClick={onSaveTemplate}
            className={`btn-tactile flex-1 py-1.5 px-3 rounded-[6px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              hasUnsavedChanges
                ? 'bg-[#3a86ff] hover:bg-[#2563eb] text-white shadow-xs'
                : 'bg-white hover:bg-black/[0.04] text-foreground-secondary border border-border/80'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isCustom ? 'Salvar Modelo' : 'Salvar como Novo Modelo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
