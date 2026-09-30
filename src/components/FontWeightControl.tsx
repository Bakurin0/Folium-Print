import React from 'react';
import { FontWeightOption } from '../types/template';
import { FONT_WEIGHT_PRESETS } from '../utils/fontUtils';

interface FontWeightControlProps {
  value?: FontWeightOption;
  onChange: (weight: FontWeightOption) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Segmented Control Tátil para Peso Tipográfico (Apple HIG / Emil Kowalski Philosophy)
 * 
 * Filosofia de Design Engineering:
 * - Resposta física tátil com active:scale-[0.96] em botões de ação
 * - Curva de easing customizada (--ease-out) e duração snappy (160ms)
 * - Transições específicas (transform, background-color, color), sem `transition: all`
 * - Prévia visual direta na espessura tipográfica da própria letra (R = 400, B = 700, EB = 800)
 */
export const FontWeightControl: React.FC<FontWeightControlProps> = ({
  value = 'normal',
  onChange,
  size = 'sm',
  disabled = false,
  className = '',
  ariaLabel = 'Selecionar peso da fonte',
}) => {
  // Normaliza 'bolder' legado para 'extra-bold'
  const normalizedValue: FontWeightOption =
    value === 'bolder' ? 'extra-bold' : value || 'normal';

  const isSmall = size === 'sm';

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex items-center p-0.5 rounded-[6px] bg-black/[0.04] border border-black/[0.05] select-none ${className} ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      {FONT_WEIGHT_PRESETS.map((preset) => {
        const isSelected = normalizedValue === preset.id;

        return (
          <button
            key={preset.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            title={preset.title}
            onClick={() => onChange(preset.id)}
            style={{ fontWeight: preset.numericWeight }}
            className={`
              relative btn-tactile rounded-[4.5px] transition-colors transition-transform duration-snappy ease-out
              active:scale-[0.96] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111]
              flex items-center justify-center font-sans tracking-tight
              ${
                isSmall
                  ? 'h-5 px-1.5 min-w-[20px] text-[10px]'
                  : 'h-7 px-2.5 min-w-[28px] text-xs'
              }
              ${
                isSelected
                  ? 'bg-white text-foreground-primary shadow-xs ring-1 ring-black/[0.06] font-semibold'
                  : 'text-foreground-secondary hover:text-foreground-primary hover:bg-black/[0.03] font-normal'
              }
            `}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
};
