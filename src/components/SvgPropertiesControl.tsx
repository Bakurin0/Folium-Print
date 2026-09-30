import React from 'react';
import { 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Upload, 
  Trash2, 
  Palette, 
  Maximize2,
  Minimize2
} from 'lucide-react';
import { applySvgAdjustments, getSvgTransformStyle, SVG_PRESET_COLORS } from '../utils/svgTransform';

interface SvgPropertiesControlProps {
  svgContent: string;
  onChangeSvgContent: (content: string) => void;
  fill?: string;
  onChangeFill: (fill: string) => void;
  stroke?: string;
  onChangeStroke: (stroke: string) => void;
  strokeWidth?: number;
  onChangeStrokeWidth: (width: number) => void;
  rotation?: 0 | 90 | 180 | 270;
  onChangeRotation: (rotation: 0 | 90 | 180 | 270) => void;
  flipH?: boolean;
  onChangeFlipH: (flip: boolean) => void;
  flipV?: boolean;
  onChangeFlipV: (flip: boolean) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove?: () => void;
  label?: string;
  showPreview?: boolean;
}

export const SvgPropertiesControl: React.FC<SvgPropertiesControlProps> = ({
  svgContent,
  onChangeSvgContent,
  fill = '',
  onChangeFill,
  stroke = '',
  onChangeStroke,
  strokeWidth = 0,
  onChangeStrokeWidth,
  rotation = 0,
  onChangeRotation,
  flipH = false,
  onChangeFlipH,
  flipV = false,
  onChangeFlipV,
  onFileUpload,
  onRemove,
  label = 'Propriedades do SVG',
  showPreview = true,
}) => {
  const [showCode, setShowCode] = React.useState(false);

  // Gera o SVG sanitizado e com estilos aplicados para o preview imediato
  const previewSvg = React.useMemo(() => {
    return applySvgAdjustments(svgContent || '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="none" stroke="black" stroke-width="4"/></svg>', {
      fill,
      stroke,
      strokeWidth,
    });
  }, [svgContent, fill, stroke, strokeWidth]);

  const transformStyle = React.useMemo(() => {
    return getSvgTransformStyle({ rotation, flipH, flipV });
  }, [rotation, flipH, flipV]);

  const handleRotate = () => {
    const next: 0 | 90 | 180 | 270 = rotation === 0 ? 90 : rotation === 90 ? 180 : rotation === 180 ? 270 : 0;
    onChangeRotation(next);
  };

  return (
    <div className="space-y-3 p-2.5 bg-black/[0.02] border border-border/70 rounded-[8px]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground-primary flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-[#3a86ff]" />
          <span>{label}</span>
        </span>
        <div className="flex items-center gap-1.5">
          <label className="btn-tactile cursor-pointer text-[10.5px] font-medium text-[#3a86ff] hover:bg-[#3a86ff]/10 px-2 py-0.5 rounded-[4px] border border-[#3a86ff]/20 flex items-center gap-1">
            <Upload className="w-3 h-3" />
            <span>Subir .svg</span>
            <input
              type="file"
              accept=".svg"
              className="hidden"
              onChange={onFileUpload}
            />
          </label>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="btn-tactile text-[10.5px] font-medium text-feedback-error hover:bg-feedback-error/10 px-1.5 py-0.5 rounded-[4px] border border-feedback-error/20 flex items-center gap-0.5"
              title="Remover SVG"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Mini Live Preview & Transform Quick Actions */}
      {showPreview && (
        <div className="flex items-center gap-2.5 p-2 bg-white rounded-[6px] border border-border/80 shadow-xs">
          <div className="w-12 h-12 shrink-0 bg-black/[0.03] rounded-[4px] border border-black/[0.06] flex items-center justify-center p-1 overflow-hidden relative">
            <div
              className="w-full h-full flex items-center justify-center pointer-events-none"
              style={transformStyle}
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          </div>

          <div className="flex-1 flex flex-col gap-1.5">
            <span className="text-[10px] text-foreground-muted">Transformações Rápidas</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleRotate}
                className="btn-tactile px-2 py-1 bg-surface-subtle hover:bg-black/[0.05] rounded-[4px] border border-border text-[10.5px] font-medium text-foreground-primary flex items-center gap-1"
                title="Girar 90 graus no sentido horário"
              >
                <RotateCw className="w-3 h-3 text-foreground-muted" />
                <span>{rotation}°</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeFlipH(!flipH)}
                className={`btn-tactile px-2 py-1 rounded-[4px] border text-[10.5px] font-medium flex items-center gap-1 ${
                  flipH
                    ? 'bg-[#3a86ff]/15 border-[#3a86ff] text-[#3a86ff]'
                    : 'bg-surface-subtle hover:bg-black/[0.05] border-border text-foreground-primary'
                }`}
                title="Espelhar Horizontalmente"
              >
                <FlipHorizontal className="w-3 h-3" />
                <span>Flip H</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeFlipV(!flipV)}
                className={`btn-tactile px-2 py-1 rounded-[4px] border text-[10.5px] font-medium flex items-center gap-1 ${
                  flipV
                    ? 'bg-[#3a86ff]/15 border-[#3a86ff] text-[#3a86ff]'
                    : 'bg-surface-subtle hover:bg-black/[0.05] border-border text-foreground-primary'
                }`}
                title="Espelhar Verticalmente"
              >
                <FlipVertical className="w-3 h-3" />
                <span>Flip V</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preenchimento (Fill) */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-medium text-foreground-secondary block">
          Cor de Preenchimento (Fill)
        </label>
        <div className="flex items-center gap-1.5 flex-wrap">
          {SVG_PRESET_COLORS.map((c) => {
            const isSelected = fill === c.value || (!fill && c.value === '#000000');
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => onChangeFill(c.value)}
                className={`btn-tactile p-1 rounded-full border transition-all ${
                  isSelected
                    ? 'border-[#3a86ff] ring-2 ring-[#3a86ff]/30 scale-110 shadow-xs'
                    : 'border-black/15 hover:scale-105'
                }`}
                title={c.label}
                aria-label={c.label}
              >
                <span
                  className="w-4 h-4 rounded-full block border border-black/10 shrink-0"
                  style={{
                    backgroundColor: c.value === 'none' ? 'transparent' : c.value,
                    backgroundImage:
                      c.value === 'none'
                        ? 'linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)'
                        : undefined,
                    backgroundSize: '4px 4px',
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Linha / Contorno (Stroke) e Espessura */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
        <div>
          <label className="text-[10px] font-medium text-foreground-secondary block mb-1">
            Contorno (Stroke)
          </label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={stroke}
              onChange={(e) => onChangeStroke(e.target.value)}
              placeholder="ex: #000 ou none"
              className="w-full text-[10px] font-mono px-2 py-1 bg-white border border-border/80 focus:border-[#3a86ff] rounded-[4px] outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-medium text-foreground-secondary block mb-1">
            Espessura (px)
          </label>
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={strokeWidth}
            onChange={(e) => onChangeStrokeWidth(parseFloat(e.target.value) || 0)}
            className="w-full text-[10px] font-mono px-2 py-1 bg-white border border-border/80 focus:border-[#3a86ff] rounded-[4px] outline-none transition-colors"
          />
        </div>
      </div>

      {/* Editor de Código SVG com Alternador */}
      <div className="pt-1 border-t border-border/60">
        <div className="flex items-center justify-between mb-1">
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            className="text-[10.5px] font-medium text-[#3a86ff] hover:underline flex items-center gap-1"
          >
            {showCode ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            <span>{showCode ? 'Ocultar Código SVG' : 'Editar Código SVG Diretamente'}</span>
          </button>
          <span className="text-[9px] font-mono text-foreground-muted">
            {svgContent.length} bytes
          </span>
        </div>

        {showCode && (
          <textarea
            rows={4}
            value={svgContent}
            onChange={(e) => onChangeSvgContent(e.target.value)}
            placeholder="<svg ...>...</svg>"
            className="w-full text-[9.5px] font-mono p-2 bg-white border border-border/80 focus:border-[#3a86ff] focus:ring-1 focus:ring-[#3a86ff]/20 rounded-[6px] outline-none text-foreground-primary resize-y transition-colors"
          />
        )}
      </div>
    </div>
  );
};
