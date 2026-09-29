import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CustomTemplateDefinition, FieldType, TemplateField } from '../types/template';
import {
  X,
  Trash2,
  Barcode,
  QrCode,
  Type,
  FileCode,
  Save,
  Upload,
  Ruler,
  Sliders,
  Move,
} from 'lucide-react';
import { BarcodeSvg, QRCodeSvg } from './CodeRenderer';

interface VisualTemplateEditorModalProps {
  isOpen: boolean;
  initialTemplate?: CustomTemplateDefinition | null;
  onClose: () => void;
  onSave: (templateDef: CustomTemplateDefinition) => void;
}

// 1mm = 3.779528 px at 96 DPI
const MM_TO_PX = 3.779528;

// ponytail: Drag & drop uses native mouse event delta to mm mapping.
// Ceiling: Freeform rotation and multi-select alignment tools are omitted.
// Upgrade path: Add box rotation deg and multi-select bounding box math.
export const VisualTemplateEditorModal: React.FC<VisualTemplateEditorModalProps> = ({
  isOpen,
  initialTemplate,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('Novo Modelo');
  const [category, setCategory] = useState<'thermal' | 'document'>('thermal');
  const [widthMm, setWidthMm] = useState(80);
  const [heightMm, setHeightMm] = useState(50);
  const [backgroundSvg, setBackgroundSvg] = useState('');
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; initX: number; initY: number } | null>(null);

  // Canvas zoom
  const [canvasZoom, setCanvasZoom] = useState(2.0); // 200% for easy editing
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Initialize data when opened
  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name);
      setCategory(initialTemplate.category === 'thermal' ? 'thermal' : 'document');
      setWidthMm(initialTemplate.dimensions.widthMm);
      setHeightMm(initialTemplate.dimensions.heightMm);
      setBackgroundSvg(initialTemplate.backgroundSvg || '');

      // Ensure fields have coordinates
      const loadedFields = initialTemplate.fields.map((f, i) => ({
        ...f,
        xMm: f.xMm ?? 3,
        yMm: f.yMm ?? 3 + i * 10,
        widthMm: f.widthMm ?? initialTemplate.dimensions.widthMm - 6,
        heightMm: f.heightMm ?? 8,
        fontSizePt: f.fontSizePt ?? 9,
      }));
      setFields(loadedFields);
      setSelectedFieldKey(loadedFields[0]?.key || null);
    } else {
      setName('Etiqueta Personalizada');
      setCategory('thermal');
      setWidthMm(80);
      setHeightMm(50);
      setBackgroundSvg('');

      const defaultFields: TemplateField[] = [
        {
          key: 'titulo',
          label: 'Título Principal',
          type: 'text',
          required: true,
          defaultValue: 'PRODUTO / COMPONENTE',
          xMm: 4,
          yMm: 3,
          widthMm: 72,
          heightMm: 8,
          fontSizePt: 11,
          fontWeight: 'bold',
          textAlign: 'left',
          showBorder: false,
          showLabel: false,
        },
        {
          key: 'codigo',
          label: 'Código de Rastreio',
          type: 'barcode',
          barcodeFormat: 'CODE128',
          required: true,
          defaultValue: 'FP-8050-01',
          xMm: 4,
          yMm: 14,
          widthMm: 72,
          heightMm: 18,
          fontSizePt: 8,
          textAlign: 'center',
          showBorder: false,
        },
        {
          key: 'detalhe',
          label: 'Observações / Lote',
          type: 'text',
          required: false,
          defaultValue: 'LOTE: 2026-X • CONTROLE DE QUALIDADE',
          xMm: 4,
          yMm: 36,
          widthMm: 50,
          heightMm: 9,
          fontSizePt: 7.5,
          fontWeight: 'normal',
          textAlign: 'left',
          showBorder: false,
          showLabel: false,
        },
        {
          key: 'qr',
          label: 'QR Code',
          type: 'qrcode',
          required: false,
          defaultValue: 'https://foliumprint.local/id=01',
          xMm: 60,
          yMm: 34,
          widthMm: 15,
          heightMm: 13,
          showBorder: false,
        },
      ];
      setFields(defaultFields);
      setSelectedFieldKey(defaultFields[0].key);
    }
  }, [initialTemplate, isOpen]);

  // Selected Field reference
  const selectedField = fields.find((f) => f.key === selectedFieldKey) || null;

  const handleUpdateField = (key: string, updates: Partial<TemplateField>) => {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, ...updates } : f))
    );
  };

  const handleAddField = (type: FieldType, extra?: Partial<TemplateField>) => {
    const key = `campo_${Date.now()}`;
    const newField: TemplateField = {
      key,
      label: type === 'barcode' ? 'Código de Barras' : type === 'qrcode' ? 'QR Code' : type === 'svg' ? 'Logotipo SVG' : `Campo ${fields.length + 1}`,
      type,
      required: false,
      defaultValue: type === 'barcode' ? '123456789' : type === 'qrcode' ? 'INFO' : 'Texto de exemplo',
      xMm: 5,
      yMm: Math.min(heightMm - 10, 5 + fields.length * 6),
      widthMm: type === 'qrcode' ? 14 : type === 'svg' ? 20 : Math.min(widthMm - 10, 60),
      heightMm: type === 'barcode' ? 16 : type === 'qrcode' ? 14 : type === 'svg' ? 14 : 7,
      fontSizePt: 8.5,
      fontWeight: 'normal',
      textAlign: 'left',
      showBorder: false,
      showLabel: type === 'text',
      barcodeFormat: type === 'barcode' ? 'CODE128' : undefined,
      ...extra,
    };

    setFields((prev) => [...prev, newField]);
    setSelectedFieldKey(key);
  };

  const handleRemoveField = (key: string) => {
    if (fields.length <= 1) return;
    setFields((prev) => prev.filter((f) => f.key !== key));
    if (selectedFieldKey === key) {
      const remaining = fields.filter((f) => f.key !== key);
      setSelectedFieldKey(remaining[0]?.key || null);
    }
  };

  // Direct Manipulation: Pointer Events Dragging with 1:1 Tracking & Capture (Apple WWDC Fluid Interfaces)
  const handleBoxPointerDown = (e: React.PointerEvent<HTMLDivElement>, field: TemplateField) => {
    e.stopPropagation();
    setSelectedFieldKey(field.key);
    setIsDragging(true);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      initX: field.xMm ?? 0,
      initY: field.yMm ?? 0,
    });
    // Lock pointer capture to maintain continuous 1:1 tracking even outside container
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleBoxPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !dragStart || !selectedFieldKey) return;

      const deltaPixelX = e.clientX - dragStart.mouseX;
      const deltaPixelY = e.clientY - dragStart.mouseY;

      // Convert screen pixels to millimeters based on canvas zoom
      const deltaMmX = deltaPixelX / (MM_TO_PX * canvasZoom);
      const deltaMmY = deltaPixelY / (MM_TO_PX * canvasZoom);

      const newX = Math.max(0, Math.min(widthMm - 5, Math.round((dragStart.initX + deltaMmX) * 2) / 2));
      const newY = Math.max(0, Math.min(heightMm - 5, Math.round((dragStart.initY + deltaMmY) * 2) / 2));

      handleUpdateField(selectedFieldKey, { xMm: newX, yMm: newY });
    },
    [isDragging, dragStart, selectedFieldKey, canvasZoom, widthMm, heightMm]
  );

  const handleBoxPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    setDragStart(null);
  };

  // SVG File Upload
  const handleSvgFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'background' | 'field') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (target === 'background') {
        setBackgroundSvg(content);
      } else if (selectedFieldKey) {
        handleUpdateField(selectedFieldKey, { svgContent: content });
      }
    };
    reader.readAsText(file);
  };

  // Save Template
  const handleSave = () => {
    if (!name.trim()) return;

    const id = initialTemplate?.id || `custom-${Date.now()}`;
    const def: CustomTemplateDefinition = {
      id,
      name: name.trim(),
      category: category,
      description: `Modelo ${widthMm}x${heightMm} mm com ${fields.length} caixas posicionadas`,
      dimensions: {
        widthMm: Number(widthMm),
        heightMm: Number(heightMm),
        orientation: widthMm >= heightMm ? 'landscape' : 'portrait',
      },
      fields: fields,
      backgroundSvg: backgroundSvg.trim() || undefined,
      isCustom: true,
    };

    onSave(def);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 select-none animate-backdrop-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="visual-editor-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-card border border-border rounded-[8px] shadow-subtle w-full h-[95vh] max-w-6xl flex flex-col overflow-hidden animate-modal-enter"
      >
        {/* Top Header & Actions Bar */}
        <div className="h-13 px-4 border-b border-border bg-surface-card flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] border border-border bg-surface-subtle flex items-center justify-center text-foreground-primary">
              <Ruler className="w-4 h-4 text-foreground-primary" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <div>
              <h2 id="visual-editor-title" className="text-xs font-semibold tracking-tight text-foreground-primary">
                Editor Visual de Etiquetas & SVG
              </h2>
              <span className="text-[11px] text-foreground-muted">
                Posicionamento milimétrico exato e vetores para impressão física
              </span>
            </div>
          </div>

          {/* Quick Add Elements Toolbar with Spot Colors & Tactile Buttons */}
          <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-[6px] border border-border">
            <button
              type="button"
              onClick={() => handleAddField('text')}
              className="btn-tactile px-2 py-1 text-xs font-medium text-foreground-primary hover:bg-surface-card rounded-[4px] flex items-center gap-1.5"
            >
              <Type className="w-3.5 h-3.5 text-foreground-muted" strokeWidth={1.8} />
              <span>+ Texto</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddField('barcode', { barcodeFormat: 'CODE128' })}
              className="btn-tactile px-2 py-1 text-xs font-medium text-foreground-primary hover:bg-surface-card rounded-[4px] flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-azure-blue" />
              <Barcode className="w-3.5 h-3.5 text-foreground-muted" strokeWidth={1.8} />
              <span>+ Code 128</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddField('barcode', { barcodeFormat: 'EAN13', defaultValue: '7891000100103' })}
              className="btn-tactile px-2 py-1 text-xs font-medium text-foreground-primary hover:bg-surface-card rounded-[4px] flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-gold" />
              <Barcode className="w-3.5 h-3.5 text-foreground-muted" strokeWidth={1.8} />
              <span>+ EAN-13</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddField('qrcode')}
              className="btn-tactile px-2 py-1 text-xs font-medium text-foreground-primary hover:bg-surface-card rounded-[4px] flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-neon-pink" />
              <QrCode className="w-3.5 h-3.5 text-foreground-muted" strokeWidth={1.8} />
              <span>+ QR Code</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleAddField('svg', {
                  label: 'Logotipo SVG',
                  svgContent: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="none" stroke="black" stroke-width="6"/><path d="M30 50 L45 65 L70 35" stroke="black" stroke-width="6" fill="none"/></svg>`,
                })
              }
              className="btn-tactile px-2 py-1 text-xs font-medium text-foreground-primary hover:bg-surface-card rounded-[4px] flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-violet" />
              <FileCode className="w-3.5 h-3.5 text-foreground-muted" strokeWidth={1.8} />
              <span>+ SVG</span>
            </button>
          </div>

          {/* Right Header Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="btn-tactile bg-[#111111] hover:bg-[#27272a] text-white text-xs font-medium px-3 py-1.5 rounded-[6px] border border-[#111111] flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-white/90" strokeWidth={1.8} />
              <span>Salvar Modelo</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-tactile text-foreground-muted hover:text-foreground-primary p-1.5 rounded-[4px] hover:bg-surface-subtle"
              title="Fechar (Esc)"
              aria-label="Fechar editor visual (Esc)"
            >
              <X className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Editor Main Body: Canvas Center (65%) + Inspector Sidebar (35%) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Center Canvas Area */}
          <div className="flex-1 bg-surface-canvas relative flex flex-col overflow-hidden">
            {/* Top Toolbar Zoom Controls com Apple Glass sutil */}
            <div className="p-2 border-b border-border/40 apple-glass-subtle flex items-center justify-between text-xs z-10">
              <div className="flex items-center gap-2 text-foreground-muted">
                <span className="font-mono font-bold text-foreground-primary">
                  {widthMm} × {heightMm} mm
                </span>
                <span>• Arraste as caixas com o mouse para posicionar</span>
              </div>
              <div className="flex items-center gap-1 font-mono">
                <button
                  type="button"
                  onClick={() => setCanvasZoom((z) => Math.max(1.0, z - 0.25))}
                  className="px-2 py-0.5 rounded bg-surface-subtle hover:bg-border/60"
                  title="Diminuir zoom"
                  aria-label="Diminuir zoom"
                >
                  -
                </button>
                <span className="px-1 text-foreground-secondary" aria-label={`Zoom atual: ${Math.round(canvasZoom * 100)}%`}>
                  {Math.round(canvasZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setCanvasZoom((z) => Math.min(3.5, z + 0.25))}
                  className="px-2 py-0.5 rounded bg-surface-subtle hover:bg-border/60"
                  title="Aumentar zoom"
                  aria-label="Aumentar zoom"
                >
                  +
                </button>
              </div>
            </div>

            {/* Visual Workspace Canvas */}
            <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
              <div
                ref={canvasRef}
                style={{
                  width: `${widthMm * MM_TO_PX * canvasZoom}px`,
                  height: `${heightMm * MM_TO_PX * canvasZoom}px`,
                  backgroundColor: '#ffffff',
                }}
                className="relative shadow-2xl border border-black/20 select-none overflow-hidden transition-[width,height] duration-snappy ease-out"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setSelectedFieldKey(null);
                  }
                }}
              >
                {/* Background Millimeter Grid Lines Pattern */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #000 1px, transparent 1px),
                      linear-gradient(to bottom, #000 1px, transparent 1px)
                    `,
                    backgroundSize: `${10 * MM_TO_PX * canvasZoom}px ${10 * MM_TO_PX * canvasZoom}px`,
                  }}
                />

                {/* Background SVG if configured */}
                {backgroundSvg && (
                  <div
                    className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-80"
                    dangerouslySetInnerHTML={{ __html: backgroundSvg }}
                  />
                )}

                {/* Dynamic Draggable Boxes */}
                {fields.map((field) => {
                  const isSelected = field.key === selectedFieldKey;
                  const xPx = (field.xMm ?? 0) * MM_TO_PX * canvasZoom;
                  const yPx = (field.yMm ?? 0) * MM_TO_PX * canvasZoom;
                  const wPx = (field.widthMm ?? 30) * MM_TO_PX * canvasZoom;
                  const hPx = (field.heightMm ?? 10) * MM_TO_PX * canvasZoom;

                  return (
                    <div
                      key={field.key}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFieldKey(field.key);
                      }}
                      onPointerDown={(e) => handleBoxPointerDown(e, field)}
                      onPointerMove={handleBoxPointerMove}
                      onPointerUp={handleBoxPointerUp}
                      onPointerCancel={handleBoxPointerUp}
                      style={{
                        position: 'absolute',
                        left: `${xPx}px`,
                        top: `${yPx}px`,
                        width: `${wPx}px`,
                        height: `${hPx}px`,
                        cursor: isDragging && isSelected ? 'grabbing' : 'grab',
                      }}
                      className={`group touch-none flex flex-col justify-center overflow-hidden p-0.5 select-none ${
                        isSelected
                          ? 'ring-2 ring-primary ring-offset-2 bg-primary/15 shadow-xl z-30'
                          : 'border border-dashed border-gray-400 hover:border-primary hover:bg-primary/5 z-10'
                      }`}
                    >
                      {/* Box Selection Badge */}
                      {isSelected && (
                        <div className="absolute top-0 right-0 bg-primary text-white text-[7px] font-mono px-1 rounded-bl shadow-xs pointer-events-none z-30">
                          Selecionada
                        </div>
                      )}

                      {/* Box Drag Indicator Badge */}
                      <div className="absolute top-0.5 left-0.5 bg-black/70 text-white text-[7px] font-mono px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none flex items-center gap-0.5">
                        <Move className="w-2 h-2" />
                        <span>{field.xMm}×{field.yMm}mm</span>
                      </div>

                      {/* Box Content Preview */}
                      {field.type === 'svg' ? (
                        <div
                          className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-none"
                          dangerouslySetInnerHTML={{ __html: field.svgContent || '<svg></svg>' }}
                        />
                      ) : field.type === 'qrcode' ? (
                        <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
                          <QRCodeSvg value={String(field.defaultValue || '00000')} size={Math.min(wPx, hPx) * 0.9} />
                        </div>
                      ) : field.type === 'barcode' ? (
                        <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
                          <BarcodeSvg
                            value={String(field.defaultValue || '123456')}
                            format={field.barcodeFormat || 'CODE128'}
                            height={Math.max(12, hPx * 0.7)}
                            width={1.2 * canvasZoom}
                            displayValue={true}
                            fontSize={7 * canvasZoom}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            textAlign: field.textAlign || 'left',
                            fontSize: `${(field.fontSizePt || 8.5) * canvasZoom * 0.9}px`,
                            fontWeight: field.fontWeight === 'bolder' ? 900 : field.fontWeight === 'bold' ? 700 : 400,
                          }}
                          className="w-full truncate text-black pointer-events-none"
                        >
                          {field.showLabel && (
                            <span className="text-gray-500 font-bold mr-1 text-[80%] uppercase">
                              {field.label}:
                            </span>
                          )}
                          <span>{String(field.defaultValue || field.label)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Inspector & Settings Sidebar */}
          <div className="w-80 border-l border-border bg-surface-card flex flex-col h-full overflow-y-auto">
            {/* Template Global Settings Section */}
            <div className="p-3 border-b border-border space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground-secondary flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-primary" />
                <span>Dimensões Físicas</span>
              </span>

              <div className="space-y-1">
                <label className="text-[11px] text-foreground-secondary">Nome do Modelo:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-surface-subtle border border-border rounded text-foreground-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-foreground-secondary block">Largura (mm):</label>
                  <input
                    type="number"
                    min={20}
                    max={300}
                    value={widthMm}
                    onChange={(e) => setWidthMm(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-surface-subtle border border-border rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-foreground-secondary block">Altura (mm):</label>
                  <input
                    type="number"
                    min={15}
                    max={400}
                    value={heightMm}
                    onChange={(e) => setHeightMm(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-surface-subtle border border-border rounded font-mono"
                  />
                </div>
              </div>

              {/* Background SVG Upload / Code */}
              <div className="pt-2 border-t border-border/60 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-foreground-secondary flex items-center gap-1">
                    <FileCode className="w-3 h-3 text-blue-violet" />
                    <span>SVG de Fundo / Moldura:</span>
                  </label>
                  {backgroundSvg && (
                    <button
                      type="button"
                      onClick={() => setBackgroundSvg('')}
                      className="text-[10px] text-feedback-error hover:underline"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer text-[10px] bg-surface-subtle hover:bg-border/60 text-foreground-primary px-2 py-1 rounded border border-border flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>Subir arquivo .svg</span>
                    <input
                      type="file"
                      accept=".svg"
                      className="hidden"
                      onChange={(e) => handleSvgFileUpload(e, 'background')}
                    />
                  </label>
                </div>

                <textarea
                  rows={2}
                  value={backgroundSvg}
                  onChange={(e) => setBackgroundSvg(e.target.value)}
                  placeholder="Ou cole o código <svg> aqui..."
                  className="w-full text-[10px] font-mono p-1.5 bg-surface-subtle border border-border rounded text-foreground-primary placeholder:text-foreground-muted"
                />
              </div>
            </div>

            {/* Selected Box Inspector Panel */}
            <div className="p-3 flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground-secondary flex items-center gap-1">
                  <span>Caixa Selecionada</span>
                </span>
                {selectedField && (
                  <button
                    type="button"
                    onClick={() => handleRemoveField(selectedField.key)}
                    className="text-feedback-error hover:text-red-700 p-1 rounded"
                    title="Excluir esta caixa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Seletor Rápido de Caixas */}
              <div className="space-y-1">
                <label className="text-[10px] text-foreground-secondary block">
                  Alternar Caixa / Camada:
                </label>
                <select
                  value={selectedFieldKey || ''}
                  onChange={(e) => setSelectedFieldKey(e.target.value || null)}
                  className="w-full text-xs px-2 py-1.5 bg-surface-subtle border border-border rounded font-semibold text-foreground-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Selecione uma caixa --</option>
                  {fields.map((f, i) => (
                    <option key={f.key} value={f.key}>
                      #{i + 1}: {f.label} ({f.type}) [{f.xMm}×{f.yMm}mm]
                    </option>
                  ))}
                </select>
              </div>

              {selectedField ? (
                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-[10px] text-foreground-secondary block mb-0.5">
                      Nome / Rótulo do Campo:
                    </label>
                    <input
                      type="text"
                      value={selectedField.label}
                      onChange={(e) => handleUpdateField(selectedField.key, { label: e.target.value })}
                      className="w-full px-2 py-1 bg-surface-subtle border border-border rounded font-semibold text-foreground-primary"
                    />
                  </div>

                  {/* Coordenadas X e Y em mm */}
                  <div className="p-2 bg-surface-subtle rounded border border-border/80 space-y-2">
                    <span className="text-[10px] font-bold text-foreground-secondary uppercase tracking-wider block">
                      Posicionamento Físico (mm)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-foreground-secondary block">X (mm):</label>
                        <input
                          type="number"
                          step={0.5}
                          min={0}
                          max={widthMm}
                          value={selectedField.xMm ?? 0}
                          onChange={(e) =>
                            handleUpdateField(selectedField.key, { xMm: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2 py-1 bg-surface-card border border-border rounded font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-foreground-secondary block">Y (mm):</label>
                        <input
                          type="number"
                          step={0.5}
                          min={0}
                          max={heightMm}
                          value={selectedField.yMm ?? 0}
                          onChange={(e) =>
                            handleUpdateField(selectedField.key, { yMm: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2 py-1 bg-surface-card border border-border rounded font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-foreground-secondary block">Largura (mm):</label>
                        <input
                          type="number"
                          step={1}
                          min={5}
                          max={widthMm}
                          value={selectedField.widthMm ?? 30}
                          onChange={(e) =>
                            handleUpdateField(selectedField.key, { widthMm: parseFloat(e.target.value) || 10 })
                          }
                          className="w-full px-2 py-1 bg-surface-card border border-border rounded font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-foreground-secondary block">Altura (mm):</label>
                        <input
                          type="number"
                          step={1}
                          min={3}
                          max={heightMm}
                          value={selectedField.heightMm ?? 10}
                          onChange={(e) =>
                            handleUpdateField(selectedField.key, { heightMm: parseFloat(e.target.value) || 5 })
                          }
                          className="w-full px-2 py-1 bg-surface-card border border-border rounded font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Configurações Tipográficas / Estilo */}
                  {selectedField.type !== 'qrcode' && selectedField.type !== 'svg' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-foreground-secondary block">Fonte (pt):</label>
                        <input
                          type="number"
                          step={0.5}
                          min={5}
                          max={36}
                          value={selectedField.fontSizePt ?? 9}
                          onChange={(e) =>
                            handleUpdateField(selectedField.key, { fontSizePt: parseFloat(e.target.value) || 9 })
                          }
                          className="w-full px-2 py-1 bg-surface-subtle border border-border rounded font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-foreground-secondary block">Alinhamento:</label>
                        <select
                          value={selectedField.textAlign || 'left'}
                          onChange={(e) =>
                            handleUpdateField(selectedField.key, { textAlign: e.target.value as any })
                          }
                          className="w-full px-2 py-1 bg-surface-subtle border border-border rounded"
                        >
                          <option value="left">Esquerda</option>
                          <option value="center">Centro</option>
                          <option value="right">Direita</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* SVG Content input for SVG elements */}
                  {selectedField.type === 'svg' ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-foreground-secondary font-semibold">
                          Conteúdo SVG do Elemento:
                        </label>
                        <label className="cursor-pointer text-[9px] text-primary hover:underline">
                          Carregar .svg
                          <input
                            type="file"
                            accept=".svg"
                            className="hidden"
                            onChange={(e) => handleSvgFileUpload(e, 'field')}
                          />
                        </label>
                      </div>
                      <textarea
                        rows={3}
                        value={selectedField.svgContent || ''}
                        onChange={(e) => handleUpdateField(selectedField.key, { svgContent: e.target.value })}
                        className="w-full text-[10px] font-mono p-1.5 bg-surface-subtle border border-border rounded"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] text-foreground-secondary block mb-0.5">
                        Valor Padrão / Mock:
                      </label>
                      <input
                        type="text"
                        value={selectedField.defaultValue ?? ''}
                        onChange={(e) =>
                          handleUpdateField(selectedField.key, { defaultValue: e.target.value })
                        }
                        className="w-full px-2 py-1 bg-surface-subtle border border-border rounded font-mono text-foreground-primary"
                      />
                    </div>
                  )}

                  {/* Checkbox Opções */}
                  <div className="pt-2 space-y-1.5 border-t border-border/60 text-[11px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedField.showBorder || false}
                        onChange={(e) =>
                          handleUpdateField(selectedField.key, { showBorder: e.target.checked })
                        }
                        className="rounded accent-primary"
                      />
                      <span>Desenhar borda retangular na caixa</span>
                    </label>

                    {selectedField.type === 'text' && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedField.showLabel || false}
                          onChange={(e) =>
                            handleUpdateField(selectedField.key, { showLabel: e.target.checked })
                          }
                          className="rounded accent-primary"
                        />
                        <span>Exibir rótulo antes do valor impresso</span>
                      </label>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-foreground-muted text-xs bg-surface-subtle rounded-lg border border-dashed border-border">
                  <p>Clique em uma caixa no canvas ou adicione um novo elemento pela barra superior para editar sua posição e propriedades.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
