import { FontWeightOption } from '../types/template';

/**
 * Normaliza o peso de fonte CSS numérico a partir do FontWeightOption.
 * Regular = 400, Bold = 700, Extra Bold = 800 (padrão ótimo para etiquetas térmicas e jatos de tinta).
 */
export function normalizeFontWeight(
  weight?: FontWeightOption | string | number,
  fallback: FontWeightOption = 'normal'
): 400 | 700 | 800 {
  const target = weight || fallback;
  if (target === 'extra-bold' || target === 'bolder' || target === 800 || target === 900 || target === '800' || target === '900') {
    return 800;
  }
  if (target === 'bold' || target === 700 || target === '700') {
    return 700;
  }
  return 400;
}

/**
 * Cicla entre Regular -> Bold -> Extra Bold -> Regular.
 * Utilizado por atalhos de teclado (Ctrl/Cmd+B) e ações rápidas.
 */
export function cycleFontWeight(current?: FontWeightOption): FontWeightOption {
  if (!current || current === 'normal') {
    return 'bold';
  }
  if (current === 'bold') {
    return 'extra-bold';
  }
  return 'normal';
}

export interface FontWeightPreset {
  id: FontWeightOption;
  label: string;
  fullName: string;
  numericWeight: 400 | 700 | 800;
  title: string;
}

export const FONT_WEIGHT_PRESETS: FontWeightPreset[] = [
  {
    id: 'normal',
    label: 'R',
    fullName: 'Regular',
    numericWeight: 400,
    title: 'Regular (400) — Leveza e legibilidade padrão',
  },
  {
    id: 'bold',
    label: 'B',
    fullName: 'Bold',
    numericWeight: 700,
    title: 'Negrito (700) — Destaque e ênfase visual',
  },
  {
    id: 'extra-bold',
    label: 'EB',
    fullName: 'Extra Bold',
    numericWeight: 800,
    title: 'Extra Negrito (800) — Máximo contraste sem sangramento de tinta',
  },
];
