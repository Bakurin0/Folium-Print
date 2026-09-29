import { ReactNode } from 'react';

export type TemplateCategory = 'thermal' | 'a4-sheet' | 'document';

export type FieldType = 'text' | 'number' | 'date' | 'barcode' | 'qrcode' | 'svg';

export type BarcodeFormat = 'CODE128' | 'EAN13';

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
  fontWeight?: 'normal' | 'bold' | 'bolder';
  textAlign?: 'left' | 'center' | 'right';
  showBorder?: boolean;
  showLabel?: boolean;
  svgContent?: string;
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
  isCustom?: boolean;
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

