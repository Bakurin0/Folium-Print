import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Template, 
  CalibrationOffset, 
  TemplateFormData, 
  ColorAdjustments, 
  CropMarkSettings 
} from '../types/template';
import { Ruler } from './Ruler';
import { generateCropMarksSvg } from '../utils/cropMarksGenerator';
import { sanitizeSvg } from '../utils/sanitizeSvg';
import { MM_TO_PX } from '../utils/units';
import { Ruler as RulerIcon, Eye, Check } from 'lucide-react';

interface StudioCanvasProps {
  template: Template | null;
  formData: TemplateFormData;
  offset: CalibrationOffset;
  printContainerRef?: React.RefObject<HTMLDivElement>;
  colorAdjustments?: ColorAdjustments;
  cropMarks?: CropMarkSettings;
}

export type ZoomMode = 'fit' | '100' | '150' | '200';

/**
 * Studio Canvas no padrão Apple Pages / macOS Studio Workspace.
 * Inclui réguas milimétricas integradas, rastreamento de cursor em tempo real,
 * papel com física de profundidade e toolbar de zoom em vidro translúcido.
 */
export const StudioCanvas: React.FC<StudioCanvasProps> = ({
  template,
  formData,
  offset,
  printContainerRef,
  colorAdjustments,
  cropMarks,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const paperRef = useRef<HTMLDivElement | null>(null);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit');
  const [fitScale, setFitScale] = useState<number>(1);
  const [showRulers, setShowRulers] = useState<boolean>(true);
  const [cursorPosMm, setCursorPosMm] = useState<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });

  const widthMm = template?.dimensions.widthMm ?? 100;
  const heightMm = template?.dimensions.heightMm ?? 50;
  const targetWidthPx = widthMm * MM_TO_PX;
  const targetHeightPx = heightMm * MM_TO_PX;

  // 1. Cálculo dinâmico do Zoom "Fit to View"
  useEffect(() => {
    const updateFit = () => {
      if (!viewportRef.current || !template) return;
      const padding = 72; // Espaço de respiro
      const availableWidth = viewportRef.current.clientWidth - padding;
      const availableHeight = viewportRef.current.clientHeight - padding;

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

  // 2. Filtro de cores para simulação de perfil FOGRA39 / CMYK
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

  // 4. Rastreamento do cursor do mouse em coordenadas milimétricas reais
  const handlePaperMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!paperRef.current) return;
      const rect = paperRef.current.getBoundingClientRect();
      const xPx = e.clientX - rect.left;
      const yPx = e.clientY - rect.top;

      const xMm = xPx / (MM_TO_PX * effectiveScale);
      const yMm = yPx / (MM_TO_PX * effectiveScale);

      setCursorPosMm({
        x: Math.max(0, Math.min(widthMm, xMm)),
        y: Math.max(0, Math.min(heightMm, yMm)),
      });
    },
    [effectiveScale, widthMm, heightMm]
  );

  const handlePaperMouseLeave = useCallback(() => {
    setCursorPosMm({ x: null, y: null });
  }, []);

  return (
    <div
      ref={viewportRef}
      role="region"
      aria-label="Área de trabalho de impressão"
      className="relative flex-1 h-full w-full bg-surface-canvas overflow-auto flex flex-col select-none"
    >
      {/* 1. Barra Flutuante de Informações de Medida (Top-Left) */}
      {template && (
        <div className="absolute top-3 left-4 z-20 pointer-events-none flex items-center gap-2">
          <div className="pointer-events-auto apple-glass border border-border/80 px-2.5 py-1 rounded-[6px] shadow-xs flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3a86ff]" />
            <span className="font-semibold text-foreground-primary">
              {template.dimensions.widthMm} × {template.dimensions.heightMm} mm
            </span>
            <span className="text-foreground-muted font-mono text-[10px]">
              ({Math.round(targetWidthPx)} × {Math.round(targetHeightPx)} px)
            </span>
            {cursorPosMm.x !== null && cursorPosMm.y !== null && (
              <span className="font-mono text-[10px] text-foreground-secondary border-l border-border pl-2">
                X: {cursorPosMm.x.toFixed(1)}mm • Y: {cursorPosMm.y.toFixed(1)}mm
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. Área Central com Réguas e Papel Físico */}
      <div className="flex-1 flex items-center justify-center p-8 min-w-max min-h-max">
        {template ? (
          <div className="flex flex-col items-start shrink-0">
            {/* Régua Horizontal Superior */}
            {showRulers && (
              <div className="flex items-center">
                {/* Canto de junção das réguas */}
                <div className="w-[18px] h-[18px] bg-surface-subtle/80 border-r border-b border-border/70 shrink-0" />
                <Ruler
                  orientation="horizontal"
                  lengthMm={widthMm}
                  scale={effectiveScale}
                  cursorPosMm={cursorPosMm.x}
                />
              </div>
            )}

            <div className="flex items-start">
              {/* Régua Vertical Esquerda */}
              {showRulers && (
                <Ruler
                  orientation="vertical"
                  lengthMm={heightMm}
                  scale={effectiveScale}
                  cursorPosMm={cursorPosMm.y}
                />
              )}

              {/* Papel Físico do Documento com Profundidade Apple */}
              <div
                style={{
                  transform: `scale(${effectiveScale})`,
                  transformOrigin: 'top left',
                  transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="shrink-0 relative"
              >
                <div
                  ref={(node) => {
                    paperRef.current = node;
                    if (printContainerRef && 'current' in printContainerRef) {
                      (printContainerRef as any).current = node;
                    }
                  }}
                  onMouseMove={handlePaperMouseMove}
                  onMouseLeave={handlePaperMouseLeave}
                  style={{
                    width: `${widthMm}mm`,
                    height: `${heightMm}mm`,
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                    position: 'relative',
                    overflow: 'hidden',
                    filter: colorFilter,
                  }}
                  className="apple-paper-shadow rounded-none"
                >
                  {/* Renderização do Modelo */}
                  {template.render({
                    data: formData,
                    offset: offset,
                    isPreview: true,
                  })}

                  {/* Overlay Seguro de Marcas de Corte */}
                  {cropMarksSvg && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      dangerouslySetInnerHTML={{ __html: cropMarksSvg }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-3 p-8 max-w-sm apple-glass rounded-[12px] border border-border/80 shadow-subtle">
            <div className="w-10 h-10 rounded-full bg-surface-subtle border border-border flex items-center justify-center mx-auto text-foreground-muted">
              <Eye className="w-5 h-5 text-[#3a86ff]" />
            </div>
            <h3 className="text-sm font-semibold text-foreground-primary">Nenhum modelo selecionado</h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Selecione um modelo na barra lateral à esquerda ou crie um modelo personalizado para começar a pré-visualizar.
            </p>
          </div>
        )}
      </div>

      {/* 3. Pílula Flutuante de Zoom & Controles no Rodapé (Apple Glass Island) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <nav
          aria-label="Controles de Visualização e Zoom"
          className="pointer-events-auto apple-glass border border-border/80 px-1 py-1 rounded-[8px] shadow-subtle flex items-center gap-1 text-xs"
        >
          {/* Toggle Réguas Milimétricas */}
          <button
            type="button"
            onClick={() => setShowRulers((prev) => !prev)}
            aria-pressed={showRulers}
            className={`btn-tactile px-2 py-1 rounded-[5px] text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
              showRulers
                ? 'bg-surface-card text-foreground-primary shadow-xs border border-border/80'
                : 'text-foreground-muted hover:text-foreground-primary'
            }`}
            title="Alternar réguas milimétricas"
          >
            <RulerIcon className="w-3 h-3 text-[#3a86ff]" />
            <span>Réguas</span>
            {showRulers && <Check className="w-2.5 h-2.5 text-[#15803d]" />}
          </button>

          <div className="h-3 w-[1px] bg-border mx-0.5" aria-hidden="true" />

          {/* Modos de Zoom */}
          {(['fit', '100', '150', '200'] as ZoomMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setZoomMode(mode)}
              aria-pressed={zoomMode === mode}
              className={`btn-tactile px-2 py-0.5 rounded-[5px] text-[11px] font-mono transition-colors ${
                zoomMode === mode
                  ? 'bg-[#111111] text-white font-semibold shadow-xs'
                  : 'text-foreground-secondary hover:text-foreground-primary hover:bg-surface-subtle'
              }`}
            >
              {mode === 'fit' ? 'Ajustar' : `${mode}%`}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
