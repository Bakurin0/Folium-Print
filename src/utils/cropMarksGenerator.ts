import { TemplateGrid, CropMarkSettings } from '../types/template';

export interface CropMarksOptions {
  widthMm: number;
  heightMm: number;
  grid?: TemplateGrid;
  settings: CropMarkSettings;
}

/**
 * Gerador de Marcas de Corte e Alvos de Registro padrão gráfico profissional (CorelDRAW / InDesign).
 * Gera traços finos (0.15mm) nas quinas e interseções com afastamento de segurança de 1mm,
 * garantindo que as linhas de corte apontem com exatidão sem sobrepor a arte física.
 */
export const generateCropMarksSvg = ({
  widthMm,
  heightMm,
  grid,
  settings,
}: CropMarksOptions): string => {
  if (!settings.enabled) return '';

  const { bleedMm, showRegistrationMarks, showGridMarks, markLengthMm } = settings;
  const strokeWidth = 0.15; // 0.15 mm (~0.42pt padrão gráfico)
  const strokeColor = '#000000';
  const gapMm = 1.0; // Afastamento de segurança entre a quina de corte e o início do traço
  const lines: string[] = [];

  // Helper para adicionar segmento de linha
  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
    lines.push(
      `<line x1="${x1.toFixed(3)}" y1="${y1.toFixed(3)}" x2="${x2.toFixed(3)}" y2="${y2.toFixed(3)}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="square" />`
    );
  };

  // Helper para adicionar alvo circular de registro com mira central
  const addRegistrationTarget = (cx: number, cy: number, radiusMm: number = 2.8) => {
    const ext = radiusMm + 1.2;
    lines.push(`
      <g>
        <circle cx="${cx.toFixed(3)}" cy="${cy.toFixed(3)}" r="${radiusMm.toFixed(3)}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
        <circle cx="${cx.toFixed(3)}" cy="${cy.toFixed(3)}" r="${(radiusMm * 0.45).toFixed(3)}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
        <line x1="${(cx - ext).toFixed(3)}" y1="${cy.toFixed(3)}" x2="${(cx + ext).toFixed(3)}" y2="${cy.toFixed(3)}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
        <line x1="${cx.toFixed(3)}" y1="${(cy - ext).toFixed(3)}" x2="${cx.toFixed(3)}" y2="${(cy + ext).toFixed(3)}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
      </g>
    `);
  };

  if (grid) {
    // 1. Marcas para folhas com matriz de etiquetas (A4/A3)
    const { rows, cols, marginTopMm, marginLeftMm, gapX, gapY, labelWidthMm, labelHeightMm } = grid;

    // Coleta todas as coordenadas verticais de corte (X em mm)
    const xCoords: number[] = [];
    for (let c = 0; c < cols; c++) {
      const left = marginLeftMm + c * (labelWidthMm + gapX);
      const right = left + labelWidthMm;
      xCoords.push(left);
      xCoords.push(right);
    }

    // Coleta todas as coordenadas horizontais de corte (Y em mm)
    const yCoords: number[] = [];
    for (let r = 0; r < rows; r++) {
      const top = marginTopMm + r * (labelHeightMm + gapY);
      const bottom = top + labelHeightMm;
      yCoords.push(top);
      yCoords.push(bottom);
    }

    // Ticks perimetrais do topo
    xCoords.forEach((x) => {
      addLine(x, marginTopMm - gapMm - markLengthMm, x, marginTopMm - gapMm);
    });

    // Ticks perimetrais da base
    const bottomCutBoundary = marginTopMm + rows * labelHeightMm + (rows - 1) * gapY;
    xCoords.forEach((x) => {
      addLine(x, bottomCutBoundary + gapMm, x, bottomCutBoundary + gapMm + markLengthMm);
    });

    // Ticks perimetrais da esquerda
    yCoords.forEach((y) => {
      addLine(marginLeftMm - gapMm - markLengthMm, y, marginLeftMm - gapMm, y);
    });

    // Ticks perimetrais da direita
    const rightCutBoundary = marginLeftMm + cols * labelWidthMm + (cols - 1) * gapX;
    yCoords.forEach((y) => {
      addLine(rightCutBoundary + gapMm, y, rightCutBoundary + gapMm + markLengthMm, y);
    });

    // Cruzetas internas de interseção na grade (quando há espaçamento entre etiquetas)
    if (showGridMarks && (cols > 1 || rows > 1)) {
      for (let r = 1; r < rows; r++) {
        const yTop = marginTopMm + r * (labelHeightMm + gapY);
        for (let c = 1; c < cols; c++) {
          const xLeft = marginLeftMm + c * (labelWidthMm + gapX);
          const half = 1.5;
          addLine(xLeft - half, yTop, xLeft + half, yTop);
          addLine(xLeft, yTop - half, xLeft, yTop + half);
        }
      }
    }
  } else {
    // 2. Marcas para documento avulso / etiqueta única (4 quinas em formato "L")
    const left = bleedMm > 0 ? bleedMm : 0;
    const top = bleedMm > 0 ? bleedMm : 0;
    const right = bleedMm > 0 ? widthMm - bleedMm : widthMm;
    const bottom = bleedMm > 0 ? heightMm - bleedMm : heightMm;

    // Canto Superior Esquerdo
    addLine(left, top - gapMm - markLengthMm, left, top - gapMm);
    addLine(left - gapMm - markLengthMm, top, left - gapMm, top);

    // Canto Superior Direito
    addLine(right, top - gapMm - markLengthMm, right, top - gapMm);
    addLine(right + gapMm, top, right + gapMm + markLengthMm, top);

    // Canto Inferior Esquerdo
    addLine(left, bottom + gapMm, left, bottom + gapMm + markLengthMm);
    addLine(left - gapMm - markLengthMm, bottom, left - gapMm, bottom);

    // Canto Inferior Direito
    addLine(right, bottom + gapMm, right, bottom + gapMm + markLengthMm);
    addLine(right + gapMm, bottom, right + gapMm + markLengthMm, bottom);
  }

  // 3. Alvos de Registro Centrais (Top, Bottom, Left, Right)
  if (showRegistrationMarks) {
    const targetDistanceMm = 4.0; // Distância segura a partir da borda externa do documento
    addRegistrationTarget(widthMm / 2, targetDistanceMm);
    addRegistrationTarget(widthMm / 2, heightMm - targetDistanceMm);
    addRegistrationTarget(targetDistanceMm, heightMm / 2);
    addRegistrationTarget(widthMm - targetDistanceMm, heightMm / 2);
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
