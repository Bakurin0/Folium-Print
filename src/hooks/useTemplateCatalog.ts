import { useState, useMemo, useCallback } from 'react';
import { Template, CustomTemplateDefinition } from '../types/template';
import { ALL_TEMPLATES } from '../templates';
import {
  loadCustomTemplates,
  saveCustomTemplate,
  deleteCustomTemplate,
} from '../utils/customTemplatesStorage';

export interface UseTemplateCatalogReturn {
  templates: Template[];
  customTemplates: Template[];
  selectedTemplateId: string;
  currentTemplate: Template | null;
  selectTemplate: (id: string) => void;
  nextTemplate: () => void;
  saveTemplate: (def: CustomTemplateDefinition) => Template;
  deleteTemplate: (id: string) => void;
}

/**
 * Hook modular para catálogo de modelos (built-in e personalizados)
 * Encapsula ciclo de templates, persistência e seleção ativa.
 */
export function useTemplateCatalog(
  onSelectCallback?: (template: Template) => void
): UseTemplateCatalogReturn {
  const [customTemplates, setCustomTemplates] = useState<Template[]>(() =>
    loadCustomTemplates()
  );

  const templates = useMemo(() => {
    return [...ALL_TEMPLATES, ...customTemplates];
  }, [customTemplates]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    const list = loadCustomTemplates();
    return list[0]?.id || ALL_TEMPLATES[0]?.id || '';
  });

  const currentTemplate = useMemo(() => {
    return (
      templates.find((t) => t.id === selectedTemplateId) ||
      templates[0] ||
      null
    );
  }, [templates, selectedTemplateId]);

  const selectTemplate = useCallback(
    (id: string) => {
      setSelectedTemplateId(id);
      const found = templates.find((t) => t.id === id);
      if (found && onSelectCallback) {
        onSelectCallback(found);
      }
    },
    [templates, onSelectCallback]
  );

  const nextTemplate = useCallback(() => {
    if (templates.length <= 1) return;
    const currentIndex = templates.findIndex((t) => t.id === selectedTemplateId);
    const nextIndex = (currentIndex + 1) % templates.length;
    selectTemplate(templates[nextIndex].id);
  }, [templates, selectedTemplateId, selectTemplate]);

  const saveTemplate = useCallback(
    (def: CustomTemplateDefinition): Template => {
      const saved = saveCustomTemplate(def);
      const updated = loadCustomTemplates();
      setCustomTemplates(updated);
      setSelectedTemplateId(saved.id);
      if (onSelectCallback) {
        onSelectCallback(saved);
      }
      return saved;
    },
    [onSelectCallback]
  );

  const deleteTemplate = useCallback(
    (id: string) => {
      deleteCustomTemplate(id);
      const updated = loadCustomTemplates();
      setCustomTemplates(updated);
      if (selectedTemplateId === id) {
        if (updated.length > 0) {
          selectTemplate(updated[0].id);
        } else if (ALL_TEMPLATES.length > 0) {
          selectTemplate(ALL_TEMPLATES[0].id);
        } else {
          setSelectedTemplateId('');
        }
      }
    },
    [selectedTemplateId, selectTemplate]
  );

  return {
    templates,
    customTemplates,
    selectedTemplateId,
    currentTemplate,
    selectTemplate,
    nextTemplate,
    saveTemplate,
    deleteTemplate,
  };
}
