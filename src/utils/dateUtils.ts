import { DateFormat } from '../types/template';

export interface DateFormatOption {
  value: DateFormat;
  label: string;
  example: string;
}

export const DATE_FORMAT_OPTIONS: DateFormatOption[] = [
  { value: 'DD/MM/YYYY', label: 'Padrão (DD/MM/AAAA)', example: '30/09/2026' },
  { value: 'DD/MM/AA', label: 'Curto (DD/MM/AA)', example: '30/09/26' },
  { value: 'DD/MM', label: 'Dia e Mês (DD/MM)', example: '30/09' },
  { value: 'YYYY-MM-DD', label: 'ISO (AAAA-MM-DD)', example: '2026-09-30' },
  { value: 'extended', label: 'Extenso (pt-BR)', example: '30 de setembro de 2026' },
];

/**
 * Formata um objeto Date ou string de data em um formato específico com prefixo opcional.
 */
export function formatDate(
  inputDate?: Date | string | null,
  format: DateFormat = 'DD/MM/YYYY',
  prefix: string = ''
): string {
  let d: Date;
  if (!inputDate) {
    d = new Date();
  } else if (inputDate instanceof Date) {
    d = isNaN(inputDate.getTime()) ? new Date() : inputDate;
  } else {
    const parts = String(inputDate).trim().split('-');
    if (parts.length === 3) {
      d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      d = new Date(inputDate);
      if (isNaN(d.getTime())) {
        d = new Date();
      }
    }
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const yearFull = String(d.getFullYear());
  const yearShort = yearFull.slice(-2);

  let formattedDate = '';

  switch (format) {
    case 'DD/MM/AA':
      formattedDate = `${day}/${month}/${yearShort}`;
      break;
    case 'DD/MM':
      formattedDate = `${day}/${month}`;
      break;
    case 'YYYY-MM-DD':
      formattedDate = `${yearFull}-${month}-${day}`;
      break;
    case 'extended': {
      // ponytail: Native Intl API replaces manual pt-BR month array
      formattedDate = new Intl.DateTimeFormat('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
      break;
    }
    case 'DD/MM/YYYY':
    default:
      formattedDate = `${day}/${month}/${yearFull}`;
      break;
  }

  const cleanPrefix = prefix ? `${prefix.trimEnd()} ` : '';
  return `${cleanPrefix}${formattedDate}`;
}

/**
 * Retorna a data de hoje formatada no formato solicitado com prefixo.
 */
export function getTodayFormatted(format: DateFormat = 'DD/MM/YYYY', prefix: string = ''): string {
  return formatDate(new Date(), format, prefix);
}

/**
 * Retorna a data de hoje no formato nativo ISO (YYYY-MM-DD) para inputs do tipo type="date".
 */
export function getTodayIso(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}
