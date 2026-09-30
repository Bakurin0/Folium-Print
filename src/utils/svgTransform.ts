import { sanitizeSvg } from './sanitizeSvg';

export interface SvgAdjustmentOptions {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rotation?: 0 | 90 | 180 | 270;
  flipH?: boolean;
  flipV?: boolean;
  opacity?: number;
}

/**
 * Paleta de cores recomendadas para uso em carimbos, etiquetas térmicas e logotipos.
 */
export const SVG_PRESET_COLORS = [
  { label: 'Preto', value: '#000000' },
  { label: 'Branco', value: '#ffffff' },
  { label: 'Cinza Escuro', value: '#3f3f46' },
  { label: 'Cinza Médio', value: '#71717a' },
  { label: 'Azul Folium', value: '#3a86ff' },
  { label: 'Laranja Alerta', value: '#fb5607' },
  { label: 'Vermelho Perigo', value: '#ff006e' },
  { label: 'Transparente', value: 'none' },
];

/**
 * Aplica ajustes de cor (fill/stroke) e espessura diretamente na marcação SVG.
 */
export function applySvgAdjustments(svgRaw: string, options: SvgAdjustmentOptions = {}): string {
  if (!svgRaw || typeof svgRaw !== 'string') return '<svg></svg>';

  let clean = sanitizeSvg(svgRaw);
  if (!clean) return '<svg></svg>';

  const { fill, stroke, strokeWidth, opacity } = options;

  // Se nenhum ajuste de cor/espessura for solicitado, retorna o SVG sanitizado
  if (!fill && !stroke && strokeWidth === undefined && opacity === undefined) {
    return clean;
  }

  try {
    // Regex para manipular a tag raiz <svg ...>
    const svgTagMatch = clean.match(/<svg([^>]*)>([\s\S]*?)<\/svg>/i);
    if (!svgTagMatch) return clean;

    const rootAttrs = svgTagMatch[1];
    let innerContent = svgTagMatch[2];

    // Se fill for especificado (diferente de vazio), injeta/substitui fill
    if (fill) {
      if (fill === 'none') {
        // Altera fills existentes (exceto os que já são none) para none
        innerContent = innerContent.replace(/fill=(["'])(?!none)[^"']*\1/gi, 'fill="none"');
      } else {
        // Se o elemento não tiver fill="none", aplica o fill configurado
        innerContent = innerContent.replace(/fill=(["'])(?!none)[^"']*\1/gi, `fill="${fill}"`);
      }
    }

    // Se stroke for especificado
    if (stroke) {
      if (stroke === 'none') {
        innerContent = innerContent.replace(/stroke=(["'])(?!none)[^"']*\1/gi, 'stroke="none"');
      } else {
        innerContent = innerContent.replace(/stroke=(["'])(?!none)[^"']*\1/gi, `stroke="${stroke}"`);
      }
    }

    // Se strokeWidth for especificado
    if (strokeWidth !== undefined && strokeWidth >= 0) {
      if (/stroke-width=(["'])[^"']*\1/gi.test(innerContent)) {
        innerContent = innerContent.replace(/stroke-width=(["'])[^"']*\1/gi, `stroke-width="${strokeWidth}"`);
      }
    }

    // Encapsula o conteúdo interno em um grupo <g> com os atributos padrão de cascata
    const groupAttrs: string[] = [];
    if (fill && fill !== 'none') groupAttrs.push(`fill="${fill}"`);
    if (stroke && stroke !== 'none') groupAttrs.push(`stroke="${stroke}"`);
    if (strokeWidth !== undefined && strokeWidth > 0) groupAttrs.push(`stroke-width="${strokeWidth}"`);
    if (opacity !== undefined && opacity >= 0 && opacity <= 1) groupAttrs.push(`opacity="${opacity}"`);

    const wrappedInner = groupAttrs.length > 0
      ? `<g ${groupAttrs.join(' ')}>${innerContent}</g>`
      : innerContent;

    return `<svg${rootAttrs}>${wrappedInner}</svg>`;
  } catch (err) {
    console.warn('Erro ao aplicar ajustes ao SVG:', err);
    return clean;
  }
}

/**
 * Gera a string de estilo CSS transform para rotação e espelhamento de SVGs com aceleração de GPU.
 */
export function getSvgTransformStyle(options: {
  rotation?: 0 | 90 | 180 | 270;
  flipH?: boolean;
  flipV?: boolean;
}): React.CSSProperties {
  const { rotation = 0, flipH = false, flipV = false } = options;

  const transforms: string[] = [];

  if (rotation) {
    transforms.push(`rotate(${rotation}deg)`);
  }
  if (flipH) {
    transforms.push('scaleX(-1)');
  }
  if (flipV) {
    transforms.push('scaleY(-1)');
  }

  if (transforms.length === 0) {
    return {};
  }

  return {
    transform: transforms.join(' '),
    transformOrigin: 'center center',
    transition: 'transform var(--duration-snappy) var(--ease-out)',
  };
}
