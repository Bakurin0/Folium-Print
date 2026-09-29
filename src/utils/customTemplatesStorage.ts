import { Template, CustomTemplateDefinition } from '../types/template';
import { createDynamicRenderer } from './dynamicRenderer';

const STORAGE_KEY = 'folium-custom-templates';

// ponytail: Storage uses LocalStorage.
// Ceiling: Limited to 5MB and local browser/webview instance only.
// Upgrade path: Persist custom templates via Tauri fs plugin as JSON files in user app data directory.
export const loadCustomTemplates = (): Template[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: CustomTemplateDefinition[] = JSON.parse(raw);
    return list.map((def) => ({
      ...def,
      isCustom: true,
      render: createDynamicRenderer(def),
    }));
  } catch (err) {
    console.error('Failed to load custom templates from localStorage', err);
    return [];
  }
};

export const saveCustomTemplate = (def: CustomTemplateDefinition): Template => {
  const currentDefs: CustomTemplateDefinition[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      currentDefs.push(...JSON.parse(raw));
    }
  } catch {}

  const existingIdx = currentDefs.findIndex((t) => t.id === def.id);
  if (existingIdx >= 0) {
    currentDefs[existingIdx] = def;
  } else {
    currentDefs.push(def);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentDefs));

  return {
    ...def,
    isCustom: true,
    render: createDynamicRenderer(def),
  };
};

export const deleteCustomTemplate = (id: string): void => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const currentDefs: CustomTemplateDefinition[] = JSON.parse(raw);
    const filtered = currentDefs.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete custom template', err);
  }
};
