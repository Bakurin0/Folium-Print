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
  closeTemplate: () => void;
  nextTemplate: () => void;
  saveTemplate: (def: CustomTemplateDefinition) => Template;
  updateCurrentTemplateFields: (fields: CustomTemplateDefinition['fields']) => void;
  updateCurrentTemplate: (updates: Partial<CustomTemplateDefinition>) => void;
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
    try {
      const savedLast = localStorage.getItem('folium-last-active-template');
      if (savedLast !== null) {
        if (!savedLast) {
          return '';
        }
        const list = loadCustomTemplates();
        const exists = list.some((t) => t.id === savedLast) || ALL_TEMPLATES.some((t) => t.id === savedLast);
        if (exists) {
          return savedLast;
        }
        return '';
      }
    } catch {}
    return '';
  });

  const currentTemplate = useMemo(() => {
    if (!selectedTemplateId) return null;
    return (
      templates.find((t) => t.id === selectedTemplateId) ||
      null
    );
  }, [templates, selectedTemplateId]);

  const selectTemplate = useCallback(
    (id: string) => {
      setSelectedTemplateId(id);
      try {
        localStorage.setItem('folium-last-active-template', id || '');
      } catch {}
      const found = templates.find((t) => t.id === id);
      if (found && onSelectCallback) {
        onSelectCallback(found);
      }
    },
    [templates, onSelectCallback]
  );

  const closeTemplate = useCallback(() => {
    setSelectedTemplateId('');
    try {
      localStorage.setItem('folium-last-active-template', '');
    } catch {}
  }, []);

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

  const updateCurrentTemplateFields = useCallback(
    (fields: CustomTemplateDefinition['fields']) => {
      if (!currentTemplate) return;
      const def: CustomTemplateDefinition = {
        id: currentTemplate.id,
        name: currentTemplate.name,
        category: currentTemplate.category,
        description: currentTemplate.description,
        dimensions: currentTemplate.dimensions,
        grid: currentTemplate.grid,
        fields: fields,
        backgroundSvg: currentTemplate.backgroundSvg,
        backgroundSvgFill: currentTemplate.backgroundSvgFill,
        backgroundSvgStroke: currentTemplate.backgroundSvgStroke,
        backgroundSvgStrokeWidth: currentTemplate.backgroundSvgStrokeWidth,
        backgroundSvgRotation: currentTemplate.backgroundSvgRotation,
        backgroundSvgFlipH: currentTemplate.backgroundSvgFlipH,
        backgroundSvgFlipV: currentTemplate.backgroundSvgFlipV,
        backgroundSvgOpacity: currentTemplate.backgroundSvgOpacity,
        defaultFontWeight: currentTemplate.defaultFontWeight,
        isCustom: true,
      };
      saveCustomTemplate(def);
      const updated = loadCustomTemplates();
      setCustomTemplates(updated);
    },
    [currentTemplate]
  );

  const updateCurrentTemplate = useCallback(
    (updates: Partial<CustomTemplateDefinition>) => {
      if (!currentTemplate) return;
      const def: CustomTemplateDefinition = {
        id: currentTemplate.id,
        name: updates.name ?? currentTemplate.name,
        category: updates.category ?? currentTemplate.category,
        description: updates.description ?? currentTemplate.description,
        dimensions: updates.dimensions ?? currentTemplate.dimensions,
        grid: updates.grid !== undefined ? updates.grid : currentTemplate.grid,
        fields: updates.fields ?? currentTemplate.fields,
        backgroundSvg: updates.backgroundSvg !== undefined ? updates.backgroundSvg : currentTemplate.backgroundSvg,
        backgroundSvgFill: updates.backgroundSvgFill !== undefined ? updates.backgroundSvgFill : currentTemplate.backgroundSvgFill,
        backgroundSvgStroke: updates.backgroundSvgStroke !== undefined ? updates.backgroundSvgStroke : currentTemplate.backgroundSvgStroke,
        backgroundSvgStrokeWidth: updates.backgroundSvgStrokeWidth !== undefined ? updates.backgroundSvgStrokeWidth : currentTemplate.backgroundSvgStrokeWidth,
        backgroundSvgRotation: updates.backgroundSvgRotation !== undefined ? updates.backgroundSvgRotation : currentTemplate.backgroundSvgRotation,
        backgroundSvgFlipH: updates.backgroundSvgFlipH !== undefined ? updates.backgroundSvgFlipH : currentTemplate.backgroundSvgFlipH,
        backgroundSvgFlipV: updates.backgroundSvgFlipV !== undefined ? updates.backgroundSvgFlipV : currentTemplate.backgroundSvgFlipV,
        backgroundSvgOpacity: updates.backgroundSvgOpacity !== undefined ? updates.backgroundSvgOpacity : currentTemplate.backgroundSvgOpacity,
        defaultFontWeight: updates.defaultFontWeight ?? currentTemplate.defaultFontWeight,
        isCustom: true,
      };
      saveCustomTemplate(def);
      const updated = loadCustomTemplates();
      setCustomTemplates(updated);
    },
    [currentTemplate]
  );

  const deleteTemplate = useCallback(
    (id: string) => {
      deleteCustomTemplate(id);
      const updated = loadCustomTemplates();
      setCustomTemplates(updated);
      if (selectedTemplateId === id) {
        closeTemplate();
      }
    },
    [selectedTemplateId, closeTemplate]
  );

  return {
    templates,
    customTemplates,
    selectedTemplateId,
    currentTemplate,
    selectTemplate,
    closeTemplate,
    nextTemplate,
    saveTemplate,
    updateCurrentTemplateFields,
    updateCurrentTemplate,
    deleteTemplate,
  };
}
