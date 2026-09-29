import { Template } from '../types/template';

/**
 * Catálogo de modelos do sistema.
 * Atualmente vazio por solicitação do usuário, priorizando modelos criados e salvos pelo usuário.
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
  } else {
    data._thermalCopies = 1;
    data._previewCopyIndex = 1;
  }

  data._hideSingleCopy = true;

  return data;
};
