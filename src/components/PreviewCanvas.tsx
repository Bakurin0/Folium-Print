import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Template, CalibrationOffset, TemplateFormData, ColorAdjustments, CropMarkSettings } from '../types/template';
import { Maximize2, Ruler, Eye, Scissors, Palette } from 'lucide-react';
import { generateCropMarksSvg } from '../utils/cropMarksGenerator';

interface PreviewCanvasProps {
  template: Template;
  formData: TemplateFormData;
  offset: CalibrationOffset;
  printContainerRef: React.RefObject<HTMLDivElement>;
  colorAdjustments?: ColorAdjustments;
  cropMarks?: CropMarkSettings;
}

export type ZoomMode = 'fit' | '100' | '150' | '200';

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  template,
  formData,
  offset,
  printContainerRef,
  colorAdjustments,
  cropMarks,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit');
  const [fitScale, setFitScale] = useState<number>(1);

  // Conversion: 1mm = 3.7795275591 px at standard screen resolution (96 DPI)
  const MM_TO_PX = 3.779528;
  const targetWidthPx = template.dimensions.widthMm * MM_TO_PX;
  const targetHeightPx = template.dimensions.heightMm * MM_TO_PX;

  // Calculate dynamic fit-to-view scale
  useEffect(() => {
    const updateFit = () => {
      if (!containerRef.current) return;
      const padding = 64; // px padding around canvas
      const availableWidth = containerRef.current.clientWidth - padding;
      const availableHeight = containerRef.current.clientHeight - padding;

      if (availableWidth <= 0 || availableHeight <= 0) return;

      const scaleX = availableWidth / targetWidthPx;
      const scaleY = availableHeight / targetHeightPx;
      const bestScale = Math.min(scaleX, scaleY, 1.6); // don't over-scale excessively on huge screens

      setFitScale(Math.max(0.2, bestScale));
    };

    updateFit();
    window.addEventListener('resize', updateFit);
    return () => window.removeEventListener('resize', updateFit);
  }, [targetWidthPx, targetHeightPx]);

  const getEffectiveScale = (): number => {
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
        return 1.0;
    }
  };

  const effectiveScale = getEffectiveScale();

  // Compute CSS Color Filter based on user adjustments & CMYK gamut simulation
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

  // Generate SVG Crop Marks Markup
  const cropMarksSvg = useMemo(() => {
    if (!cropMarks?.enabled) return '';
    return generateCropMarksSvg({
      widthMm: template.dimensions.widthMm,
      heightMm: template.dimensions.heightMm,
      grid: template.grid,
      settings: cropMarks,
    });
  }, [template, cropMarks]);

  return (
    <div className="relative w-full h-full flex flex-col bg-surface-canvas overflow-hidden select-none">
      {/* Top Floating Info & Zoom Controls */}
      <div className="absolute top-3.5 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        {/* Physical Dimension Badge & Active Indicators */}
        <div className="pointer-events-auto flex items-center gap-1.5 flex-wrap">
          <div className="bg-surface-card border border-border px-2.5 py-1 rounded-[6px] flex items-center gap-2 text-xs shadow-xs">
            <Ruler className="w-3.5 h-3.5 text-foreground-muted" strokeWidth={1.8} />
            <span className="font-medium text-foreground-primary">
              {template.dimensions.widthMm} × {template.dimensions.heightMm} mm
            </span>
            <span className="text-foreground-muted text-[10px] font-mono">
              ({Math.round(targetWidthPx)} × {Math.round(targetHeightPx)} px)
            </span>
            {template.grid && (
              <span className="bg-pastel-violet-bg text-pastel-violet-text border border-pastel-violet-border text-[9px] font-mono px-1.5 py-0.2 rounded-[4px] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-violet" />
                <span>Grade {template.grid.rows}×{template.grid.cols}</span>
              </span>
            )}
          </div>

          {/* CMYK badge indicator */}
          {colorAdjustments?.mode === 'cmyk-simulated' && (
            <div className="bg-surface-card border border-pastel-violet-border text-pastel-violet-text px-2 py-1 rounded-[6px] text-[10px] font-mono font-medium flex items-center gap-1 shadow-xs">
              <Palette className="w-3 h-3 text-pastel-violet-text" />
              <span>CMYK FOGRA39</span>
            </div>
          )}

          {/* Crop marks active badge */}
          {cropMarks?.enabled && (
            <div className="bg-surface-card border border-border text-foreground-secondary px-2 py-1 rounded-[6px] text-[10px] font-mono font-medium flex items-center gap-1 shadow-xs">
              <Scissors className="w-3 h-3 text-foreground-muted" />
              <span>Marcas de Corte ({cropMarks.bleedMm}mm)</span>
            </div>
          )}
        </div>

        {/* Zoom Controls Toolbar em material Apple Glass */}
        <div className="pointer-events-auto apple-glass border border-border/80 p-0.5 rounded-[7px] flex items-center gap-0.5 text-xs shadow-xs">
          <button
            type="button"
            onClick={() => setZoomMode('fit')}
            className={`btn-tactile px-2 py-0.5 rounded-[5px] text-xs font-medium flex items-center gap-1 ${
              zoomMode === 'fit'
                ? 'bg-[#111111] text-white'
                : 'text-foreground-secondary hover:text-foreground-primary hover:bg-surface-subtle/80'
            }`}
            title="Ajustar automaticamente ao espaço disponível"
          >
            <Maximize2 className="w-3 h-3" strokeWidth={1.8} />
            <span>Ajustar ({Math.round(fitScale * 100)}%)</span>
          </button>

          <button
            type="button"
            onClick={() => setZoomMode('100')}
            className={`btn-tactile px-2 py-0.5 rounded-[5px] text-xs font-mono font-medium ${
              zoomMode === '100'
                ? 'bg-[#111111] text-white'
                : 'text-foreground-secondary hover:text-foreground-primary hover:bg-surface-subtle/80'
            }`}
            title="Escala física real 1:1 (96 DPI)"
          >
            100%
          </button>

          <button
            type="button"
            onClick={() => setZoomMode('150')}
            className={`btn-tactile px-2 py-0.5 rounded-[5px] text-xs font-mono font-medium ${
              zoomMode === '150'
                ? 'bg-[#111111] text-white'
                : 'text-foreground-secondary hover:text-foreground-primary hover:bg-surface-subtle/80'
            }`}
          >
            150%
          </button>

          <button
            type="button"
            onClick={() => setZoomMode('200')}
            className={`btn-tactile px-2 py-0.5 rounded-[5px] text-xs font-mono font-medium ${
              zoomMode === '200'
                ? 'bg-[#111111] text-white'
                : 'text-foreground-secondary hover:text-foreground-primary hover:bg-surface-subtle/80'
            }`}
          >
            200%
          </button>
        </div>
      </div>

      {/* Viewport Canvas (Center Area) */}
      <div
        ref={containerRef}
        className="w-full flex-1 flex items-center justify-center p-8 overflow-auto"
      >
        <div
          style={{
            transform: `scale(${effectiveScale})`,
            transformOrigin: 'center center',
            transition: 'transform 240ms cubic-bezier(0.23, 1, 0.32, 1)',
          }}
          className="shrink-0 relative shadow-subtle rounded-none border border-border"
        >
          {/* Real Paper Canvas */}
          <div
            ref={printContainerRef}
            style={{
              width: `${template.dimensions.widthMm}mm`,
              height: `${template.dimensions.heightMm}mm`,
              backgroundColor: '#ffffff',
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden',
              filter: colorFilter,
            }}
          >
            {template.render({
              data: formData,
              offset: offset,
              isPreview: true,
            })}

            {/* SVG Crop Marks Overlay */}
            {cropMarksSvg && (
              <div
                className="absolute inset-0 pointer-events-none"
                dangerouslySetInnerHTML={{ __html: cropMarksSvg }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Sub-info: WYSIWYG & Calibration hint com material Apple Glass flutuante */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-foreground-muted pointer-events-none">
        <div className="flex items-center gap-1.5 apple-glass px-2.5 py-1 rounded-[7px] border border-border/80 shadow-xs">
          <Eye className="w-3 h-3 text-feedback-success" strokeWidth={1.8} />
          <span>WYSIWYG Pixel-Perfect • Vetores SVG nítidos sem distorção</span>
        </div>
        {(offset.offsetX !== 0 || offset.offsetY !== 0) && (
          <div className="apple-glass text-pastel-gold-text border border-pastel-gold-border px-2.5 py-1 rounded-[7px] font-mono text-[10px] flex items-center gap-1.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-gold" />
            <span>Offset aplicado: X={offset.offsetX > 0 ? `+${offset.offsetX}` : offset.offsetX}mm, Y={offset.offsetY > 0 ? `+${offset.offsetY}` : offset.offsetY}mm</span>
          </div>
        )}
      </div>
    </div>
  );
};
