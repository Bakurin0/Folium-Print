import { CustomTemplateDefinition, TemplateRenderProps } from '../types/template';
import { BarcodeSvg, QRCodeSvg } from '../components/CodeRenderer';
import { sanitizeSvg } from './sanitizeSvg';

// ponytail: Uses CSS mm-based absolute coordinates and inline SVG. Native browser layout without canvas/fabric.js dependency.
// Ceiling: Multi-layer z-index management and complex SVG path node-by-node vector editing is omitted.
// Upgrade path: Integrate full vector path editor (Paper.js / SVG.js) if path-level drawing is requested.
export const createDynamicRenderer = (template: CustomTemplateDefinition) => {
  return ({ data, offset = { offsetX: 0, offsetY: 0 } }: TemplateRenderProps) => {
    const { widthMm, heightMm } = template.dimensions;

    // Helper to render the inner fields of a single label/document
    const renderFields = (scopeWidth: number, _scopeHeight: number) => {
      const hasPositionedFields = template.fields.some(
        (f) => typeof f.xMm === 'number' && typeof f.yMm === 'number'
      );

      if (hasPositionedFields) {
        return template.fields.map((field) => {
          const x = field.xMm ?? 2;
          const y = field.yMm ?? 2;
          const w = field.widthMm ?? scopeWidth - 4;
          const h = field.heightMm ?? 8;
          const val = data[field.key] !== undefined ? data[field.key] : (field.defaultValue ?? '');

          return (
            <div
              key={field.key}
              style={{
                position: 'absolute',
                left: `${x}mm`,
                top: `${y}mm`,
                width: `${w}mm`,
                height: `${h}mm`,
                boxSizing: 'border-box',
                overflow: 'hidden',
                textAlign: field.textAlign || 'left',
                fontSize: `${field.fontSizePt || 8.5}pt`,
                fontWeight: field.fontWeight === 'bolder' ? 900 : field.fontWeight === 'bold' ? 700 : 400,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                border: field.showBorder ? '0.5px solid #000000' : 'none',
                padding: field.showBorder ? '0.5mm' : '0mm',
              }}
            >
              {field.type === 'svg' ? (
                <div
                  className="w-full h-full flex items-center justify-center overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: sanitizeSvg(field.svgContent || String(val) || '<svg></svg>') }}
                />
              ) : field.type === 'qrcode' ? (
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                  <QRCodeSvg value={String(val || '00000')} size={Math.min(w, h) * 3.78} />
                </div>
              ) : field.type === 'barcode' ? (
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                  <BarcodeSvg
                    value={String(val || '000000')}
                    format={field.barcodeFormat || 'CODE128'}
                    height={Math.max(12, h * 3.2)}
                    width={w > 40 ? 1.6 : 1.1}
                    displayValue={true}
                    fontSize={field.fontSizePt || 8}
                  />
                </div>
              ) : (
                <div className="w-full">
                  {field.showLabel && (
                    <span className="text-[7pt] text-gray-600 uppercase font-semibold mr-1">
                      {field.label}:
                    </span>
                  )}
                  <span className="break-words leading-tight">{String(val || '')}</span>
                </div>
              )}
            </div>
          );
        });
      }

      /* Fallback auto-flowing flexbox layout */
      return (
        <div className="p-2 w-full h-full flex flex-col justify-between">
          {template.fields.map((field) => {
            const val = data[field.key] !== undefined ? data[field.key] : (field.defaultValue ?? '');
            if (field.type === 'barcode') {
              return (
                <div key={field.key} className="flex justify-center py-1">
                  <BarcodeSvg value={String(val || '00000')} format={field.barcodeFormat} />
                </div>
              );
            }
            if (field.type === 'qrcode') {
              return (
                <div key={field.key} className="flex justify-center py-1">
                  <QRCodeSvg value={String(val || '00000')} size={40} />
                </div>
              );
            }
            return (
              <div key={field.key} className="text-xs">
                <span className="font-bold text-gray-600 text-[10px] mr-1">{field.label}:</span>
                <span>{String(val || '')}</span>
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div
        style={{
          width: `${widthMm}mm`,
          height: `${heightMm}mm`,
          boxSizing: 'border-box',
          transform: `translate(${offset.offsetX}mm, ${offset.offsetY}mm)`,
          transformOrigin: 'top left',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: '#000000',
          backgroundColor: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="text-black text-left leading-tight"
      >
        {/* Background SVG / Frame / Logo */}
        {template.backgroundSvg && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-90"
            dangerouslySetInnerHTML={{ __html: sanitizeSvg(template.backgroundSvg) }}
          />
        )}

        {/* If template defines a sheet grid, render grid cells */}
        {template.grid ? (
          (() => {
            const { rows, cols, marginTopMm, marginLeftMm, gapX, gapY, labelWidthMm, labelHeightMm } = template.grid;
            const totalCells = rows * cols;
            const startPosition = Number(data._gridStartPosition ?? 0);
            const copies = Number(data._gridCopies ?? totalCells);
            const cells = [];

            for (let idx = 0; idx < totalCells; idx++) {
              const r = Math.floor(idx / cols);
              const c = idx % cols;
              const top = marginTopMm + r * (labelHeightMm + gapY);
              const left = marginLeftMm + c * (labelWidthMm + gapX);
              const isFilled = idx >= startPosition && idx < startPosition + copies;

              cells.push(
                <div
                  key={`grid-cell-${idx}`}
                  style={{
                    position: 'absolute',
                    top: `${top}mm`,
                    left: `${left}mm`,
                    width: `${labelWidthMm}mm`,
                    height: `${labelHeightMm}mm`,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    border: '0.2mm dashed rgba(0,0,0,0.1)',
                  }}
                >
                  {isFilled && renderFields(labelWidthMm, labelHeightMm)}
                </div>
              );
            }
            return cells;
          })()
        ) : (
          renderFields(widthMm, heightMm)
        )}
      </div>
    );
  };
};
