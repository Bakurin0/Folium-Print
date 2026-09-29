/**
 * Utilitário de detecção de plataforma e formatação de atalhos operacionais.
 * Evita glifos quebrados em sistemas Linux/Windows renderizando 'Ctrl+' nativo.
 */
export const isMac =
  typeof window !== 'undefined' &&
  /Mac|iPhone|iPod|iPad/i.test(navigator.platform || navigator.userAgent || '');

export const formatShortcut = (key: string, hasShift = false): string => {
  if (isMac) {
    return hasShift ? `⌘⌥${key}` : `⌘${key}`;
  }
  return hasShift ? `Ctrl+Shift+${key}` : `Ctrl+${key}`;
};
