/**
 * Utilitários unificados para conversão de unidades físicas de impressão.
 * Fonte única de verdade para cálculos de milímetros, pixels e DPI.
 */

export const STANDARD_SCREEN_DPI = 96;

/**
 * Fator de conversão padrão: 1 mm em pixels a 96 DPI (3.779528 px)
 */
export const MM_TO_PX = STANDARD_SCREEN_DPI / 25.4;

/**
 * Converte valor em milímetros (mm) para pixels (px) dado um valor de DPI.
 * @param mm Dimensão em milímetros
 * @param dpi Resolução do dispositivo de saída (padrão: 96 para tela)
 */
export function mmToPx(mm: number, dpi: number = STANDARD_SCREEN_DPI): number {
  return (mm * dpi) / 25.4;
}

/**
 * Converte valor em pixels (px) para milímetros (mm) dado um valor de DPI.
 * @param px Dimensão em pixels
 * @param dpi Resolução do dispositivo (padrão: 96 para tela)
 */
export function pxToMm(px: number, dpi: number = STANDARD_SCREEN_DPI): number {
  return (px * 25.4) / dpi;
}
