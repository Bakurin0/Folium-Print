import { CustomTemplateDefinition, TemplateField } from '../types/template';
import { sanitizeSvg } from './sanitizeSvg';

export type ExportFormat = 'folium' | 'json' | 'html';

export interface ImportResult {
  success: boolean;
  data?: Partial<CustomTemplateDefinition>;
  error?: string;
}

/**
 * Dispara o download de um arquivo no navegador utilizando Blob e URL temporária.
 */
const triggerFileDownload = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

/**
 * Sanitiza o nome do arquivo para evitar caracteres ilegais no sistema operacional.
 */
const getCleanFilename = (name: string, extension: string): string => {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9_-]/gi, '-').replace(/-+/g, '-');
  return `${base || 'modelo'}.${extension}`;
};

/**
 * Gera uma página HTML autônoma pronta para abrir e imprimir diretamente no navegador.
 */
export const generatePrintableHtml = (template: CustomTemplateDefinition): string => {
  const { widthMm, heightMm } = template.dimensions;
  
  const fieldsHtml = template.fields.map((field) => {
    const x = field.xMm ?? 0;
    const y = field.yMm ?? 0;
    const w = field.widthMm ?? widthMm;
    const h = field.heightMm ?? 8;
    const fontSize = field.fontSizePt ?? 9;
    const fontWeight = field.fontWeight ?? 'normal';
    const textAlign = field.textAlign ?? 'left';
    const content = field.defaultValue || field.label || '';

    return `
      <div style="
        position: absolute;
        left: ${x}mm;
        top: ${y}mm;
        width: ${w}mm;
        height: ${h}mm;
        font-size: ${fontSize}pt;
        font-weight: ${fontWeight};
        text-align: ${textAlign};
        overflow: hidden;
        display: flex;
        align-items: center;
        line-height: 1.15;
      ">
        <span>${content}</span>
      </div>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${template.name} - Folium Print</title>
  <style>
    @page {
      size: ${widthMm}mm ${heightMm}mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #ffffff;
      color: #000000;
      position: relative;
      overflow: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .background-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
    .background-layer svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .content-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
    }
  </style>
</head>
<body>
  ${template.backgroundSvg ? `<div class="background-layer">${template.backgroundSvg}</div>` : ''}
  <div class="content-layer">
    ${fieldsHtml}
  </div>
</body>
</html>`;
};

/**
 * Exporta a definição de um modelo como arquivo (.folium, .json ou .html).
 */
export const exportTemplateAsFile = (
  template: CustomTemplateDefinition,
  format: ExportFormat
): void => {
  if (format === 'folium') {
    const jsonStr = JSON.stringify(template, null, 2);
    triggerFileDownload(jsonStr, getCleanFilename(template.name, 'folium'), 'application/json');
  } else if (format === 'json') {
    const jsonStr = JSON.stringify(template, null, 2);
    triggerFileDownload(jsonStr, getCleanFilename(template.name, 'json'), 'application/json');
  } else if (format === 'html') {
    const htmlStr = generatePrintableHtml(template);
    triggerFileDownload(htmlStr, getCleanFilename(template.name, 'html'), 'text/html');
  }
};

/**
 * Importa um arquivo local (.folium, .json, .svg, .html) e o converte para CustomTemplateDefinition.
 */
export const importTemplateFromFile = async (file: File): Promise<ImportResult> => {
  const fileName = file.name.toLowerCase();
  const rawText = await file.text();

  try {
    // 1. Arquivo nativo .folium ou .json
    if (fileName.endsWith('.folium') || fileName.endsWith('.json')) {
      const parsed = JSON.parse(rawText);

      // Validação mínima de integridade do modelo
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'O arquivo não contém uma estrutura JSON válida.' };
      }

      if (!parsed.dimensions || typeof parsed.dimensions.widthMm !== 'number' || typeof parsed.dimensions.heightMm !== 'number') {
        return { success: false, error: 'O modelo deve conter dimensões válidas (widthMm e heightMm).' };
      }

      const importedTemplate: Partial<CustomTemplateDefinition> = {
        name: parsed.name || file.name.replace(/\.[^/.]+$/, ''),
        category: parsed.category === 'document' ? 'document' : 'thermal',
        description: parsed.description || 'Modelo importado de arquivo',
        dimensions: {
          widthMm: parsed.dimensions.widthMm,
          heightMm: parsed.dimensions.heightMm,
          orientation: parsed.dimensions.orientation || (parsed.dimensions.widthMm >= parsed.dimensions.heightMm ? 'landscape' : 'portrait'),
        },
        fields: Array.isArray(parsed.fields) ? parsed.fields : [],
        backgroundSvg: parsed.backgroundSvg ? sanitizeSvg(parsed.backgroundSvg) : undefined,
      };

      return { success: true, data: importedTemplate };
    }

    // 2. Arquivo vetorial .svg
    if (fileName.endsWith('.svg')) {
      const sanitized = sanitizeSvg(rawText);
      const parser = new DOMParser();
      const doc = parser.parseFromString(sanitized, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');

      if (!svgEl) {
        return { success: false, error: 'Não foi possível encontrar a tag <svg> no arquivo selecionado.' };
      }

      let detectedWidth = 100;
      let detectedHeight = 50;

      // Tenta extrair largura e altura do viewBox ou atributos
      const viewBox = svgEl.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(/[\s,]+/).map(Number);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          detectedWidth = Math.round(parts[2]);
          detectedHeight = Math.round(parts[3]);
        }
      } else {
        const wAttr = parseFloat(svgEl.getAttribute('width') || '');
        const hAttr = parseFloat(svgEl.getAttribute('height') || '');
        if (!isNaN(wAttr) && !isNaN(hAttr) && wAttr > 0 && hAttr > 0) {
          detectedWidth = Math.round(wAttr);
          detectedHeight = Math.round(hAttr);
        }
      }

      // Normaliza proporções caso sejam valores em pixels elevados
      if (detectedWidth > 300) {
        const ratio = detectedHeight / detectedWidth;
        detectedWidth = 100;
        detectedHeight = Math.round(100 * ratio);
      }

      const cleanTitle = file.name
        .replace(/\.svg$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const svgTemplate: Partial<CustomTemplateDefinition> = {
        name: cleanTitle,
        category: 'thermal',
        description: `Modelo gerado a partir do vetor SVG ${file.name}`,
        dimensions: {
          widthMm: detectedWidth,
          heightMm: detectedHeight,
          orientation: detectedWidth >= detectedHeight ? 'landscape' : 'portrait',
        },
        backgroundSvg: sanitized,
        fields: [
          {
            key: 'campo_principal',
            label: 'Texto Principal',
            type: 'text',
            required: true,
            defaultValue: cleanTitle,
            xMm: 5,
            yMm: 5,
            widthMm: Math.max(20, detectedWidth - 10),
            heightMm: 8,
            fontSizePt: 10,
            fontWeight: 'bold',
          },
        ],
      };

      return { success: true, data: svgTemplate };
    }

    // 3. Arquivo de layout .html ou .htm
    if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawText, 'text/html');

      // Procura por nós de texto relevantes para criar campos
      const textNodes: string[] = [];
      const walker = doc.createTreeWalker(doc.body || doc, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent?.trim();
        if (text && text.length > 1 && !text.includes('{') && !text.includes('}')) {
          textNodes.push(text);
        }
      }

      const cleanTitle = file.name
        .replace(/\.html?$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const fields: TemplateField[] = textNodes.slice(0, 6).map((text, idx) => ({
        key: `campo_${idx + 1}`,
        label: text.slice(0, 20),
        type: 'text',
        required: true,
        defaultValue: text,
        xMm: 5,
        yMm: 6 + idx * 9,
        widthMm: 90,
        heightMm: 7,
        fontSizePt: idx === 0 ? 11 : 9,
        fontWeight: idx === 0 ? 'bold' : 'normal',
      }));

      const htmlTemplate: Partial<CustomTemplateDefinition> = {
        name: cleanTitle,
        category: 'thermal',
        description: `Modelo extraído de documento HTML ${file.name}`,
        dimensions: {
          widthMm: 100,
          heightMm: Math.max(50, fields.length * 10 + 15),
          orientation: 'landscape',
        },
        fields: fields.length > 0 ? fields : [
          {
            key: 'conteudo',
            label: 'Conteúdo',
            type: 'text',
            required: true,
            defaultValue: 'Conteúdo do HTML',
            xMm: 5,
            yMm: 5,
            widthMm: 90,
            heightMm: 8,
            fontSizePt: 10,
          },
        ],
      };

      return { success: true, data: htmlTemplate };
    }

    return {
      success: false,
      error: 'Formato de arquivo não suportado. Por favor, utilize arquivos .folium, .json, .svg ou .html.',
    };
  } catch (err) {
    return {
      success: false,
      error: `Erro ao processar o arquivo: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
};
