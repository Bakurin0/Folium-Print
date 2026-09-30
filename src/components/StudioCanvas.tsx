import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Template, 
  TemplateField,
  CalibrationOffset, 
  TemplateFormData, 
  ColorAdjustments, 
  CropMarkSettings 
} from '../types/template';
import { generateCropMarksSvg } from '../utils/cropMarksGenerator';
import { sanitizeSvg } from '../utils/sanitizeSvg';
import { MM_TO_PX } from '../utils/units';
import { Layers, Plus, ChevronLeft, ChevronRight, Copy, Lock, Home } from 'lucide-react';

interface StudioCanvasProps {
  template: Template | null;
  formData: TemplateFormData;
  offset: CalibrationOffset;
  printContainerRef?: React.RefObject<HTMLDivElement>;
  colorAdjustments?: ColorAdjustments;
  cropMarks?: CropMarkSettings;
  onCreateTemplate?: () => void;
  onOpenHome?: () => void;
  onUpdateTemplateFields?: (fields: TemplateField[]) => void;
}

export type ZoomMode = 'fit' | '100' | '150' | '200';

/**
 * Studio Canvas - Prancheta de Visualização WYSIWYG
 * Focada na fidelidade da folha física com controles ágeis de zoom, centralização e manipulação magnética direta.
 */
export const StudioCanvas: React.FC<StudioCanvasProps> = ({
  template,
  formData,
  offset,
  printContainerRef,
  colorAdjustments,
  cropMarks,
  onCreateTemplate,
  onOpenHome,
  onUpdateTemplateFields,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const paperRef = useRef<HTMLDivElement | null>(null);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit');
  const [fitScale, setFitScale] = useState<number>(1);
  const [previewCopyIndex, setPreviewCopyIndex] = useState<number>(1);

  const totalThermalCopies = Number(formData._thermalCopies ?? 1);
  const effectivePreviewIndex = Math.min(Math.max(1, previewCopyIndex), Math.max(1, totalThermalCopies));

  const widthMm = template?.dimensions.widthMm ?? 100;
  const heightMm = template?.dimensions.heightMm ?? 50;
  const targetWidthPx = widthMm * MM_TO_PX;
  const targetHeightPx = heightMm * MM_TO_PX;

  // 1. Zoom Dinâmico "Fit to View"
  useEffect(() => {
    const updateFit = () => {
      if (!scrollContainerRef.current || !template) return;
      const padding = 80;
      const availableWidth = scrollContainerRef.current.clientWidth - padding;
      const availableHeight = scrollContainerRef.current.clientHeight - padding;

      if (availableWidth <= 0 || availableHeight <= 0) return;

      const scaleX = availableWidth / targetWidthPx;
      const scaleY = availableHeight / targetHeightPx;
      const bestScale = Math.min(scaleX, scaleY, 1.8);

      setFitScale(Math.max(0.2, bestScale));
    };

    updateFit();
    window.addEventListener('resize', updateFit, { passive: true });
    return () => window.removeEventListener('resize', updateFit);
  }, [targetWidthPx, targetHeightPx, template]);

  const effectiveScale = useMemo(() => {
    switch (zoomMode) {
      case 'fit':
        return fitScale;
      case '100':
        return 1.0;
      case '150':
        return 1.5;
      case '200':
        return 2.0;
      default:
        return fitScale;
    }
  }, [zoomMode, fitScale]);

  // 2. Filtro gráfico de cores
  const colorFilter = useMemo(() => {
    if (!colorAdjustments) return 'none';
    const b = 1 + (colorAdjustments.brightness || 0) / 100;
    const c = 1 + (colorAdjustments.contrast || 0) / 100;
    const s = 1 + (colorAdjustments.saturation || 0) / 100;
    const cmykEffect =
      colorAdjustments.mode === 'cmyk-simulated'
        ? 'sepia(0.04) hue-rotate(-2deg)'
        : '';
    return `brightness(${b}) contrast(${c}) saturate(${s}) ${cmykEffect}`.trim();
  }, [colorAdjustments]);

  // 3. SVG de Marcas de Corte higienizado
  const cropMarksSvg = useMemo(() => {
    if (!cropMarks?.enabled || !template) return '';
    return sanitizeSvg(
      generateCropMarksSvg({
        widthMm: template.dimensions.widthMm,
        heightMm: template.dimensions.heightMm,
        grid: template.grid,
        settings: cropMarks,
      })
    );
  }, [template, cropMarks]);

  // 4. Manipulação Magnética Direta no Canvas (Emil Kowalski Design Engineering & Fluid Interfaces)
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [hoveredFieldKey, setHoveredFieldKey] = useState<string | null>(null);
  const [activeDraggingKey, setActiveDraggingKey] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{
    mouseX: number;
    mouseY: number;
    initX: number;
    initY: number;
  } | null>(null);
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
  const [activeGuides, setActiveGuides] = useState<{ x?: number; y?: number }>({});

  const handlePointerDownBox = (e: React.PointerEvent<HTMLDivElement>, field: TemplateField) => {
    if (!onUpdateTemplateFields) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedFieldKey(field.key);
    if (field.locked) return; // Não arrasta caixas bloqueadas
    setActiveDraggingKey(field.key);
    setDragOffset({
      mouseX: e.clientX,
      mouseY: e.clientY,
      initX: field.xMm ?? 0,
      initY: field.yMm ?? 0,
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMoveBox = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!activeDraggingKey || !dragOffset || !template || !onUpdateTemplateFields) return;

      const deltaPixelX = e.clientX - dragOffset.mouseX;
      const deltaPixelY = e.clientY - dragOffset.mouseY;

      // Converter variação em pixels para milímetros baseando-se no zoom atual
      const deltaMmX = deltaPixelX / (MM_TO_PX * effectiveScale);
      const deltaMmY = deltaPixelY / (MM_TO_PX * effectiveScale);

      const movingField = template.fields.find((f) => f.key === activeDraggingKey);
      const fieldW = movingField?.widthMm ?? 30;
      const fieldH = movingField?.heightMm ?? 8;

      let rawX = dragOffset.initX + deltaMmX;
      let rawY = dragOffset.initY + deltaMmY;

      // Grade Magnética: Encaixe a cada 0.5 mm
      let snappedX = Math.round(rawX * 2) / 2;
      let snappedY = Math.round(rawY * 2) / 2;

      // Smart Guides & Magnetismo Inteligente com Bordas e Centro da Folha
      const magneticThreshold = 1.0; // 1 mm de raio magnético
      const detectedGuides: { x?: number; y?: number } = {};

      // Alinhamento com a borda esquerda da folha
      if (Math.abs(snappedX - 0) <= magneticThreshold) {
        snappedX = 0;
        detectedGuides.x = 0;
      }
      // Alinhamento com a borda direita da folha
      if (Math.abs(snappedX + fieldW - widthMm) <= magneticThreshold) {
        snappedX = widthMm - fieldW;
        detectedGuides.x = widthMm;
      }
      // Alinhamento central horizontal da folha
      const centerX = (widthMm - fieldW) / 2;
      if (Math.abs(snappedX - centerX) <= magneticThreshold) {
        snappedX = Math.round(centerX * 2) / 2;
        detectedGuides.x = widthMm / 2;
      }

      // Alinhamento com a borda superior da folha
      if (Math.abs(snappedY - 0) <= magneticThreshold) {
        snappedY = 0;
        detectedGuides.y = 0;
      }
      // Alinhamento com a borda inferior da folha
      if (Math.abs(snappedY + fieldH - heightMm) <= magneticThreshold) {
        snappedY = heightMm - fieldH;
        detectedGuides.y = heightMm;
      }
      // Alinhamento central vertical da folha
      const centerY = (heightMm - fieldH) / 2;
      if (Math.abs(snappedY - centerY) <= magneticThreshold) {
        snappedY = Math.round(centerY * 2) / 2;
        detectedGuides.y = heightMm / 2;
      }

      // Snap magnético com outras caixas irmãs
      template.fields.forEach((other) => {
        if (other.key === activeDraggingKey) return;
        const ox = other.xMm ?? 0;
        const oy = other.yMm ?? 0;
        const ow = other.widthMm ?? 30;
        const oh = other.heightMm ?? 8;

        // Alinhamento à esquerda
        if (Math.abs(snappedX - ox) <= magneticThreshold) {
          snappedX = ox;
          detectedGuides.x = ox;
        }
        // Alinhamento à direita
        if (Math.abs(snappedX + fieldW - (ox + ow)) <= magneticThreshold) {
          snappedX = ox + ow - fieldW;
          detectedGuides.x = ox + ow;
        }
        // Alinhamento ao topo
        if (Math.abs(snappedY - oy) <= magneticThreshold) {
          snappedY = oy;
          detectedGuides.y = oy;
        }
        // Alinhamento à base
        if (Math.abs(snappedY + fieldH - (oy + oh)) <= magneticThreshold) {
          snappedY = oy + oh - fieldH;
          detectedGuides.y = oy + oh;
        }
      });

      // Limitar aos contornos da folha
      const clampedX = Math.max(0, Math.min(widthMm - fieldW, snappedX));
      const clampedY = Math.max(0, Math.min(heightMm - fieldH, snappedY));

      setActiveGuides(detectedGuides);

      const updatedFields = template.fields.map((f) =>
        f.key === activeDraggingKey ? { ...f, xMm: clampedX, yMm: clampedY } : f
      );
      onUpdateTemplateFields(updatedFields);
    },
    [activeDraggingKey, dragOffset, template, onUpdateTemplateFields, effectiveScale, widthMm, heightMm]
  );

  const handlePointerUpBox = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setActiveDraggingKey(null);
    setDragOffset(null);
    setActiveGuides({});
  };

  // Redimensionamento com 8 alças no Canvas
  const handleResizePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    handle: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w',
    field: TemplateField
  ) => {
    if (!onUpdateTemplateFields) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedFieldKey(field.key);
    if (field.locked) return; // Não redimensiona caixas bloqueadas
    setResizing({
      handle,
      mouseX: e.clientX,
      mouseY: e.clientY,
      initX: field.xMm ?? 0,
      initY: field.yMm ?? 0,
      initW: field.widthMm ?? 30,
      initH: field.heightMm ?? 8,
      initFontSize: field.fontSizePt ?? 9,
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleResizePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!resizing || !selectedFieldKey || !template || !onUpdateTemplateFields) return;

      const deltaPixelX = e.clientX - resizing.mouseX;
      const deltaPixelY = e.clientY - resizing.mouseY;

      const deltaMmX = deltaPixelX / (MM_TO_PX * effectiveScale);
      const deltaMmY = deltaPixelY / (MM_TO_PX * effectiveScale);

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

      // Encaixe magnético na grade de 0.5 mm
      newX = Math.round(newX * 2) / 2;
      newY = Math.round(newY * 2) / 2;
      newW = Math.round(newW * 2) / 2;
      newH = Math.round(newH * 2) / 2;

      // Escalar proporcionalmente o tamanho da fonte apenas quando autoScaleFont for explicitamente ativado,
      // respeitando um teto de segurança (máx 16pt) para evitar distorção tipográfica em etiquetas térmicas.
      const targetField = template.fields.find((f) => f.key === selectedFieldKey);
      let calculatedFontSizePt: number | undefined = undefined;
      if (
        targetField &&
        targetField.autoScaleFont === true &&
        targetField.type !== 'barcode' &&
        targetField.type !== 'qrcode' &&
        targetField.type !== 'svg'
      ) {
        const ratio = newH / initH;
        if (initFontSize > 0) {
          const maxHeightPt = Math.floor(newH * 2.83 * 0.75);
          const scaledPt = Math.round(initFontSize * ratio * 2) / 2;
          calculatedFontSizePt = Math.max(5, Math.min(maxHeightPt, 16, scaledPt));
        }
      }

      const updatedFields = template.fields.map((f) =>
        f.key === selectedFieldKey
          ? {
              ...f,
              xMm: newX,
              yMm: newY,
              widthMm: newW,
              heightMm: newH,
              ...(calculatedFontSizePt ? { fontSizePt: calculatedFontSizePt } : {}),
            }
          : f
      );
      onUpdateTemplateFields(updatedFields);
    },
    [resizing, selectedFieldKey, template, onUpdateTemplateFields, effectiveScale, widthMm, heightMm]
  );

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setResizing(null);
  };

  return (
    <div
      role="region"
      aria-label="Área de visualização da folha de impressão"
      className="relative flex-1 h-full w-full bg-[#f2f2f4] overflow-hidden flex flex-col select-none"
    >
      {/* Viewport de Rolagem e Centralização da Folha */}
      <div
        ref={scrollContainerRef}
        className="flex-1 h-full overflow-auto p-8 flex items-center justify-center relative"
      >
        {template ? (
          <div
            style={{
              transform: `scale(${effectiveScale})`,
              transformOrigin: 'center center',
              transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="shrink-0 relative my-auto mx-auto"
          >
            {/* Folha Física de Papel */}
            <div
              ref={(node) => {
                paperRef.current = node;
                if (printContainerRef && 'current' in printContainerRef) {
                  (printContainerRef as any).current = node;
                }
              }}
              style={{
                width: `${widthMm}mm`,
                height: `${heightMm}mm`,
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'visible',
                filter: colorFilter,
              }}
              className="apple-paper-shadow rounded-none"
            >
              {/* Renderização WYSIWYG do Modelo */}
              <div className="w-full h-full relative overflow-hidden pointer-events-none">
                {template.render({
                  data: formData,
                  offset: offset,
                  isPreview: true,
                  copyIndex: effectivePreviewIndex,
                  copyTotal: totalThermalCopies,
                  hideSingleCopy: formData._hideSingleCopy !== false,
                })}
              </div>

              {/* Camada Interativa Direta para Manipulação das Caixas (Direct Manipulation 1:1) */}
              {onUpdateTemplateFields && !template.grid && (
                <div
                  className="absolute inset-0 z-10 pointer-events-auto"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setSelectedFieldKey(null);
                    }
                  }}
                >
                  {/* Guia visual sutil de Margem de Segurança (Safe Area de 2mm para cabeçotes térmicos) */}
                  <div
                    className="absolute pointer-events-none border border-dashed border-[#3a86ff]/20 rounded-[1px]"
                    style={{
                      left: '2mm',
                      top: '2mm',
                      right: '2mm',
                      bottom: '2mm',
                    }}
                    title="Margem técnica recomendada de 2mm"
                  />

                  {template.fields.map((field) => {
                    const isSelected = selectedFieldKey === field.key;
                    const isDraggingThis = activeDraggingKey === field.key;
                    const isResizingThis = resizing !== null && isSelected;
                    const isHoveredThis = hoveredFieldKey === field.key && !activeDraggingKey && !resizing;
                    const fx = field.xMm ?? 0;
                    const fy = field.yMm ?? 0;
                    const fw = field.widthMm ?? 30;
                    const fh = field.heightMm ?? 8;

                    return (
                      <div
                        key={field.key}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFieldKey(field.key);
                        }}
                        onPointerDown={(e) => handlePointerDownBox(e, field)}
                        onPointerMove={handlePointerMoveBox}
                        onPointerUp={handlePointerUpBox}
                        onPointerCancel={handlePointerUpBox}
                        onPointerEnter={() => setHoveredFieldKey(field.key)}
                        onPointerLeave={() => {
                          if (!activeDraggingKey) setHoveredFieldKey(null);
                        }}
                        style={{
                          position: 'absolute',
                          left: `${fx}mm`,
                          top: `${fy}mm`,
                          width: `${fw}mm`,
                          height: `${fh}mm`,
                          cursor: field.locked ? 'default' : isDraggingThis ? 'grabbing' : 'grab',
                        }}
                        title={field.locked ? `Caixa bloqueada: "${field.label}"` : `Arrastar "${field.label}" (${fx.toFixed(1)}mm, ${fy.toFixed(1)}mm)`}
                        className={`touch-none select-none rounded-[3px] transition-colors duration-instant ${
                          isSelected
                            ? field.locked
                              ? 'ring-1.5 ring-[#ef4444]/70 bg-[#ef4444]/[0.04] z-30 shadow-xs'
                              : 'ring-1.5 ring-[#3a86ff] bg-[#3a86ff]/[0.06] z-30 shadow-xs'
                            : isDraggingThis
                            ? 'ring-1.5 ring-[#3a86ff] bg-[#3a86ff]/[0.08] shadow-sm z-30'
                            : isHoveredThis
                            ? field.locked
                              ? 'ring-1 ring-[#ef4444]/40 bg-[#ef4444]/[0.02] z-20'
                              : 'ring-1 ring-[#3a86ff]/60 bg-[#3a86ff]/[0.03] z-20'
                            : 'hover:ring-1 hover:ring-black/10 z-10'
                        }`}
                      >
                        {/* Badge de Dimensões e Posição (visível ao selecionar, arrastar ou redimensionar) */}
                        {(isSelected || isDraggingThis || isResizingThis) && (
                          <div
                            className={`absolute left-1/2 -translate-x-1/2 bg-[#111111] text-white font-mono text-[9px] px-2 py-0.5 rounded-[5px] shadow-subtle flex items-center gap-1.5 whitespace-nowrap pointer-events-none z-50 transition-all ${
                              fy < 7 ? 'top-full mt-2.5' : '-top-7'
                            }`}
                          >
                            {field.locked && <Lock className="w-2.5 h-2.5 text-[#ef4444]" />}
                            <span className="font-semibold text-white">{fw.toFixed(1)} × {fh.toFixed(1)} mm</span>
                            <span className="text-white/60 text-[8px]">({fx.toFixed(1)}, {fy.toFixed(1)})</span>
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
                            className={`absolute w-2 h-2 bg-white border-[1.5px] border-[#3a86ff] rounded-[2px] shadow-xs z-40 hover:scale-125 transition-transform duration-100 ease-out ${className}`}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Guias Magnéticas Inteligentes (Smart Guides) */}
              {activeDraggingKey && (
                <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
                  {typeof activeGuides.x === 'number' && (
                    <div
                      style={{ left: `${activeGuides.x}mm` }}
                      className="absolute top-0 bottom-0 w-[1px] bg-[#3a86ff] shadow-[0_0_4px_rgba(58,134,255,0.6)]"
                    />
                  )}
                  {typeof activeGuides.y === 'number' && (
                    <div
                      style={{ top: `${activeGuides.y}mm` }}
                      className="absolute left-0 right-0 h-[1px] bg-[#3a86ff] shadow-[0_0_4px_rgba(58,134,255,0.6)]"
                    />
                  )}
                </div>
              )}

              {/* Overlay Seguro de Marcas de Corte */}
              {cropMarksSvg && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  dangerouslySetInnerHTML={{ __html: cropMarksSvg }}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4 p-8 max-w-sm apple-glass rounded-[16px] border border-black/[0.08] shadow-subtle my-auto animate-modal-enter">
            <div className="w-12 h-12 rounded-full bg-surface-subtle border border-black/[0.06] flex items-center justify-center mx-auto text-foreground-muted">
              <Layers className="w-5 h-5 text-[#3a86ff]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground-primary">Nenhum modelo selecionado</h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Selecione um modelo na barra lateral à esquerda ou crie uma etiqueta personalizada para começar.
              </p>
            </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                {onOpenHome && (
                  <button
                    type="button"
                    onClick={onOpenHome}
                    className="btn-tactile bg-[#111111] hover:bg-[#27272a] text-white text-xs font-semibold py-1.5 px-3.5 rounded-[7px] border border-[#111111] flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Ir para o Início</span>
                  </button>
                )}

                {onCreateTemplate && (
                  <button
                    type="button"
                    onClick={onCreateTemplate}
                    className="btn-tactile bg-white hover:bg-black/[0.04] text-foreground-primary text-xs font-medium py-1.5 px-3.5 rounded-[7px] border border-border flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
                    <span>Criar Novo Modelo</span>
                  </button>
                )}
              </div>
          </div>
        )}
      </div>

      {/* Pílula Flutuante de Zoom e Medidas no Rodapé (Visível apenas com documento ativo) */}
      {template && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-fadeIn">
          <nav
            aria-label="Controles de Visualização e Zoom"
            className="pointer-events-auto apple-glass border border-black/[0.08] px-2.5 py-1 rounded-[10px] shadow-subtle flex items-center gap-2.5 text-xs backdrop-blur-xl"
          >
            {/* Dimensões Reais da Folha */}
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-foreground-secondary pr-2.5 border-r border-border/80 whitespace-nowrap shrink-0 select-none">
              <span>{template.dimensions.widthMm} × {template.dimensions.heightMm} mm</span>
            </div>

            {/* Navegador de Cópias Térmicas (Lote) */}
            {!template.grid && totalThermalCopies > 1 && (
              <div className="flex items-center gap-1 pr-2.5 border-r border-border/80 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => setPreviewCopyIndex((p) => Math.max(1, p - 1))}
                  disabled={effectivePreviewIndex <= 1}
                  className="btn-tactile p-0.5 rounded hover:bg-black/[0.06] text-foreground-secondary hover:text-foreground-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Cópia anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-foreground-primary px-1 whitespace-nowrap">
                  <Copy className="w-3 h-3 text-[#3a86ff] shrink-0" />
                  <span>
                    {effectivePreviewIndex} de {totalThermalCopies}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewCopyIndex((p) => Math.min(totalThermalCopies, p + 1))}
                  disabled={effectivePreviewIndex >= totalThermalCopies}
                  className="btn-tactile p-0.5 rounded hover:bg-black/[0.06] text-foreground-secondary hover:text-foreground-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Próxima cópia"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Modos de Zoom */}
            <div className="flex items-center gap-0.5">
              {(['fit', '100', '150', '200'] as ZoomMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setZoomMode(mode)}
                  aria-pressed={zoomMode === mode}
                  className={`btn-tactile px-2 py-0.5 rounded-[5px] text-[11px] font-mono transition-colors ${
                    zoomMode === mode
                      ? 'bg-[#111111] text-white font-semibold shadow-xs'
                      : 'text-foreground-secondary hover:text-foreground-primary hover:bg-black/[0.04]'
                  }`}
                >
                  {mode === 'fit' ? 'Ajustar' : `${mode}%`}
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
};
