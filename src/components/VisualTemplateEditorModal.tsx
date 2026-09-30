import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CustomTemplateDefinition, FieldType, TemplateField, FontWeightOption } from '../types/template';
import {
  X,
  Trash2,
  Barcode,
  QrCode,
  Type,
  FileCode,
  Save,
  Ruler,
  Sliders,
  Download,
  FileUp,
  ChevronDown,
  CheckCircle2,
  Copy,
  Lock,
  Unlock,
  Calendar,
} from 'lucide-react';
import { BarcodeSvg, QRCodeSvg } from './CodeRenderer';
import { MM_TO_PX } from '../utils/units';
import { exportTemplateAsFile, importTemplateFromFile, ExportFormat } from '../utils/templateFileIO';
import { resolveCopyTokens } from '../utils/paginationTokens';
import { formatDate } from '../utils/dateUtils';
import { applySvgAdjustments, getSvgTransformStyle } from '../utils/svgTransform';
import { SvgPropertiesControl } from './SvgPropertiesControl';
import { DatePropertiesControl } from './DatePropertiesControl';
import { FontWeightControl } from './FontWeightControl';
import { normalizeFontWeight, cycleFontWeight } from '../utils/fontUtils';

interface VisualTemplateEditorModalProps {
  isOpen: boolean;
  initialTemplate?: CustomTemplateDefinition | null;
  onClose: () => void;
  onSave: (templateDef: CustomTemplateDefinition) => void;
}

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
  const [backgroundSvgFill, setBackgroundSvgFill] = useState('');
  const [backgroundSvgStroke, setBackgroundSvgStroke] = useState('');
  const [backgroundSvgStrokeWidth, setBackgroundSvgStrokeWidth] = useState<number>(0);
  const [backgroundSvgRotation, setBackgroundSvgRotation] = useState<0 | 90 | 180 | 270>(0);
  const [backgroundSvgFlipH, setBackgroundSvgFlipH] = useState(false);
  const [backgroundSvgFlipV, setBackgroundSvgFlipV] = useState(false);
  const [backgroundSvgOpacity, setBackgroundSvgOpacity] = useState<number>(0.9);
  const [defaultFontWeight, setDefaultFontWeight] = useState<FontWeightOption>('normal');
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);

  // Export & Import states
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; initX: number; initY: number } | null>(null);

  // Resizing state (8 alças completas)
  const [resizing, setResizing] = useState<{
    handle: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
    mouseX: number;
    mouseY: number;
    initX: number;
    initY: number;
    initW: number;
    initH: number;
    initFontSize: number;
  } | null>(null);

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
      setBackgroundSvgFill(initialTemplate.backgroundSvgFill || '');
      setBackgroundSvgStroke(initialTemplate.backgroundSvgStroke || '');
      setBackgroundSvgStrokeWidth(initialTemplate.backgroundSvgStrokeWidth || 0);
      setBackgroundSvgRotation(initialTemplate.backgroundSvgRotation || 0);
      setBackgroundSvgFlipH(Boolean(initialTemplate.backgroundSvgFlipH));
      setBackgroundSvgFlipV(Boolean(initialTemplate.backgroundSvgFlipV));
      setBackgroundSvgOpacity(initialTemplate.backgroundSvgOpacity ?? 0.9);
      setDefaultFontWeight(initialTemplate.defaultFontWeight || 'normal');

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

  // Atalho de teclado rápido: Ctrl+B / Cmd+B para alternar peso tipográfico (Regular -> Bold -> Extra Bold -> Regular)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        if (selectedFieldKey && selectedField) {
          if (selectedField.type !== 'qrcode' && selectedField.type !== 'svg' && selectedField.type !== 'barcode') {
            e.preventDefault();
            const curWeight = selectedField.fontWeight || defaultFontWeight;
            const nextWeight = cycleFontWeight(curWeight);
            handleUpdateField(selectedFieldKey, { fontWeight: nextWeight });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedFieldKey, selectedField, defaultFontWeight]);

  const handleAddField = (type: FieldType, extra?: Partial<TemplateField>) => {
    const key = `campo_${Date.now()}`;
    const isDate = type === 'date' || extra?.isAutoDate;
    const defaultLabel = isDate
      ? 'Data'
      : type === 'barcode'
      ? 'Código de Barras'
      : type === 'qrcode'
      ? 'QR Code'
      : type === 'svg'
      ? 'Logotipo SVG'
      : `Campo ${fields.length + 1}`;

    const defaultVal = isDate
      ? 'today'
      : type === 'barcode'
      ? '123456789'
      : type === 'qrcode'
      ? 'INFO'
      : 'Texto de exemplo';

    const newField: TemplateField = {
      key,
      label: defaultLabel,
      type,
      required: false,
      defaultValue: defaultVal,
      xMm: 5,
      yMm: Math.min(heightMm - 10, 5 + fields.length * 6),
      widthMm: type === 'qrcode' ? 14 : type === 'svg' ? 20 : isDate ? Math.min(widthMm - 10, 36) : Math.min(widthMm - 10, 60),
      heightMm: type === 'barcode' ? 16 : type === 'qrcode' ? 14 : type === 'svg' ? 14 : 7,
      fontSizePt: 8.5,
      fontWeight: 'normal',
      textAlign: 'left',
      showBorder: false,
      showLabel: type === 'text' || isDate,
      barcodeFormat: type === 'barcode' ? 'CODE128' : undefined,
      dateFormat: isDate ? 'DD/MM/YYYY' : undefined,
      datePrefix: '',
      isAutoDate: isDate,
      svgFill: type === 'svg' ? '#000000' : undefined,
      svgStroke: type === 'svg' ? '' : undefined,
      svgStrokeWidth: type === 'svg' ? 0 : undefined,
      svgRotation: 0,
      svgFlipH: false,
      svgFlipV: false,
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
    if (field.locked) return; // Caixa bloqueada não pode ser movida
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

  // Direct Manipulation: Resize Handles (8 alças completas com bloqueio de proporção e limite)
  const handleResizePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    handle: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w',
    field: TemplateField
  ) => {
    e.stopPropagation();
    setSelectedFieldKey(field.key);
    if (field.locked) return; // Caixa bloqueada não pode ser redimensionada
    setResizing({
      handle,
      mouseX: e.clientX,
      mouseY: e.clientY,
      initX: field.xMm ?? 0,
      initY: field.yMm ?? 0,
      initW: field.widthMm ?? 30,
      initH: field.heightMm ?? 10,
      initFontSize: field.fontSizePt ?? 9,
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleResizePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!resizing || !selectedFieldKey) return;

      const deltaPixelX = e.clientX - resizing.mouseX;
      const deltaPixelY = e.clientY - resizing.mouseY;

      const deltaMmX = deltaPixelX / (MM_TO_PX * canvasZoom);
      const deltaMmY = deltaPixelY / (MM_TO_PX * canvasZoom);

      const { initX, initY, initW, initH, initFontSize, handle } = resizing;

      let newX = initX;
      let newY = initY;
      let newW = initW;
      let newH = initH;

      const minW = 5;
      const minH = 4;

      // Redimensionamento horizontal
      if (handle.includes('e')) {
        newW = Math.max(minW, Math.min(widthMm - initX, initW + deltaMmX));
      } else if (handle.includes('w')) {
        const candidateW = Math.max(minW, initW - deltaMmX);
        const candidateX = initX + (initW - candidateW);
        if (candidateX >= 0) {
          newW = candidateW;
          newX = candidateX;
        }
      }

      // Redimensionamento vertical
      if (handle.includes('s')) {
        newH = Math.max(minH, Math.min(heightMm - initY, initH + deltaMmY));
      } else if (handle.includes('n')) {
        const candidateH = Math.max(minH, initH - deltaMmY);
        const candidateY = initY + (initH - candidateH);
        if (candidateY >= 0) {
          newH = candidateH;
          newY = candidateY;
        }
      }

      // Encaixe suave a cada 0.5 mm
      newX = Math.round(newX * 2) / 2;
      newY = Math.round(newY * 2) / 2;
      newW = Math.round(newW * 2) / 2;
      newH = Math.round(newH * 2) / 2;

      // Ajuste proporcional controlado da fonte (com teto baseado na altura real da caixa para nunca vazar)
      const targetField = fields.find((f) => f.key === selectedFieldKey);
      let calculatedFontSizePt: number | undefined = undefined;
      if (
        targetField &&
        targetField.autoScaleFont !== false &&
        targetField.type !== 'barcode' &&
        targetField.type !== 'qrcode' &&
        targetField.type !== 'svg'
      ) {
        const ratio = newH / initH;
        if (initFontSize > 0) {
          // Altura em pontos: 1mm ≈ 2.83pt. O teto absoluto de uma linha de texto deve ser ~70% da altura da caixa em mm convertido para pt
          const maxHeightPt = Math.floor(newH * 2.83 * 0.75);
          const scaledPt = Math.round(initFontSize * ratio * 2) / 2;
          calculatedFontSizePt = Math.max(5, Math.min(maxHeightPt, scaledPt));
        }
      }

      handleUpdateField(selectedFieldKey, {
        xMm: newX,
        yMm: newY,
        widthMm: newW,
        heightMm: newH,
        ...(calculatedFontSizePt ? { fontSizePt: calculatedFontSizePt } : {}),
      });
    },
    [resizing, selectedFieldKey, canvasZoom, widthMm, heightMm, fields]
  );

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setResizing(null);
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

  // Gerar definição atual do modelo
  const getCurrentTemplateDef = useCallback((): CustomTemplateDefinition => {
    const id = initialTemplate?.id || `custom-${Date.now()}`;
    return {
      id,
      name: name.trim() || 'Modelo Personalizado',
      category: category,
      description: `Modelo ${widthMm}x${heightMm} mm com ${fields.length} caixas posicionadas`,
      dimensions: {
        widthMm: Number(widthMm),
        heightMm: Number(heightMm),
        orientation: widthMm >= heightMm ? 'landscape' : 'portrait',
      },
      fields: fields,
      backgroundSvg: backgroundSvg.trim() || undefined,
      backgroundSvgFill: backgroundSvgFill || undefined,
      backgroundSvgStroke: backgroundSvgStroke || undefined,
      backgroundSvgStrokeWidth: backgroundSvgStrokeWidth > 0 ? backgroundSvgStrokeWidth : undefined,
      backgroundSvgRotation: backgroundSvgRotation !== 0 ? backgroundSvgRotation : undefined,
      backgroundSvgFlipH: backgroundSvgFlipH || undefined,
      backgroundSvgFlipV: backgroundSvgFlipV || undefined,
      backgroundSvgOpacity: backgroundSvgOpacity !== 0.9 ? backgroundSvgOpacity : undefined,
      defaultFontWeight: defaultFontWeight !== 'normal' ? defaultFontWeight : undefined,
      isCustom: true,
    };
  }, [
    initialTemplate, 
    name, 
    category, 
    widthMm, 
    heightMm, 
    fields, 
    backgroundSvg,
    backgroundSvgFill,
    backgroundSvgStroke,
    backgroundSvgStrokeWidth,
    backgroundSvgRotation,
    backgroundSvgFlipH,
    backgroundSvgFlipV,
    backgroundSvgOpacity,
    defaultFontWeight
  ]);

  // Exportar modelo em arquivo (.folium, .json ou .html)
  const handleExport = (format: ExportFormat) => {
    const currentDef = getCurrentTemplateDef();
    exportTemplateAsFile(currentDef, format);
    setIsExportDropdownOpen(false);
  };

  // Importar modelo de arquivo (.folium, .json, .svg ou .html)
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importTemplateFromFile(file);
    if (!result.success || !result.data) {
      alert(result.error || 'Erro ao importar arquivo.');
      e.target.value = '';
      return;
    }

    const { data } = result;
    if (data.name) setName(data.name);
    if (data.category) setCategory(data.category === 'document' ? 'document' : 'thermal');
    if (data.dimensions?.widthMm) setWidthMm(data.dimensions.widthMm);
    if (data.dimensions?.heightMm) setHeightMm(data.dimensions.heightMm);
    if (data.backgroundSvg !== undefined) setBackgroundSvg(data.backgroundSvg);
    if (data.backgroundSvgFill !== undefined) setBackgroundSvgFill(data.backgroundSvgFill);
    if (data.backgroundSvgStroke !== undefined) setBackgroundSvgStroke(data.backgroundSvgStroke);
    if (data.backgroundSvgStrokeWidth !== undefined) setBackgroundSvgStrokeWidth(data.backgroundSvgStrokeWidth);
    if (data.backgroundSvgRotation !== undefined) setBackgroundSvgRotation(data.backgroundSvgRotation);
    if (data.backgroundSvgFlipH !== undefined) setBackgroundSvgFlipH(data.backgroundSvgFlipH);
    if (data.backgroundSvgFlipV !== undefined) setBackgroundSvgFlipV(data.backgroundSvgFlipV);
    if (data.backgroundSvgOpacity !== undefined) setBackgroundSvgOpacity(data.backgroundSvgOpacity);
    if (data.fields && Array.isArray(data.fields)) {
      setFields(data.fields);
      setSelectedFieldKey(data.fields[0]?.key || null);
    }

    setImportStatus(`"${file.name}" importado com sucesso!`);
    setTimeout(() => setImportStatus(null), 4000);
    e.target.value = '';
  };

  // Save Template
  const handleSave = () => {
    if (!name.trim()) return;
    const def = getCurrentTemplateDef();
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
        {/* Top Header & Actions Bar (Linha Única Perfeita Apple HIG) */}
        <div className="h-13 px-3 sm:px-4 border-b border-border bg-surface-card flex items-center justify-between gap-2.5 shrink-0 select-none">
          {/* Lado Esquerdo: Ícone e Títulos */}
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <div className="w-7.5 h-7.5 rounded-[6px] border border-border bg-surface-subtle flex items-center justify-center text-foreground-primary shrink-0">
              <Ruler className="w-3.5 h-3.5 text-foreground-secondary" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id="visual-editor-title" className="text-xs font-semibold tracking-tight text-foreground-primary whitespace-nowrap">
                Editor Visual de Etiquetas
              </h2>
              <span className="text-[10px] text-foreground-muted whitespace-nowrap hidden xl:block">
                Milimétrico & Vetorial
              </span>
            </div>
          </div>

          {/* Centro: Barra Tátil de Elementos Rápidos */}
          <div className="flex items-center gap-0.5 bg-surface-subtle p-0.5 rounded-[7px] border border-border/80 shrink-0">
            <button
              type="button"
              onClick={() => handleAddField('text')}
              className="btn-tactile h-7 px-2 text-[11px] font-medium text-foreground-primary hover:bg-surface-card rounded-[5px] flex items-center gap-1.5 whitespace-nowrap active:scale-[0.96] transition-all group"
            >
              <Type className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground-primary shrink-0 transition-colors" strokeWidth={1.8} />
              <span>Texto</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleAddField('text', {
                  label: 'Volume',
                  defaultValue: '{copia}/{total}',
                  showLabel: true,
                  textAlign: 'right',
                  fontWeight: 'bold',
                  widthMm: Math.min(widthMm - 10, 32),
                  heightMm: 6,
                })
              }
              className="btn-tactile h-7 px-2 text-[11px] font-medium text-foreground-primary hover:bg-surface-card rounded-[5px] flex items-center gap-1.5 whitespace-nowrap active:scale-[0.96] transition-all group"
              title="Adicionar campo com identificador de cópias/volumes ({copia}/{total})"
            >
              <Copy className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground-primary shrink-0 transition-colors" strokeWidth={1.8} />
              <span>Volume</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleAddField('date', {
                  label: 'Data',
                  isAutoDate: true,
                  dateFormat: 'DD/MM/YYYY',
                  datePrefix: '',
                  defaultValue: 'today',
                  showLabel: true,
                  widthMm: Math.min(widthMm - 10, 36),
                  heightMm: 6,
                })
              }
              className="btn-tactile h-7 px-2 text-[11px] font-medium text-foreground-primary hover:bg-surface-card rounded-[5px] flex items-center gap-1.5 whitespace-nowrap active:scale-[0.96] transition-all group"
              title="Adicionar campo de data com dia, mês e ano automáticos"
            >
              <Calendar className="w-3.5 h-3.5 text-foreground-muted group-hover:text-[#fb5607] shrink-0 transition-colors" strokeWidth={1.8} />
              <span>Data Auto</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddField('barcode', { barcodeFormat: 'CODE128' })}
              className="btn-tactile h-7 px-2 text-[11px] font-medium text-foreground-primary hover:bg-surface-card rounded-[5px] flex items-center gap-1.5 whitespace-nowrap active:scale-[0.96] transition-all group"
            >
              <Barcode className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground-primary shrink-0 transition-colors" strokeWidth={1.8} />
              <span>Code 128</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddField('barcode', { barcodeFormat: 'EAN13', defaultValue: '7891000100103' })}
              className="btn-tactile h-7 px-2 text-[11px] font-medium text-foreground-primary hover:bg-surface-card rounded-[5px] flex items-center gap-1.5 whitespace-nowrap active:scale-[0.96] transition-all group"
            >
              <Barcode className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground-primary shrink-0 transition-colors" strokeWidth={1.8} />
              <span>EAN-13</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddField('qrcode')}
              className="btn-tactile h-7 px-2 text-[11px] font-medium text-foreground-primary hover:bg-surface-card rounded-[5px] flex items-center gap-1.5 whitespace-nowrap active:scale-[0.96] transition-all group"
            >
              <QrCode className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground-primary shrink-0 transition-colors" strokeWidth={1.8} />
              <span>QR Code</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleAddField('svg', {
                  label: 'Logotipo SVG',
                  svgContent: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="none" stroke="black" stroke-width="6"/><path d="M30 50 L45 65 L70 35" stroke="black" stroke-width="6" fill="none"/></svg>`,
                })
              }
              className="btn-tactile h-7 px-2 text-[11px] font-medium text-foreground-primary hover:bg-surface-card rounded-[5px] flex items-center gap-1.5 whitespace-nowrap active:scale-[0.96] transition-all group"
            >
              <FileCode className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground-primary shrink-0 transition-colors" strokeWidth={1.8} />
              <span>SVG</span>
            </button>
          </div>

          {/* Lado Direito: Importar, Exportar, Salvar e Fechar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Input Oculto de Arquivo */}
            <input
              ref={importInputRef}
              type="file"
              accept=".folium,.json,.svg,.html,.htm"
              onChange={handleFileImport}
              className="hidden"
            />

            {/* Status temporário de importação */}
            {importStatus && (
              <div className="hidden 2xl:flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] bg-[#15803d]/10 border border-[#15803d]/20 text-[#15803d] text-[10.5px] font-medium animate-fadeIn whitespace-nowrap">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[140px]">{importStatus}</span>
              </div>
            )}

            {/* Botão Importar */}
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="btn-tactile h-7.5 bg-surface-subtle hover:bg-surface-card text-foreground-primary text-xs font-medium px-2 rounded-[6px] border border-border flex items-center gap-1.5 whitespace-nowrap active:scale-[0.97] transition-transform duration-instant"
              title="Importar modelo (.folium, .json, .svg, .html)"
            >
              <FileUp className="w-3.5 h-3.5 text-foreground-secondary shrink-0" strokeWidth={1.8} />
              <span className="hidden md:inline">Importar</span>
            </button>

            {/* Botão Exportar com Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsExportDropdownOpen((prev) => !prev)}
                className="btn-tactile h-7.5 bg-surface-subtle hover:bg-surface-card text-foreground-primary text-xs font-medium px-2 rounded-[6px] border border-border flex items-center gap-1 whitespace-nowrap active:scale-[0.97] transition-transform duration-instant"
                title="Exportar modelo"
                aria-expanded={isExportDropdownOpen}
              >
                <Download className="w-3.5 h-3.5 text-foreground-secondary shrink-0" strokeWidth={1.8} />
                <span className="hidden md:inline">Exportar</span>
                <ChevronDown className="w-3 h-3 text-foreground-muted shrink-0" />
              </button>

              {isExportDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsExportDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-48 apple-glass border border-black/[0.08] rounded-[8px] shadow-lg p-1 z-40 animate-modal-enter origin-top-right text-left">
                    <div className="px-2 py-1 text-[9.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                      Exportar arquivo
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExport('folium')}
                      className="btn-tactile w-full px-2 py-1.5 text-left rounded-[5px] hover:bg-black/[0.04] text-xs font-medium flex items-center justify-between text-foreground-primary"
                    >
                      <span>Modelo Folium</span>
                      <span className="text-[10px] font-mono text-foreground-muted font-normal">.folium</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport('json')}
                      className="btn-tactile w-full px-2 py-1.5 text-left rounded-[5px] hover:bg-black/[0.04] text-xs font-medium flex items-center justify-between text-foreground-primary"
                    >
                      <span>Arquivo JSON</span>
                      <span className="text-[10px] font-mono text-foreground-muted font-normal">.json</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport('html')}
                      className="btn-tactile w-full px-2 py-1.5 text-left rounded-[5px] hover:bg-black/[0.04] text-xs font-medium flex items-center justify-between text-foreground-primary"
                    >
                      <span>HTML Imprimível</span>
                      <span className="text-[10px] font-mono text-foreground-muted font-normal">.html</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="h-4 w-[1px] bg-border mx-0.5 shrink-0" aria-hidden="true" />

            <button
              type="button"
              onClick={handleSave}
              className="btn-tactile h-7.5 bg-[#111111] hover:bg-[#27272a] text-white text-xs font-medium px-2.5 rounded-[6px] border border-[#111111] flex items-center gap-1.5 whitespace-nowrap shadow-xs active:scale-95 transition-all shrink-0"
            >
              <Save className="w-3.5 h-3.5 text-white/90 shrink-0" strokeWidth={1.8} />
              <span>Salvar</span>
            </button>

            {/* Divisória de segurança antes do botão fechar */}
            <div className="h-4 w-[1px] bg-border mx-0.5 shrink-0" aria-hidden="true" />

            <button
              type="button"
              onClick={onClose}
              className="btn-tactile h-7.5 w-7.5 flex items-center justify-center text-foreground-muted hover:text-foreground-primary rounded-[6px] hover:bg-black/5 active:scale-90 transition-all shrink-0"
              title="Fechar editor (Esc)"
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
                <span className="text-[11px]">• Arraste as caixas com o mouse para posicionar</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <button
                  type="button"
                  onClick={() => setCanvasZoom((z) => Math.max(1.0, z - 0.25))}
                  className="btn-tactile w-6 h-6 rounded-[5px] bg-white border border-black/[0.08] shadow-2xs hover:bg-black/[0.03] flex items-center justify-center text-foreground-primary font-medium text-xs transition-colors"
                  title="Diminuir zoom"
                  aria-label="Diminuir zoom"
                >
                  -
                </button>
                <span className="px-1.5 text-xs text-foreground-primary font-semibold min-w-[42px] text-center" aria-label={`Zoom atual: ${Math.round(canvasZoom * 100)}%`}>
                  {Math.round(canvasZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setCanvasZoom((z) => Math.min(3.5, z + 0.25))}
                  className="btn-tactile w-6 h-6 rounded-[5px] bg-white border border-black/[0.08] shadow-2xs hover:bg-black/[0.03] flex items-center justify-center text-foreground-primary font-medium text-xs transition-colors"
                  title="Aumentar zoom"
                  aria-label="Aumentar zoom"
                >
                  +
                </button>
              </div>
            </div>

            {/* Visual Workspace Canvas */}
            <div className="flex-1 overflow-auto p-12 flex items-center justify-center">
              <div
                ref={canvasRef}
                style={{
                  width: `${widthMm * MM_TO_PX * canvasZoom}px`,
                  height: `${heightMm * MM_TO_PX * canvasZoom}px`,
                  backgroundColor: '#ffffff',
                }}
                className="relative shadow-2xl border border-black/15 select-none overflow-visible transition-[width,height] duration-snappy ease-out rounded-[2px]"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setSelectedFieldKey(null);
                  }
                }}
              >
                {/* Camada Interna de Contenção de Fundo (Grid e SVG) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[2px]">
                  {/* Background Millimeter Grid (Hierárquico: 2mm sutil + 10mm mestre) */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, rgba(0,0,0,0.025) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(0,0,0,0.025) 1px, transparent 1px),
                        linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)
                      `,
                      backgroundSize: `
                        ${2 * MM_TO_PX * canvasZoom}px ${2 * MM_TO_PX * canvasZoom}px,
                        ${2 * MM_TO_PX * canvasZoom}px ${2 * MM_TO_PX * canvasZoom}px,
                        ${10 * MM_TO_PX * canvasZoom}px ${10 * MM_TO_PX * canvasZoom}px,
                        ${10 * MM_TO_PX * canvasZoom}px ${10 * MM_TO_PX * canvasZoom}px
                      `,
                    }}
                  />

                  {/* Background SVG if configured */}
                  {backgroundSvg && (
                    <div
                      className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none"
                      style={{
                        opacity: backgroundSvgOpacity,
                        ...getSvgTransformStyle({
                          rotation: backgroundSvgRotation,
                          flipH: backgroundSvgFlipH,
                          flipV: backgroundSvgFlipV,
                        }),
                      }}
                      dangerouslySetInnerHTML={{
                        __html: applySvgAdjustments(backgroundSvg, {
                          fill: backgroundSvgFill,
                          stroke: backgroundSvgStroke,
                          strokeWidth: backgroundSvgStrokeWidth,
                        }),
                      }}
                    />
                  )}
                </div>

                {/* Dynamic Draggable Boxes */}
                {fields.map((field) => {
                  const isSelected = field.key === selectedFieldKey;
                  const xPx = (field.xMm ?? 0) * MM_TO_PX * canvasZoom;
                  const yPx = (field.yMm ?? 0) * MM_TO_PX * canvasZoom;
                  const wPx = (field.widthMm ?? 30) * MM_TO_PX * canvasZoom;
                  const hPx = (field.heightMm ?? 10) * MM_TO_PX * canvasZoom;

                  const vAlign = field.verticalAlign || ((field.heightMm ?? 8) >= 14 ? 'top' : 'middle');
                  const justifyClass = vAlign === 'top' ? 'justify-start pt-1' : vAlign === 'bottom' ? 'justify-end pb-1' : 'justify-center';

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
                      className={`group touch-none flex flex-col ${justifyClass} px-1.5 py-0.5 select-none relative transition-colors duration-instant ${
                        isSelected
                          ? 'border-[1.5px] border-[#3a86ff] z-30 shadow-xs'
                          : field.showBorder
                          ? 'border border-black/60 z-10'
                          : 'border border-transparent hover:border-[#3a86ff]/40 hover:bg-[#3a86ff]/[0.015] z-10'
                      }`}
                    >
                      {/* Box Dimension & Coordinate Badge (Com inversão inteligente se encostar no topo) */}
                      {isSelected && (
                        <div
                          className={`absolute left-1/2 -translate-x-1/2 bg-[#111111] text-white font-mono text-[9px] px-2 py-0.5 rounded-[5px] shadow-subtle flex items-center gap-1.5 whitespace-nowrap pointer-events-none z-50 transition-all ${
                            (field.yMm ?? 0) < 7 ? 'top-full mt-2.5' : '-top-7'
                          }`}
                        >
                          {field.locked && <Lock className="w-2.5 h-2.5 text-[#ef4444]" />}
                          <span className="font-semibold text-white">{field.widthMm} × {field.heightMm} mm</span>
                          <span className="text-white/60 text-[8px]">({field.xMm}, {field.yMm})</span>
                        </div>
                      )}

                      {/* 8 Alças de Redimensionamento Interativas (Cantos + Bordas) - Omitidas se a caixa for bloqueada */}
                      {isSelected && !field.locked && [
                        { handle: 'nw' as const, className: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize' },
                        { handle: 'n' as const, className: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize' },
                        { handle: 'ne' as const, className: 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize' },
                        { handle: 'e' as const, className: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-ew-resize' },
                        { handle: 'se' as const, className: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize' },
                        { handle: 's' as const, className: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize' },
                        { handle: 'sw' as const, className: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize' },
                        { handle: 'w' as const, className: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize' },
                      ].map(({ handle, className }) => (
                        <div
                          key={handle}
                          onPointerDown={(e) => handleResizePointerDown(e, handle, field)}
                          onPointerMove={handleResizePointerMove}
                          onPointerUp={handleResizePointerUp}
                          onPointerCancel={handleResizePointerUp}
                          className={`absolute w-2 h-2 bg-white border-[1.5px] border-[#3a86ff] rounded-[2px] shadow-xs z-40 hover:scale-125 transition-transform duration-instant ease-out ${className}`}
                        />
                      ))}

                      {/* Box Content Preview encapsulado em container com corte perfeito */}
                      <div className={`absolute inset-0 overflow-hidden pointer-events-none flex flex-col ${justifyClass} px-1.5 py-0.5 rounded-[1px]`}>
                        {field.type === 'svg' ? (
                          <div
                            className="w-full h-full flex items-center justify-center overflow-hidden"
                            style={getSvgTransformStyle({
                              rotation: field.svgRotation,
                              flipH: field.svgFlipH,
                              flipV: field.svgFlipV,
                            })}
                            dangerouslySetInnerHTML={{
                              __html: applySvgAdjustments(field.svgContent || '<svg></svg>', {
                                fill: field.svgFill,
                                stroke: field.svgStroke,
                                strokeWidth: field.svgStrokeWidth,
                              }),
                            }}
                          />
                        ) : field.type === 'qrcode' ? (
                          <div className="w-full h-full flex items-center justify-center overflow-hidden">
                            <QRCodeSvg value={String(field.defaultValue || '00000')} size={Math.min(wPx, hPx) * 0.9} />
                          </div>
                        ) : field.type === 'barcode' ? (
                          <div className="w-full h-full flex items-center justify-center overflow-hidden">
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
                              fontWeight: normalizeFontWeight(field.fontWeight, defaultFontWeight),
                            }}
                            className="w-full max-h-full overflow-hidden break-words whitespace-pre-wrap leading-tight text-black"
                          >
                            {field.showLabel && (
                              <span className="mr-1">
                                {field.label.endsWith(':') ? field.label : `${field.label}:`}
                              </span>
                            )}
                            <span>
                              {field.type === 'date' || field.isAutoDate
                                ? formatDate(new Date(), field.dateFormat, field.datePrefix)
                                : resolveCopyTokens(String(field.defaultValue || field.label), 1, 2, false)}
                            </span>
                          </div>
                        )}
                      </div>
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
                <Sliders className="w-3.5 h-3.5 text-[#3a86ff]" />
                <span>Dimensões Físicas</span>
              </span>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground-primary">Nome do Modelo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-black/[0.035] hover:bg-black/[0.05] focus:bg-white border border-border/80 focus:border-[#3a86ff] focus:ring-2 focus:ring-[#3a86ff]/15 rounded-[6px] text-foreground-primary outline-none transition-colors duration-instant"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] font-medium text-foreground-primary block mb-1">Largura (mm)</label>
                  <input
                    type="number"
                    min={20}
                    max={300}
                    value={widthMm}
                    onChange={(e) => setWidthMm(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-black/[0.035] hover:bg-black/[0.05] focus:bg-white border border-border/80 focus:border-[#3a86ff] focus:ring-2 focus:ring-[#3a86ff]/15 rounded-[6px] font-mono text-xs outline-none transition-colors duration-instant"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-foreground-primary block mb-1">Altura (mm)</label>
                  <input
                    type="number"
                    min={15}
                    max={400}
                    value={heightMm}
                    onChange={(e) => setHeightMm(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-black/[0.035] hover:bg-black/[0.05] focus:bg-white border border-border/80 focus:border-[#3a86ff] focus:ring-2 focus:ring-[#3a86ff]/15 rounded-[6px] font-mono text-xs outline-none transition-colors duration-instant"
                  />
                </div>
              </div>

              {/* Peso Padrão do Modelo */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-medium text-foreground-primary">Peso Padrão</span>
                <FontWeightControl
                  value={defaultFontWeight}
                  onChange={setDefaultFontWeight}
                  size="sm"
                  ariaLabel="Peso de texto padrão do modelo"
                />
              </div>

              {/* Background SVG Control */}
              <div className="pt-2 border-t border-border/60">
                <SvgPropertiesControl
                  label="SVG de Fundo / Moldura"
                  svgContent={backgroundSvg}
                  onChangeSvgContent={setBackgroundSvg}
                  fill={backgroundSvgFill}
                  onChangeFill={setBackgroundSvgFill}
                  stroke={backgroundSvgStroke}
                  onChangeStroke={setBackgroundSvgStroke}
                  strokeWidth={backgroundSvgStrokeWidth}
                  onChangeStrokeWidth={setBackgroundSvgStrokeWidth}
                  rotation={backgroundSvgRotation}
                  onChangeRotation={setBackgroundSvgRotation}
                  flipH={backgroundSvgFlipH}
                  onChangeFlipH={setBackgroundSvgFlipH}
                  flipV={backgroundSvgFlipV}
                  onChangeFlipV={setBackgroundSvgFlipV}
                  onFileUpload={(e) => handleSvgFileUpload(e, 'background')}
                  onRemove={backgroundSvg ? () => setBackgroundSvg('') : undefined}
                  showPreview={Boolean(backgroundSvg)}
                />
              </div>
            </div>

            {/* Selected Box Inspector Panel */}
            <div className="p-3 flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground-secondary flex items-center gap-1.5">
                  <span>Caixa Selecionada</span>
                  {selectedField?.locked && (
                    <span className="px-1.5 py-0.2 bg-[#ef4444]/10 text-[#ef4444] rounded text-[9.5px] font-medium flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      Bloqueada
                    </span>
                  )}
                </span>
                {selectedField && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleUpdateField(selectedField.key, { locked: !selectedField.locked })}
                      className={`btn-tactile p-1.5 rounded-[5px] transition-colors ${
                        selectedField.locked
                          ? 'text-[#ef4444] bg-[#ef4444]/10 hover:bg-[#ef4444]/15'
                          : 'text-foreground-secondary hover:text-foreground-primary hover:bg-black/[0.04]'
                      }`}
                      title={selectedField.locked ? 'Desbloquear caixa (permitir mover e dimensionar)' : 'Bloquear caixa (proteger contra movimentação e redimensionamento)'}
                      aria-label={selectedField.locked ? 'Desbloquear caixa' : 'Bloquear caixa'}
                    >
                      {selectedField.locked ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(selectedField.key)}
                      className="btn-tactile p-1.5 rounded-[5px] text-feedback-error hover:bg-feedback-error/10 transition-colors"
                      title="Excluir esta caixa"
                      aria-label="Excluir esta caixa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Seletor Rápido de Caixas */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground-primary block">
                  Alternar Caixa / Camada
                </label>
                <select
                  value={selectedFieldKey || ''}
                  onChange={(e) => setSelectedFieldKey(e.target.value || null)}
                  className="w-full text-xs px-2.5 py-1.5 bg-black/[0.035] hover:bg-black/[0.05] focus:bg-white border border-border/80 focus:border-[#3a86ff] focus:ring-2 focus:ring-[#3a86ff]/15 rounded-[6px] font-medium text-foreground-primary outline-none transition-colors duration-instant"
                >
                  <option value="">-- Selecione uma caixa --</option>
                  {fields.map((f, i) => (
                    <option key={f.key} value={f.key}>
                      #{i + 1}: {f.label} ({f.type}) {f.locked ? '🔒 [Bloqueada]' : `[${f.xMm}×${f.yMm}mm]`}
                    </option>
                  ))}
                </select>
              </div>

              {selectedField ? (
                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-[11px] font-medium text-foreground-primary block mb-1">
                      Nome / Rótulo do Campo
                    </label>
                    <input
                      type="text"
                      value={selectedField.label}
                      onChange={(e) => handleUpdateField(selectedField.key, { label: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-black/[0.035] hover:bg-black/[0.05] focus:bg-white border border-border/80 focus:border-[#3a86ff] focus:ring-2 focus:ring-[#3a86ff]/15 rounded-[6px] text-foreground-primary outline-none transition-colors duration-instant"
                    />
                  </div>

                  {/* Coordenadas X e Y em mm */}
                  <div className="p-2.5 bg-black/[0.02] rounded-[8px] border border-border/70 space-y-2">
                    <span className="text-[10px] font-bold text-foreground-secondary uppercase tracking-wider block">
                      Posicionamento Físico (mm)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-medium text-foreground-primary block mb-1">X (mm)</label>
                        <input
                          type="number"
                          step={0.5}
                          min={0}
                          max={widthMm}
                          value={selectedField.xMm ?? 0}
                          onChange={(e) =>
                            handleUpdateField(selectedField.key, { xMm: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2 py-1.5 bg-white border border-border/80 focus:border-[#3a86ff] focus:ring-2 focus:ring-[#3a86ff]/15 rounded-[6px] font-mono text-xs text-foreground-primary outline-none transition-colors duration-instant"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-foreground-primary block mb-1">Y (mm)</label>
                        <input
                          type="number"
                          step={0.5}
                          min={0}
                          max={heightMm}
                          value={selectedField.yMm ?? 0}
                          onChange={(e) =>
                            handleUpdateField(selectedField.key, { yMm: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2 py-1.5 bg-white border border-border/80 focus:border-[#3a86ff] focus:ring-2 focus:ring-[#3a86ff]/15 rounded-[6px] font-mono text-xs text-foreground-primary outline-none transition-colors duration-instant"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-medium text-foreground-primary block mb-1">Largura (mm)</label>
                        <input
                          type="number"
                          step={1}
                          min={5}
                          max={widthMm}
                          value={selectedField.widthMm ?? 30}
                          onChange={(e) =>
                            handleUpdateField(selectedField.key, { widthMm: parseFloat(e.target.value) || 10 })
                          }
                          className="w-full px-2 py-1.5 bg-white border border-border/80 focus:border-[#3a86ff] focus:ring-2 focus:ring-[#3a86ff]/15 rounded-[6px] font-mono text-xs text-foreground-primary outline-none transition-colors duration-instant"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-foreground-primary block mb-1">Altura (mm)</label>
                        <input
                          type="number"
                          step={1}
                          min={3}
                          max={heightMm}
                          value={selectedField.heightMm ?? 10}
                          onChange={(e) =>
                            handleUpdateField(selectedField.key, { heightMm: parseFloat(e.target.value) || 5 })
                          }
                          className="w-full px-2 py-1.5 bg-white border border-border/80 focus:border-[#3a86ff] focus:ring-2 focus:ring-[#3a86ff]/15 rounded-[6px] font-mono text-xs text-foreground-primary outline-none transition-colors duration-instant"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Configurações Tipográficas / Estilo */}
                  {selectedField.type !== 'qrcode' && selectedField.type !== 'svg' && (
                    <div className="space-y-2 p-2.5 bg-black/[0.02] rounded-[8px] border border-border/70">
                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="text-[10px] font-medium text-foreground-secondary block mb-1">Fonte (pt)</label>
                          <input
                            type="number"
                            step={0.5}
                            min={5}
                            max={36}
                            value={selectedField.fontSizePt ?? 9}
                            onChange={(e) =>
                              handleUpdateField(selectedField.key, { fontSizePt: parseFloat(e.target.value) || 9 })
                            }
                            className="w-full px-2 py-1.5 bg-white border border-border/80 focus:border-[#3a86ff] focus:ring-2 focus:ring-[#3a86ff]/15 rounded-[6px] font-mono text-xs outline-none transition-colors duration-instant"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-foreground-secondary block mb-1">Alinh. Horiz.</label>
                          <select
                            value={selectedField.textAlign || 'left'}
                            onChange={(e) =>
                              handleUpdateField(selectedField.key, { textAlign: e.target.value as any })
                            }
                            className="w-full px-1.5 py-1.5 bg-white border border-border/80 focus:border-[#3a86ff] focus:ring-2 focus:ring-[#3a86ff]/15 rounded-[6px] text-[11px] outline-none transition-colors duration-instant"
                          >
                            <option value="left">Esquerda</option>
                            <option value="center">Centro</option>
                            <option value="right">Direita</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-foreground-secondary block mb-1">Alinh. Vert.</label>
                          <select
                            value={selectedField.verticalAlign || ((selectedField.heightMm ?? 8) >= 14 ? 'top' : 'middle')}
                            onChange={(e) =>
                              handleUpdateField(selectedField.key, { verticalAlign: e.target.value as any })
                            }
                            className="w-full px-1.5 py-1.5 bg-white border border-border/80 focus:border-[#3a86ff] focus:ring-2 focus:ring-[#3a86ff]/15 rounded-[6px] text-[11px] outline-none transition-colors duration-instant"
                          >
                            <option value="top">Topo</option>
                            <option value="middle">Meio</option>
                            <option value="bottom">Base</option>
                          </select>
                        </div>
                      </div>

                      {/* Seletor de Peso da Fonte */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-black/[0.05]">
                        <span className="text-[10.5px] font-medium text-foreground-secondary">
                          Peso Tipográfico
                        </span>
                        <FontWeightControl
                          value={selectedField.fontWeight || defaultFontWeight}
                          onChange={(w) => handleUpdateField(selectedField.key, { fontWeight: w })}
                          size="sm"
                          ariaLabel={`Peso tipográfico para ${selectedField.label}`}
                        />
                      </div>
                    </div>
                  )}

                  {selectedField.type === 'svg' ? (
                    <SvgPropertiesControl
                      label="Propriedades do SVG"
                      svgContent={selectedField.svgContent || ''}
                      onChangeSvgContent={(content) => handleUpdateField(selectedField.key, { svgContent: content })}
                      fill={selectedField.svgFill || ''}
                      onChangeFill={(fill) => handleUpdateField(selectedField.key, { svgFill: fill })}
                      stroke={selectedField.svgStroke || ''}
                      onChangeStroke={(stroke) => handleUpdateField(selectedField.key, { svgStroke: stroke })}
                      strokeWidth={selectedField.svgStrokeWidth || 0}
                      onChangeStrokeWidth={(w) => handleUpdateField(selectedField.key, { svgStrokeWidth: w })}
                      rotation={selectedField.svgRotation || 0}
                      onChangeRotation={(rot) => handleUpdateField(selectedField.key, { svgRotation: rot })}
                      flipH={Boolean(selectedField.svgFlipH)}
                      onChangeFlipH={(flip) => handleUpdateField(selectedField.key, { svgFlipH: flip })}
                      flipV={Boolean(selectedField.svgFlipV)}
                      onChangeFlipV={(flip) => handleUpdateField(selectedField.key, { svgFlipV: flip })}
                      onFileUpload={(e) => handleSvgFileUpload(e, 'field')}
                      showPreview={true}
                    />
                  ) : selectedField.type === 'date' || selectedField.isAutoDate ? (
                    <DatePropertiesControl
                      dateFormat={selectedField.dateFormat || 'DD/MM/YYYY'}
                      onChangeDateFormat={(fmt) => handleUpdateField(selectedField.key, { dateFormat: fmt })}
                      datePrefix={selectedField.datePrefix || ''}
                      onChangeDatePrefix={(prefix) => handleUpdateField(selectedField.key, { datePrefix: prefix })}
                      isAutoDate={selectedField.isAutoDate !== false}
                      onChangeIsAutoDate={(auto) => handleUpdateField(selectedField.key, { isAutoDate: auto })}
                    />
                  ) : (
                    <div>
                      <label className="text-[11px] font-medium text-foreground-primary block mb-1">
                        Valor Padrão / Mock
                      </label>
                      <input
                        type="text"
                        value={selectedField.defaultValue ?? ''}
                        onChange={(e) =>
                          handleUpdateField(selectedField.key, { defaultValue: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 bg-black/[0.035] hover:bg-black/[0.05] focus:bg-white border border-border/80 focus:border-[#3a86ff] focus:ring-2 focus:ring-[#3a86ff]/15 rounded-[6px] font-mono text-xs text-foreground-primary outline-none transition-colors duration-instant"
                      />
                      {selectedField.type === 'text' && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] text-foreground-muted">Token dinâmico:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const cur = String(selectedField.defaultValue ?? '');
                              const token = '{copia}/{total}';
                              handleUpdateField(selectedField.key, {
                                defaultValue: cur ? `${cur} ${token}` : token,
                              });
                            }}
                            className="btn-tactile text-[9.5px] font-mono text-[#3a86ff] hover:bg-[#3a86ff]/10 px-1.5 py-0.5 rounded border border-[#3a86ff]/20 transition-colors"
                            title="Inserir identificador automático de cópia ({copia}/{total})"
                          >
                            +{'{copia}/{total}'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Checkbox Opções */}
                  <div className="pt-2 space-y-1.5 border-t border-border/60 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-foreground-primary">
                      <input
                        type="checkbox"
                        checked={selectedField.showBorder || false}
                        onChange={(e) =>
                          handleUpdateField(selectedField.key, { showBorder: e.target.checked })
                        }
                        className="rounded accent-[#111111]"
                      />
                      <span>Desenhar borda retangular na caixa</span>
                    </label>

                    {selectedField.type === 'text' && (
                      <>
                        <label className="flex items-center gap-2 cursor-pointer text-foreground-primary">
                          <input
                            type="checkbox"
                            checked={selectedField.showLabel || false}
                            onChange={(e) =>
                              handleUpdateField(selectedField.key, { showLabel: e.target.checked })
                            }
                            className="rounded accent-[#111111]"
                          />
                          <span>Exibir rótulo antes do valor impresso</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-foreground-primary">
                          <input
                            type="checkbox"
                            checked={selectedField.autoScaleFont !== false}
                            onChange={(e) =>
                              handleUpdateField(selectedField.key, { autoScaleFont: e.target.checked })
                            }
                            className="rounded accent-[#111111]"
                          />
                          <span>Ajustar tamanho da fonte ao redimensionar caixa</span>
                        </label>
                      </>
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
