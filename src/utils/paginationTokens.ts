/**
 * Utilitário para resolução de tokens e paginação de cópias/volumes
 * Suporta {copia}, {total}, {volume}, {volumes}
 * Formatação de zeros à esquerda inteligente:
 * - Total < 100: pad com 2 dígitos (01/02, 09/10)
 * - Total >= 100: pad de acordo com o total (001/150)
 */

export const formatCopyNumber = (index: number, total: number): string => {
  const minDigits = total >= 100 ? String(total).length : 2;
  return String(index).padStart(minDigits, '0');
};

export const formatTotalNumber = (total: number): string => {
  const minDigits = total >= 100 ? String(total).length : 2;
  return String(total).padStart(minDigits, '0');
};

/**
 * Substitui os tokens dinâmicos no texto da etiqueta
 */
export const resolveCopyTokens = (
  text: string,
  copyIndex: number = 1,
  copyTotal: number = 1,
  hideSingleCopy: boolean = true
): string => {
  if (!text) return '';

  const tokenRegex = /\{(?:copia|cópia|volume|total|volumes)\}/i;
  if (!tokenRegex.test(text)) {
    return text;
  }

  // Se houver apenas 1 cópia e a opção de ocultar estiver ligada
  if (copyTotal <= 1 && hideSingleCopy) {
    // Remove padrões comuns de volume único como "Vol. {copia}/{total}", "{copia}/{total}", "Volume {copia} de {total}"
    const cleaned = text
      .replace(/(?:vol\.?|volume|cópia|copia|cx\.?|caixa)?\s*\{[^}]+\}\s*(?:\/|de|-)?\s*\{[^}]+\}/gi, '')
      .replace(/\{[^}]+\}/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return cleaned;
  }

  const formattedIndex = formatCopyNumber(copyIndex, copyTotal);
  const formattedTotal = formatTotalNumber(copyTotal);

  return text
    .replace(/\{(?:copia|cópia|volume)\}/gi, formattedIndex)
    .replace(/\{(?:total|volumes)\}/gi, formattedTotal);
};
