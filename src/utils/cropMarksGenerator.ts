import { TemplateGrid, CropMarkSettings } from '../types/template';

export interface CropMarksOptions {
  widthMm: number;
  heightMm: number;
  grid?: TemplateGrid;
  settings: CropMarkSettings;
}

export const generateCropMarksSvg = ({
  widthMm,
  heightMm,
  grid,
  settings,
}: CropMarksOptions): string => {
  if (!settings.enabled) return '';

  const { bleedMm, showRegistrationMarks, showGridMarks, markLengthMm } = settings;
  const strokeWidth = 0.15; // 0.15 mm (~0.4pt standard graphic crop mark)
  const strokeColor = '#000000';
  const lines: string[] = [];

  // Helper to add a line
  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
    lines.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="square" />`
    );
  };

  // Helper to add a registration target (CorelDRAW / Pre-press target)
  const addRegistrationTarget = (cx: number, cy: number, radiusMm: number = 3) => {
    lines.push(`
      <g>
        <circle cx="${cx}" cy="${cy}" r="${radiusMm}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
        <circle cx="${cx}" cy="${cy}" r="${radiusMm * 0.5}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
        <line x1="${cx - radiusMm - 1.5}" y1="${cy}" x2="${cx + radiusMm + 1.5}" y2="${cy}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
        <line x1="${cx}" y1="${cy - radiusMm - 1.5}" x2="${cx}" y2="${cy + radiusMm + 1.5}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
      </g>
    `);
  };

  if (grid) {
    // Grid-based crop marks (e.g., A4/A3 sheet with business cards or labels)
    const { rows, cols, marginTopMm, marginLeftMm, gapX, gapY, labelWidthMm, labelHeightMm } = grid;

    // Collect all vertical cut coordinates (X in mm)
    const xCoords: number[] = [];
    for (let c = 0; c < cols; c++) {
      const left = marginLeftMm + c * (labelWidthMm + gapX);
      const right = left + labelWidthMm;
      xCoords.push(left);
      xCoords.push(right);
    }

    // Collect all horizontal cut coordinates (Y in mm)
    const yCoords: number[] = [];
    for (let r = 0; r < rows; r++) {
      const top = marginTopMm + r * (labelHeightMm + gapY);
      const bottom = top + labelHeightMm;
      yCoords.push(top);
      yCoords.push(bottom);
    }

    // Top margin tick marks
    xCoords.forEach((x) => {
      addLine(x, Math.max(0, marginTopMm - markLengthMm - 1), x, marginTopMm - 1);
    });

    // Bottom margin tick marks
    const bottomCutBoundary = marginTopMm + rows * labelHeightMm + (rows - 1) * gapY;
    xCoords.forEach((x) => {
      addLine(x, bottomCutBoundary + 1, x, Math.min(heightMm, bottomCutBoundary + markLengthMm + 1));
    });

    // Left margin tick marks
    yCoords.forEach((y) => {
      addLine(Math.max(0, marginLeftMm - markLengthMm - 1), y, marginLeftMm - 1, y);
    });

    // Right margin tick marks
    const rightCutBoundary = marginLeftMm + cols * labelWidthMm + (cols - 1) * gapX;
    yCoords.forEach((y) => {
      addLine(rightCutBoundary + 1, y, Math.min(widthMm, rightCutBoundary + markLengthMm + 1), y);
    });

    // Internal grid intersection marks if enabled
    if (showGridMarks && (cols > 1 || rows > 1)) {
      for (let r = 1; r < rows; r++) {
        const yTop = marginTopMm + r * (labelHeightMm + gapY);
        for (let c = 1; c < cols; c++) {
          const xLeft = marginLeftMm + c * (labelWidthMm + gapX);
          // small crosshair in gutter/intersection
          const half = 1.5;
          addLine(xLeft - half, yTop, xLeft + half, yTop);
          addLine(xLeft, yTop - half, xLeft, yTop + half);
        }
      }
    }
  } else {
    // Single Document Crop Marks (Outer 4 corners)
    const left = bleedMm;
    const top = bleedMm;
    const right = widthMm - bleedMm;
    const bottom = heightMm - bleedMm;

    // Top-Left Corner
    addLine(left, Math.max(0, top - markLengthMm - 1), left, Math.max(0, top - 1));
    addLine(Math.max(0, left - markLengthMm - 1), top, Math.max(0, left - 1), top);

    // Top-Right Corner
    addLine(right, Math.max(0, top - markLengthMm - 1), right, Math.max(0, top - 1));
    addLine(Math.min(widthMm, right + 1), top, Math.min(widthMm, right + markLengthMm + 1), top);

    // Bottom-Left Corner
    addLine(left, Math.min(heightMm, bottom + 1), left, Math.min(heightMm, bottom + markLengthMm + 1));
    addLine(Math.max(0, left - markLengthMm - 1), bottom, Math.max(0, left - 1), bottom);

    // Bottom-Right Corner
    addLine(right, Math.min(heightMm, bottom + 1), right, Math.min(heightMm, bottom + markLengthMm + 1));
    addLine(Math.min(widthMm, right + 1), bottom, Math.min(widthMm, right + markLengthMm + 1), bottom);
  }

  // Registration Marks (Top, Bottom, Left, Right Centers)
  if (showRegistrationMarks) {
    const targetOffset = 4.5; // mm from page edge
    addRegistrationTarget(widthMm / 2, targetOffset);
    addRegistrationTarget(widthMm / 2, heightMm - targetOffset);
    addRegistrationTarget(targetOffset, heightMm / 2);
    addRegistrationTarget(widthMm - targetOffset, heightMm / 2);
  }

  return `
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 ${widthMm} ${heightMm}" 
      width="${widthMm}mm" 
      height="${heightMm}mm" 
      style="position: absolute; inset: 0; pointer-events: none; z-index: 50; overflow: visible;"
    >
      ${lines.join('\n')}
    </svg>
  `;
};
