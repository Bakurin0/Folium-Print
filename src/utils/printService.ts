import { Template, CalibrationOffset, ColorAdjustments } from '../types/template';

export interface PrintOptions {
  template: Template;
  htmlContent: string;
  offset: CalibrationOffset;
  colorAdjustments?: ColorAdjustments;
}

export const executePixelPerfectPrint = ({
  template,
  htmlContent,
  offset,
  colorAdjustments,
}: PrintOptions): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      console.log(`[Folium Print] Executando impressão para "${template.name}" com offset: X=${offset.offsetX}mm, Y=${offset.offsetY}mm`);
      // Find or create hidden print iframe
      const iframeId = 'folium-print-hidden-iframe';
      let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;

      if (iframe) {
        document.body.removeChild(iframe);
      }

      iframe = document.createElement('iframe');
      iframe.id = iframeId;
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';
      iframe.style.zIndex = '-9999';

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        throw new Error('Falha ao instanciar contexto de impressão isolado.');
      }

      // Collect stylesheets from current document
      const styleSheets = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((node) => node.outerHTML)
        .join('\n');

      const widthMm = template.dimensions.widthMm;
      const heightMm = template.dimensions.heightMm;

      // Compute color filter for print output
      let filterCss = 'none';
      if (colorAdjustments) {
        const b = 1 + (colorAdjustments.brightness || 0) / 100;
        const c = 1 + (colorAdjustments.contrast || 0) / 100;
        const s = 1 + (colorAdjustments.saturation || 0) / 100;
        const cmykEffect =
          colorAdjustments.mode === 'cmyk-simulated'
            ? 'sepia(0.04) hue-rotate(-2deg)'
            : '';
        filterCss = `brightness(${b}) contrast(${c}) saturate(${s}) ${cmykEffect}`.trim();
      }

      // Build strictly calibrated CSS Paged Media document
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8">
            <title>Folium Print - ${template.name}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
            ${styleSheets}
            <style>
              @page {
                size: ${widthMm}mm ${heightMm}mm;
                margin: 0 !important;
              }
              
              @media print {
                html, body {
                  width: ${widthMm}mm !important;
                  height: ${heightMm}mm !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background-color: #ffffff !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                  overflow: hidden !important;
                }
                
                .no-print {
                  display: none !important;
                }
              }

              html, body {
                margin: 0;
                padding: 0;
                width: ${widthMm}mm;
                height: ${heightMm}mm;
                box-sizing: border-box;
                background-color: #ffffff;
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
              }

              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            </style>
          </head>
          <body>
            <div id="print-root" style="width:${widthMm}mm; height:${heightMm}mm; overflow:hidden; filter:${filterCss};">
              ${htmlContent}
            </div>
          </body>
        </html>
      `);
      doc.close();

      // Wait for fonts/SVGs to be fully ready before calling print
      setTimeout(() => {
        try {
          iframe?.contentWindow?.focus();
          iframe?.contentWindow?.print();
          resolve(true);
        } catch (e) {
          reject(e);
        }
      }, 350);
    } catch (error) {
      console.error('Print execution failure:', error);
      reject(error);
    }
  });
};
