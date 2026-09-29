import React, { useMemo } from 'react';
import { MM_TO_PX } from '../utils/units';

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  lengthMm: number;
  scale: number;
  cursorPosMm: number | null;
}

/**
 * Régua Milimétrica Ótica estilo macOS Studio / Apple HIG.
 * Renderiza marcações finas (1mm, 5mm, 10mm) com indicador dinâmico do cursor do mouse.
 */
export const Ruler: React.FC<RulerProps> = ({
  orientation,
  lengthMm,
  scale,
  cursorPosMm,
}) => {
  const isHorizontal = orientation === 'horizontal';
  const totalPx = lengthMm * MM_TO_PX * scale;
  const majorStepMm = 10;
  const mediumStepMm = 5;

  // Gera as marcações da régua em SVG para nitidez vetorial pura
  const ticks = useMemo(() => {
    const list: React.ReactNode[] = [];
    const count = Math.ceil(lengthMm);

    for (let mm = 0; mm <= count; mm++) {
      const posPx = mm * MM_TO_PX * scale;
      const isMajor = mm % majorStepMm === 0;
      const isMedium = !isMajor && mm % mediumStepMm === 0;
      const tickLength = isMajor ? 12 : isMedium ? 7 : 4;

      if (isHorizontal) {
        list.push(
          <line
            key={`tick-${mm}`}
            x1={posPx}
            y1={18 - tickLength}
            x2={posPx}
            y2={18}
            stroke="currentColor"
            strokeWidth={isMajor ? 1 : 0.6}
            className={isMajor ? 'text-foreground-primary/50' : 'text-foreground-muted/30'}
          />
        );

        if (isMajor && mm > 0 && mm < count) {
          list.push(
            <text
              key={`text-${mm}`}
              x={posPx + 2}
              y={8}
              fontSize={8.5}
              fontFamily="var(--font-mono, monospace)"
              className="fill-foreground-muted select-none text-[8.5px]"
            >
              {mm}
            </text>
          );
        }
      } else {
        list.push(
          <line
            key={`tick-${mm}`}
            x1={18 - tickLength}
            y1={posPx}
            x2={18}
            y2={posPx}
            stroke="currentColor"
            strokeWidth={isMajor ? 1 : 0.6}
            className={isMajor ? 'text-foreground-primary/50' : 'text-foreground-muted/30'}
          />
        );

        if (isMajor && mm > 0 && mm < count) {
          list.push(
            <text
              key={`text-${mm}`}
              x={2}
              y={posPx + 8}
              fontSize={8.5}
              fontFamily="var(--font-mono, monospace)"
              className="fill-foreground-muted select-none text-[8.5px]"
            >
              {mm}
            </text>
          );
        }
      }
    }

    return list;
  }, [lengthMm, scale, isHorizontal]);

  // Posição visual do cursor na régua
  const cursorPx = cursorPosMm !== null ? cursorPosMm * MM_TO_PX * scale : null;

  if (isHorizontal) {
    return (
      <div
        className="relative h-[18px] bg-surface-subtle/80 border-b border-border/70 select-none overflow-hidden"
        style={{ width: `${totalPx}px` }}
        aria-hidden="true"
      >
        <svg
          width={totalPx}
          height={18}
          className="absolute inset-0 pointer-events-none"
        >
          {ticks}
        </svg>

        {/* Indicador do cursor do mouse */}
        {cursorPx !== null && cursorPx >= 0 && cursorPx <= totalPx && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none transition-transform duration-75"
            style={{
              transform: `translateX(${cursorPx}px)`,
            }}
          >
            <div className="w-[1.5px] h-full bg-[#3a86ff] shadow-[0_0_3px_#3a86ff]" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative w-[18px] bg-surface-subtle/80 border-r border-border/70 select-none overflow-hidden"
      style={{ height: `${totalPx}px` }}
      aria-hidden="true"
    >
      <svg
        width={18}
        height={totalPx}
        className="absolute inset-0 pointer-events-none"
      >
        {ticks}
      </svg>

      {/* Indicador do cursor do mouse */}
      {cursorPx !== null && cursorPx >= 0 && cursorPx <= totalPx && (
        <div
          className="absolute left-0 right-0 pointer-events-none transition-transform duration-75"
          style={{
            transform: `translateY(${cursorPx}px)`,
          }}
        >
          <div className="h-[1.5px] w-full bg-[#3a86ff] shadow-[0_0_3px_#3a86ff]" />
        </div>
      )}
    </div>
  );
};
