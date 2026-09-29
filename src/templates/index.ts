import { Template } from '../types/template';
import { BUILTIN_TEMPLATES } from './builtinTemplates';

export const ALL_TEMPLATES: Template[] = BUILTIN_TEMPLATES;

export const getTemplateById = (id: string): Template | undefined => {
  return ALL_TEMPLATES.find((t) => t.id === id);
};

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
