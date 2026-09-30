import { CustomTemplateDefinition, TemplateRenderProps } from '../types/template';
import { BarcodeSvg, QRCodeSvg } from '../components/CodeRenderer';
import { resolveCopyTokens } from './paginationTokens';
import { formatDate, getTodayFormatted } from './dateUtils';
import { applySvgAdjustments, getSvgTransformStyle } from './svgTransform';

// ponytail: Uses CSS mm-based absolute coordinates and inline SVG. Native browser layout without canvas/fabric.js dependency.
// Ceiling: Multi-layer z-index management and complex SVG path node-by-node vector editing is omitted.
// Upgrade path: Integrate full vector path editor (Paper.js / SVG.js) if path-level drawing is requested.
export const createDynamicRenderer = (template: CustomTemplateDefinition) => {
  return ({
    data,
    offset = { offsetX: 0, offsetY: 0 },
    isPreview = false,
    copyIndex: propCopyIndex,
    copyTotal: propCopyTotal,
    hideSingleCopy: propHideSingleCopy,
  }: TemplateRenderProps) => {
    const { widthMm, heightMm } = template.dimensions;
    const shouldHideSingle = propHideSingleCopy ?? (data._hideSingleCopy !== false);

    // Helper to render the inner fields of a single label/document
    const renderFields = (
      scopeWidth: number,
      _scopeHeight: number,
      activeCopyIndex: number = 1,
      activeCopyTotal: number = 1
    ) => {
      const hasPositionedFields = template.fields.some(
        (f) => typeof f.xMm === 'number' && typeof f.yMm === 'number'
      );

      if (hasPositionedFields) {
        return template.fields.map((field) => {
          const x = field.xMm ?? 2;
          const y = field.yMm ?? 2;
          const w = field.widthMm ?? scopeWidth - 4;
          const h = field.heightMm ?? 8;
          const rawVal = field.locked
            ? (field.defaultValue ?? '')
            : (data[field.key] !== undefined ? data[field.key] : (field.defaultValue ?? ''));
          const isCodeOrSvg = field.type === 'svg' || field.type === 'qrcode' || field.type === 'barcode';
          
          let resolvedVal = rawVal;
          if (field.type === 'date' || field.isAutoDate) {
            if (!rawVal && (field.isAutoDate || field.defaultValue === 'today')) {
              resolvedVal = getTodayFormatted(field.dateFormat, field.datePrefix);
            } else if (rawVal) {
              resolvedVal = formatDate(String(rawVal), field.dateFormat, field.datePrefix);
            }
          }

          const val = isCodeOrSvg
            ? rawVal
            : resolveCopyTokens(String(resolvedVal ?? ''), activeCopyIndex, activeCopyTotal, shouldHideSingle);

          const isOmittedBySingleCopy =
            !isCodeOrSvg &&
            !val &&
            shouldHideSingle &&
            activeCopyTotal <= 1 &&
            /\{(?:copia|cópia|volume|total|volumes)\}/i.test(String(rawVal ?? ''));

          if (isOmittedBySingleCopy) {
            return null;
          }

          const vAlign = field.verticalAlign || ((field.heightMm ?? 8) >= 14 ? 'top' : 'middle');
          const justifyContent = vAlign === 'top' ? 'flex-start' : vAlign === 'bottom' ? 'flex-end' : 'center';

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
                justifyContent,
                border: field.showBorder ? '0.5px solid #000000' : 'none',
                padding: field.showBorder ? '0.5mm' : '0mm',
              }}
            >
              {field.type === 'svg' ? (
                <div
                  className="w-full h-full flex items-center justify-center overflow-hidden"
                  style={getSvgTransformStyle({
                    rotation: field.svgRotation,
                    flipH: field.svgFlipH,
                    flipV: field.svgFlipV,
                  })}
                  dangerouslySetInnerHTML={{
                    __html: applySvgAdjustments(field.svgContent || String(val) || '<svg></svg>', {
                      fill: field.svgFill,
                      stroke: field.svgStroke,
                      strokeWidth: field.svgStrokeWidth,
                    }),
                  }}
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
                <div className="w-full text-black break-words whitespace-pre-wrap leading-snug">
                  {field.showLabel && (
                    <span className={`mr-1 ${!val && isPreview ? 'opacity-40' : ''}`}>
                      {field.label.endsWith(':') ? field.label : `${field.label}:`}
                    </span>
                  )}
                  {val ? (
                    <span className="break-words leading-snug">{String(val)}</span>
                  ) : isPreview ? (
                    <span className="break-words leading-snug opacity-30 italic font-normal">
                      {field.placeholder || field.defaultValue || '—'}
                    </span>
                  ) : null}
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
            const rawVal = data[field.key] !== undefined ? data[field.key] : (field.defaultValue ?? '');
            const isCode = field.type === 'barcode' || field.type === 'qrcode';
            const val = isCode
              ? rawVal
              : resolveCopyTokens(String(rawVal ?? ''), activeCopyIndex, activeCopyTotal, shouldHideSingle);

            const isOmittedBySingleCopy =
              !isCode &&
              !val &&
              shouldHideSingle &&
              activeCopyTotal <= 1 &&
              /\{(?:copia|cópia|volume|total|volumes)\}/i.test(String(rawVal ?? ''));

            if (isOmittedBySingleCopy) {
              return null;
            }

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
              <div key={field.key} className="text-xs text-black">
                <span className="mr-1">{field.label.endsWith(':') ? field.label : `${field.label}:`}</span>
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
            className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center"
            style={{
              opacity: template.backgroundSvgOpacity ?? 0.9,
              ...getSvgTransformStyle({
                rotation: template.backgroundSvgRotation,
                flipH: template.backgroundSvgFlipH,
                flipV: template.backgroundSvgFlipV,
              }),
            }}
            dangerouslySetInnerHTML={{
              __html: applySvgAdjustments(template.backgroundSvg, {
                fill: template.backgroundSvgFill,
                stroke: template.backgroundSvgStroke,
                strokeWidth: template.backgroundSvgStrokeWidth,
              }),
            }}
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
              const currentCopyIndex = isFilled ? idx - startPosition + 1 : 1;

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
                  {isFilled && renderFields(labelWidthMm, labelHeightMm, currentCopyIndex, copies)}
                </div>
              );
            }
            return cells;
          })()
        ) : (
          (() => {
            const singleCopyIndex = propCopyIndex ?? Number(data._previewCopyIndex ?? 1);
            const singleCopyTotal = propCopyTotal ?? Number(data._thermalCopies ?? 1);
            return renderFields(widthMm, heightMm, singleCopyIndex, singleCopyTotal);
          })()
        )}
      </div>
    );
  };
};
