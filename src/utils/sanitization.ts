import { CustomTemplateDefinition } from '../types/template';

/**
 * Expressões regulares para detecção de dados pessoais comuns (PII) sob a LGPD:
 * - CPF: 000.000.000-00 ou 11 dígitos sequenciais
 * - E-mail
 * - Telefone brasileiro: (XX) 9XXXX-XXXX ou variações
 * - CEP: 00000-000
 */
const CPF_REGEX = /(?:\b\d{3}[.-]?\d{3}[.-]?\d{3}[.-]?\d{2}\b)/;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const PHONE_REGEX = /(?:\(?\b\d{2}\)?\s?(?:9\s?)?\d{4}[-.\s]?\d{4}\b)/;
const CEP_REGEX = /(?:\b\d{5}[-.]?\d{3}\b)/;

/**
 * Verifica se um valor de texto contém prováveis dados pessoais identificáveis.
 */
export const detectPotentialPII = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  return (
    CPF_REGEX.test(value) ||
    EMAIL_REGEX.test(value) ||
    PHONE_REGEX.test(value) ||
    CEP_REGEX.test(value)
  );
};

/**
 * Higieniza um valor de string substituindo dados pessoais detectados por termos sintéticos neutros.
 */
export const maskPIIString = (value: string): string => {
  let masked = value;
  masked = masked.replace(CPF_REGEX, '000.***.***-00');
  masked = masked.replace(EMAIL_REGEX, 'usuario@exemplo.com.br');
  masked = masked.replace(PHONE_REGEX, '(00) 90000-0000');
  masked = masked.replace(CEP_REGEX, '00000-000');
  return masked;
};

/**
 * Sanitiza as definições de um template customizado, garantindo que nenhum
 * valor padrão de campo (`defaultValue`) contenha PII real de clientes.
 */
export const sanitizeTemplateDefinition = (
  def: CustomTemplateDefinition
): { sanitized: CustomTemplateDefinition; piiCount: number } => {
  let piiCount = 0;

  const sanitizedFields = def.fields.map((field) => {
    if (typeof field.defaultValue === 'string' && detectPotentialPII(field.defaultValue)) {
      piiCount++;
      return {
        ...field,
        defaultValue: maskPIIString(field.defaultValue),
      };
    }
    return field;
  });

  return {
    sanitized: {
      ...def,
      fields: sanitizedFields,
    },
    piiCount,
  };
};

/**
 * Estrutura para relatório de uso de armazenamento local
 */
export interface LocalStorageAuditItem {
  key: string;
  label: string;
  bytes: number;
  description: string;
}

export interface LocalStorageAuditReport {
  items: LocalStorageAuditItem[];
  totalBytes: number;
}

const FOLIUM_STORAGE_METADATA: Record<string, { label: string; description: string }> = {
  'folium-custom-templates': {
    label: 'Modelos Criados pelo Usuário',
    description: 'Armazena layouts, caixas arrastáveis e definições visuais das etiquetas.',
  },
  'folium-color-settings': {
    label: 'Ajustes de Cor e Contraste',
    description: 'Preferências visuais de pré-visualização na tela.',
  },
  'folium-crop-marks': {
    label: 'Marcas de Corte e Sangria',
    description: 'Configurações de guias e marcas de corte físico em milímetros.',
  },
  'folium-paper-selection': {
    label: 'Seleção de Mídia e Papel',
    description: 'Preferência de folha A4 matricial ou bobina térmica contínua.',
  },
  'folium-last-active-template': {
    label: 'Último Modelo Selecionado',
    description: 'Identificador do modelo em foco na prancheta.',
  },
  'folium-is-home-open': {
    label: 'Estado da Janela Inicial',
    description: 'Controle de exibição do painel Home / Editor.',
  },
};

/**
 * Audita todas as chaves do localStorage pertencentes ao Folium Print
 */
export const auditLocalStorage = (): LocalStorageAuditReport => {
  const items: LocalStorageAuditItem[] = [];
  let totalBytes = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || (!key.startsWith('folium-') && key !== 'folium-theme')) continue;

      const val = localStorage.getItem(key) || '';
      // Estimativa em UTF-16 (2 bytes por caractere)
      const bytes = (key.length + val.length) * 2;
      totalBytes += bytes;

      let meta = FOLIUM_STORAGE_METADATA[key];
      if (!meta) {
        if (key.startsWith('folium-offset-')) {
          meta = {
            label: `Calibração (${key.replace('folium-offset-', '')})`,
            description: 'Ajuste fino de tração mecânica (X/Y) em milímetros.',
          };
        } else {
          meta = {
            label: key,
            description: 'Configuração operacional persistida no host.',
          };
        }
      }

      items.push({
        key,
        label: meta.label,
        bytes,
        description: meta.description,
      });
    }
  } catch (e) {
    console.error('Erro ao auditar localStorage:', e);
  }

  return { items, totalBytes };
};

/**
 * Exporta todos os dados do Folium Print persistidos no localStorage em um objeto estruturado (Portabilidade - Art. 18, V)
 */
export const exportFoliumBackup = (): string => {
  const backup: Record<string, unknown> = {
    _schema: 'folium-print-backup-v1',
    exportedAt: new Date().toISOString(),
    data: {},
  };

  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('folium-')) continue;
    try {
      const raw = localStorage.getItem(key);
      data[key] = raw ? JSON.parse(raw) : null;
    } catch {
      data[key] = localStorage.getItem(key);
    }
  }

  backup.data = data;
  return JSON.stringify(backup, null, 2);
};

/**
 * Realiza o expurgo e exclusão definitiva de todos os dados do Folium Print no localStorage (Eliminação - Art. 18, VI)
 */
export const purgeAllFoliumData = (): void => {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('folium-') || key === 'folium-theme')) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((k) => localStorage.removeItem(k));
};
