import { Template } from '../types/template';

/**
 * Catálogo de modelos pré-instalados de fábrica.
 * Inicialmente vazio para permitir um catálogo 100% gerenciado pelo usuário.
 */
export const ALL_TEMPLATES: Template[] = [];

/**
 * Extrai os valores padrão dos campos de um modelo para preencher o formulário.
 */
export const getDefaultFormData = (template?: Template | null): Record<string, any> => {
  if (!template) return {};
  const data: Record<string, any> = {};
  template.fields.forEach((field) => {
    data[field.key] = field.defaultValue ?? '';
  });

  if (template.grid) {
    data._gridCopies = template.grid.rows * template.grid.cols;
    data._gridStartPosition = 0;
  }

  return data;
};
