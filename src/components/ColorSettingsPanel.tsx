import React from 'react';
import { ColorAdjustments, ColorMode } from '../types/template';
import { Palette, RotateCcw, Sparkles } from 'lucide-react';

interface ColorSettingsPanelProps {
  adjustments: ColorAdjustments;
  onChangeAdjustments: (adjustments: ColorAdjustments) => void;
}

export const ColorSettingsPanel: React.FC<ColorSettingsPanelProps> = ({
  adjustments,
  onChangeAdjustments,
}) => {
  const handleModeChange = (mode: ColorMode) => {
    onChangeAdjustments({
      ...adjustments,
      mode,
    });
  };

  const handleSliderChange = (key: keyof Omit<ColorAdjustments, 'mode'>, value: number) => {
    onChangeAdjustments({
      ...adjustments,
      [key]: value,
    });
  };

  const handleReset = () => {
    onChangeAdjustments({
      mode: 'rgb',
      brightness: 0,
      contrast: 0,
      saturation: 0,
    });
  };

  const applyPreset = (preset: { brightness: number; contrast: number; saturation: number; mode?: ColorMode }) => {
    onChangeAdjustments({
      ...adjustments,
      ...preset,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with Reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Palette className="w-4 h-4 text-pastel-violet-text" strokeWidth={2} />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-primary">
            Perfil & Ajustes de Cor
          </h3>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-[11px] text-foreground-muted hover:text-foreground-primary flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-surface-subtle transition-colors"
          title="Restaurar valores padrão de cor"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Restaurar</span>
        </button>
      </div>

      {/* Color Mode Selection (RGB vs Simulated CMYK) */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-foreground-secondary block">
          Espaço / Perfil de Cor
        </label>
        <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-surface-subtle border border-border rounded-[6px]">
          <button
            type="button"
            onClick={() => handleModeChange('rgb')}
            className={`py-1.5 px-2 rounded-[4px] text-xs font-medium transition-[background-color,border-color,color] duration-instant ease text-center ${
              adjustments.mode === 'rgb'
                ? 'bg-surface-card text-foreground-primary shadow-xs border border-border/60'
                : 'text-foreground-muted hover:text-foreground-primary'
            }`}
          >
            <div className="font-semibold">RGB Padrão</div>
            <div className="text-[9px] opacity-75">Telas e Digital</div>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('cmyk-simulated')}
            className={`py-1.5 px-2 rounded-[4px] text-xs font-medium transition-[background-color,border-color,color] duration-instant ease text-center ${
              adjustments.mode === 'cmyk-simulated'
                ? 'bg-surface-card text-pastel-violet-text border border-pastel-violet-border shadow-xs'
                : 'text-foreground-muted hover:text-foreground-primary'
            }`}
          >
            <div className="font-semibold flex items-center justify-center gap-1">
              <span>CMYK Simulado</span>
              <span className="w-1.5 h-1.5 rounded-full bg-pastel-violet-text" />
            </div>
            <div className="text-[9px] opacity-75">Gamut FOGRA39 / Offset</div>
          </button>
        </div>

        {adjustments.mode === 'cmyk-simulated' && (
          <div className="p-2 bg-pastel-violet-bg/30 border border-pastel-violet-border/50 rounded-[6px] text-[10.5px] text-pastel-violet-text leading-tight">
            <strong>Modo Gráfico Ativo:</strong> simula a compressão de gama de tintas de impressão CMYK e compensação de ganho de ponto para evitar cores fluorescentes ou fora do alcance de impressão.
          </div>
        )}
      </div>

      {/* Interactive Adjustment Sliders */}
      <div className="space-y-3 pt-1">
        {/* Brightness */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground-secondary font-medium">Brilho</span>
            <span className="font-mono text-[11px] text-foreground-muted">
              {adjustments.brightness > 0 ? `+${adjustments.brightness}` : adjustments.brightness}%
            </span>
          </div>
          <input
            type="range"
            min={-50}
            max={50}
            step={1}
            value={adjustments.brightness}
            onChange={(e) => handleSliderChange('brightness', Number(e.target.value))}
            className="w-full h-1.5 bg-surface-subtle rounded-lg appearance-none cursor-pointer accent-[#111111]"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground-secondary font-medium">Contraste</span>
            <span className="font-mono text-[11px] text-foreground-muted">
              {adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}%
            </span>
          </div>
          <input
            type="range"
            min={-50}
            max={50}
            step={1}
            value={adjustments.contrast}
            onChange={(e) => handleSliderChange('contrast', Number(e.target.value))}
            className="w-full h-1.5 bg-surface-subtle rounded-lg appearance-none cursor-pointer accent-[#111111]"
          />
        </div>

        {/* Saturation */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground-secondary font-medium">Saturação</span>
            <span className="font-mono text-[11px] text-foreground-muted">
              {adjustments.saturation > 0 ? `+${adjustments.saturation}` : adjustments.saturation}%
            </span>
          </div>
          <input
            type="range"
            min={-50}
            max={50}
            step={1}
            value={adjustments.saturation}
            onChange={(e) => handleSliderChange('saturation', Number(e.target.value))}
            className="w-full h-1.5 bg-surface-subtle rounded-lg appearance-none cursor-pointer accent-[#111111]"
          />
        </div>
      </div>

      {/* Quick Grayscale / Gráfica Presets */}
      <div className="space-y-1.5 pt-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Presets Rápidos de Impressão</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => applyPreset({ brightness: -5, contrast: 20, saturation: 0 })}
            className="px-2 py-1 text-[10px] font-medium bg-surface-subtle hover:bg-surface-card border border-border rounded-[4px] text-foreground-secondary hover:text-foreground-primary transition-colors text-center"
          >
            Preto Nítido
          </button>
          <button
            type="button"
            onClick={() => applyPreset({ brightness: 15, contrast: -10, saturation: -25 })}
            className="px-2 py-1 text-[10px] font-medium bg-surface-subtle hover:bg-surface-card border border-border rounded-[4px] text-foreground-secondary hover:text-foreground-primary transition-colors text-center"
          >
            Econômico
          </button>
          <button
            type="button"
            onClick={() => applyPreset({ brightness: 0, contrast: 12, saturation: 25, mode: 'cmyk-simulated' })}
            className="px-2 py-1 text-[10px] font-medium bg-surface-subtle hover:bg-surface-card border border-border rounded-[4px] text-foreground-secondary hover:text-foreground-primary transition-colors text-center"
          >
            Gráfica Viva
          </button>
        </div>
      </div>
    </div>
  );
};
