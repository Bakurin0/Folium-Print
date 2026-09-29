import { useState, useEffect, useCallback } from 'react';
import {
  CalibrationOffset,
  ColorAdjustments,
  CropMarkSettings,
  Template,
} from '../types/template';
import { PaperSelection } from '../components/PaperMediaPanel';

export interface UsePrintSettingsReturn {
  offset: CalibrationOffset;
  setOffset: (offset: CalibrationOffset) => void;
  colorAdjustments: ColorAdjustments;
  setColorAdjustments: (adjustments: ColorAdjustments) => void;
  cropMarks: CropMarkSettings;
  setCropMarks: (marks: CropMarkSettings) => void;
  paperSelection: PaperSelection;
  setPaperSelection: (selection: PaperSelection) => void;
}

const DEFAULT_COLOR_ADJUSTMENTS: ColorAdjustments = {
  mode: 'rgb',
  brightness: 0,
  contrast: 0,
  saturation: 0,
};

const DEFAULT_CROP_MARKS: CropMarkSettings = {
  enabled: false,
  bleedMm: 2,
  showRegistrationMarks: true,
  showGridMarks: true,
  markLengthMm: 4,
};

/**
 * Hook modular para gerenciamento e persistência das configurações de impressão:
 * Calibração mecânica por modelo, ajustes cromáticos e marcas de corte.
 */
export function usePrintSettings(currentTemplate: Template | null): UsePrintSettingsReturn {
  // 1. Calibração mecânica (offset por template)
  const [offset, setOffsetState] = useState<CalibrationOffset>({ offsetX: 0, offsetY: 0 });

  useEffect(() => {
    if (!currentTemplate) return;
    try {
      const saved = localStorage.getItem(`folium-offset-${currentTemplate.id}`);
      if (saved) {
        setOffsetState(JSON.parse(saved));
      } else {
        setOffsetState({ offsetX: 0, offsetY: 0 });
      }
    } catch {
      setOffsetState({ offsetX: 0, offsetY: 0 });
    }
  }, [currentTemplate?.id]);

  const setOffset = useCallback(
    (newOffset: CalibrationOffset) => {
      setOffsetState(newOffset);
      if (!currentTemplate) return;
      try {
        localStorage.setItem(`folium-offset-${currentTemplate.id}`, JSON.stringify(newOffset));
      } catch (e) {
        console.warn('Falha ao persistir offset no localStorage:', e);
      }
    },
    [currentTemplate]
  );

  // 2. Ajustes cromáticos
  const [colorAdjustments, setColorAdjustmentsState] = useState<ColorAdjustments>(() => {
    try {
      const saved = localStorage.getItem('folium-color-settings');
      return saved ? JSON.parse(saved) : DEFAULT_COLOR_ADJUSTMENTS;
    } catch {
      return DEFAULT_COLOR_ADJUSTMENTS;
    }
  });

  const setColorAdjustments = useCallback((newSettings: ColorAdjustments) => {
    setColorAdjustmentsState(newSettings);
    try {
      localStorage.setItem('folium-color-settings', JSON.stringify(newSettings));
    } catch {}
  }, []);

  // 3. Marcas de corte e sangria
  const [cropMarks, setCropMarksState] = useState<CropMarkSettings>(() => {
    try {
      const saved = localStorage.getItem('folium-crop-marks');
      return saved ? JSON.parse(saved) : DEFAULT_CROP_MARKS;
    } catch {
      return DEFAULT_CROP_MARKS;
    }
  });

  const setCropMarks = useCallback((newMarks: CropMarkSettings) => {
    setCropMarksState(newMarks);
    try {
      localStorage.setItem('folium-crop-marks', JSON.stringify(newMarks));
    } catch {}
  }, []);

  // 4. Seleção de papel e substrato
  const [paperSelection, setPaperSelectionState] = useState<PaperSelection>(() => {
    try {
      const saved = localStorage.getItem('folium-paper-selection');
      if (saved) return JSON.parse(saved);
    } catch {}
    if (currentTemplate?.category === 'thermal') {
      return { paperType: 'termico', weightGsm: 75 };
    }
    return { paperType: 'offset', weightGsm: 90 };
  });

  const setPaperSelection = useCallback((newSelection: PaperSelection) => {
    setPaperSelectionState(newSelection);
    try {
      localStorage.setItem('folium-paper-selection', JSON.stringify(newSelection));
    } catch {}
  }, []);

  useEffect(() => {
    if (!currentTemplate) return;
    setPaperSelectionState((prev) => {
      if (currentTemplate.category === 'thermal' && prev.paperType !== 'termico') {
        return { paperType: 'termico', weightGsm: 75 };
      }
      return prev;
    });
  }, [currentTemplate?.category]);

  return {
    offset,
    setOffset,
    colorAdjustments,
    setColorAdjustments,
    cropMarks,
    setCropMarks,
    paperSelection,
    setPaperSelection,
  };
}
