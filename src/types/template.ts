import { ReactNode } from 'react';

export type TemplateCategory = 'thermal' | 'a4-sheet' | 'document';

export type FieldType = 'text' | 'number' | 'date' | 'barcode' | 'qrcode' | 'svg' | 'textarea';

export type BarcodeFormat = 'CODE128' | 'EAN13';

export type DateFormat = 'DD/MM/YYYY' | 'DD/MM/AA' | 'DD/MM' | 'YYYY-MM-DD' | 'extended';

export type FontWeightOption = 'normal' | 'bold' | 'extra-bold' | 'bolder';

export interface TemplateField {
  key: string;
  label: string;
  type: FieldType;
  defaultValue?: string | number;
  required: boolean;
  placeholder?: string;
  barcodeFormat?: BarcodeFormat;
  helperText?: string;
  min?: number;
  max?: number;
  step?: number;
  // Positioning in physical millimeters
  xMm?: number;
  yMm?: number;
  widthMm?: number;
  heightMm?: number;
  fontSizePt?: number;
  fontWeight?: FontWeightOption;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  showBorder?: boolean;
  showLabel?: boolean;
  svgContent?: string;
  svgFill?: string;
  svgStroke?: string;
  svgStrokeWidth?: number;
  svgRotation?: 0 | 90 | 180 | 270;
  svgFlipH?: boolean;
  svgFlipV?: boolean;
  // Date formatting properties
  dateFormat?: DateFormat;
  datePrefix?: string;
  isAutoDate?: boolean;
  locked?: boolean;
  autoScaleFont?: boolean;
}

export interface TemplateDimensions {
  widthMm: number;
  heightMm: number;
  orientation: 'portrait' | 'landscape';
}

export interface TemplateGrid {
  rows: number;
  cols: number;
  marginTopMm: number;
  marginLeftMm: number;
  marginRightMm?: number;
  marginBottomMm?: number;
  gapX: number;
  gapY: number;
  labelWidthMm: number;
  labelHeightMm: number;
}

export interface CalibrationOffset {
  offsetX: number; // in mm
  offsetY: number; // in mm
}

export type TemplateFormData = Record<string, any>;

export interface TemplateRenderProps {
  data: TemplateFormData;
  offset?: CalibrationOffset;
  isPreview?: boolean;
  copyIndex?: number;
  copyTotal?: number;
  hideSingleCopy?: boolean;
}

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  dimensions: TemplateDimensions;
  grid?: TemplateGrid;
  fields: TemplateField[];
  backgroundSvg?: string;
  backgroundSvgFill?: string;
  backgroundSvgStroke?: string;
  backgroundSvgStrokeWidth?: number;
  backgroundSvgRotation?: 0 | 90 | 180 | 270;
  backgroundSvgFlipH?: boolean;
  backgroundSvgFlipV?: boolean;
  backgroundSvgOpacity?: number;
  isCustom?: boolean;
  defaultFontWeight?: FontWeightOption;
  render: (props: TemplateRenderProps) => ReactNode;
}

export type CustomTemplateDefinition = Omit<Template, 'render'>;

// Graphic Color Management
export type ColorMode = 'rgb' | 'cmyk-simulated';

export interface ColorAdjustments {
  mode: ColorMode;
  brightness: number; // -50 to +50
  contrast: number;   // -50 to +50
  saturation: number; // -50 to +50
}

// Automatic Crop Marks & Finishing (CorelDRAW Style)
export interface CropMarkSettings {
  enabled: boolean;
  bleedMm: number; // e.g. 0 to 5 mm
  showRegistrationMarks: boolean;
  showGridMarks: boolean;
  markLengthMm: number;
}

// Paper & Substrates
export type PaperType =
  | 'offset'
  | 'couche-brilho'
  | 'couche-fosco'
  | 'kraft'
  | 'adesivo-couche'
  | 'adesivo-vinil'
  | 'termico';

