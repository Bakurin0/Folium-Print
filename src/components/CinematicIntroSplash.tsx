import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Template } from '../types/template';

interface CinematicIntroSplashProps {
  activeTemplate: Template | null;
  onComplete: () => void;
}

/**
 * Introdução Cinemática 3D (Inspirada em galerias 3D com wireframe grid floor e paralaxe tátil)
 * Construída segundo os princípios de Design Engineering de Emil Kowalski:
 * - Apenas 'transform' e 'opacity' na GPU
 * - Curva de desaceleração customizada (--ease-out)
 * - Escala inicial natural (0.95, nunca 0)
 * - Desfoque óptico de 2px a 6px para amortecer a transição entre dimensões
 * - Interrompível via tecla Esc ou clique
 */
export const CinematicIntroSplash: React.FC<CinematicIntroSplashProps> = ({
  activeTemplate,
  onComplete,
}) => {
  // Fases da introdução: 'loader' -> 'reveal' -> 'zoom'
  const [phase, setPhase] = useState<'loader' | 'reveal' | 'zoom'>('loader');
  const [isClosing, setIsClosing] = useState<boolean>(false);

  // Paralaxe 3D com interpolação suave
  const mousePos = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Fecha ou pula a introdução instantaneamente
  const handleDismiss = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setPhase('zoom');
    setTimeout(() => {
      onComplete();
    }, 480);
  }, [isClosing, onComplete]);

  // Tecla Esc para pular imediatamente
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDismiss]);

  // Cronograma da timeline cinematográfica com duração estendida
  useEffect(() => {
    // 1. Loader minimalista de 3 traços (750ms)
    const t1 = setTimeout(() => {
      setPhase('reveal');
    }, 750);

    // 2. Foco e paralaxe do cartão 3D (após 3000ms, dispara o zoom suave para a prancheta)
    const t2 = setTimeout(() => {
      setPhase('zoom');
      setIsClosing(true);
    }, 3000);

    // 3. Finalização e desmontagem do overlay (após 3480ms)
    const t3 = setTimeout(() => {
      onComplete();
    }, 3480);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  // Rastreamento do mouse para paralaxe tátil contínua
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const nx = (e.clientX / innerWidth - 0.5) * 2; // -1 a 1
      const ny = (e.clientY / innerHeight - 0.5) * 2; // -1 a 1
      mousePos.current = { x: nx, y: ny };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Loop de amortecimento físico (Lerp) para a paralaxe 3D
    const renderParallax = () => {
      const targetRotY = mousePos.current.x * 14;
      const targetRotX = -mousePos.current.y * 10;

      currentRotation.current.x += (targetRotX - currentRotation.current.x) * 0.08;
      currentRotation.current.y += (targetRotY - currentRotation.current.y) * 0.08;

      if (cardRef.current && phase === 'reveal') {
        cardRef.current.style.transform = `rotateX(${currentRotation.current.x.toFixed(2)}deg) rotateY(${currentRotation.current.y.toFixed(2)}deg) translateZ(0px)`;
      }

      if (gridRef.current && phase !== 'zoom') {
        const gridPanX = currentRotation.current.y * 1.5;
        gridRef.current.style.transform = `rotateX(72deg) translateY(24%) translateX(${gridPanX.toFixed(1)}px)`;
      }

      animFrameRef.current = requestAnimationFrame(renderParallax);
    };

    animFrameRef.current = requestAnimationFrame(renderParallax);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase]);

  const templateName = activeTemplate?.name || 'Etiqueta Padrão';
  const widthMm = activeTemplate?.dimensions?.widthMm ?? 100;
  const heightMm = activeTemplate?.dimensions?.heightMm ?? 50;

  return (
    <div
      role="dialog"
      aria-label="Introdução do Folium Print"
      onClick={handleDismiss}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-8 bg-[#08080a] text-white select-none cursor-pointer overflow-hidden transition-opacity duration-[420ms] ${
        isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        perspective: '1200px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* 1. Barra Superior Minimalista (Top Pill Island) */}
      <header className="w-full flex items-center justify-between text-[11px] font-mono tracking-widest text-white/40 uppercase z-20">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
          <span>FOLIUM PRINT</span>
        </div>

        {/* Pílula Central */}
        <div className="w-12 h-1 rounded-full bg-white/20 mx-auto" />

        <div className="flex items-center gap-3">
          <span>STUDIO 2026</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="btn-tactile text-[10px] font-sans tracking-normal px-2 py-0.5 rounded-[5px] bg-white/10 hover:bg-white/20 border border-white/10 text-white/70 hover:text-white transition-colors"
            title="Pular introdução (Esc)"
          >
            Pular <kbd className="text-[9px] font-mono opacity-60">Esc</kbd>
          </button>
        </div>
      </header>

      {/* 2. Piso em Grade Geométrica 3D (Wireframe Grid) */}
      <div
        ref={gridRef}
        className="pointer-events-none absolute w-[220vw] h-[130vh] -bottom-[30vh] left-[-60vw] transition-opacity duration-700"
        style={{
          transform: 'rotateX(72deg) translateY(24%)',
          transformStyle: 'preserve-3d',
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 65% 55% at 50% 55%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 65% 55% at 50% 55%, black 20%, transparent 80%)',
          opacity: phase === 'zoom' ? 0 : 0.8,
        }}
      />

      {/* 3. Centro: Pré-carregador Minimalista (3 Traços do Vídeo) */}
      {phase === 'loader' && (
        <div
          className="my-auto flex items-center gap-1.5 z-20 transition-all duration-300"
          style={{ animation: 'introPulse 600ms cubic-bezier(0.23, 1, 0.32, 1) infinite' }}
        >
          <span className="w-3.5 h-0.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0ms' }} />
          <span className="w-3.5 h-0.5 rounded-full bg-white/80 animate-pulse" style={{ animationDelay: '120ms' }} />
          <span className="w-3.5 h-0.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '240ms' }} />
        </div>
      )}

      {/* 4. Centro: Cartão 3D Editorial Flutuante com Paralaxe e Zoom Final */}
      {phase !== 'loader' && (
        <div
          ref={cardRef}
          className="my-auto relative z-20 transition-transform will-change-transform"
          style={{
            transformStyle: 'preserve-3d',
            transition: phase === 'zoom'
              ? 'transform 480ms cubic-bezier(0.23, 1, 0.32, 1), opacity 440ms ease, filter 440ms ease'
              : 'none',
            transform: phase === 'zoom'
              ? 'translateZ(900px) scale(1.6)'
              : 'translateZ(0px)',
            opacity: phase === 'zoom' ? 0 : 1,
            filter: phase === 'zoom' ? 'blur(8px)' : 'none',
          }}
        >
          {/* Cartão de Papel Editorial com Acabamento Tátil */}
          <div
            className="w-[320px] sm:w-[380px] md:w-[420px] aspect-[1.6/1] bg-[#ffffff] text-[#111111] rounded-[16px] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.15)] flex flex-col justify-between relative overflow-hidden"
            style={{
              animation: 'cardRevealIn 400ms cubic-bezier(0.23, 1, 0.32, 1) backwards',
            }}
          >
            {/* Linhas de Registro Cruzadas nos Cantos (Gráfica Técnica) */}
            <div className="absolute top-2 left-2 text-[8px] font-mono text-black/20 select-none">+</div>
            <div className="absolute top-2 right-2 text-[8px] font-mono text-black/20 select-none">+</div>
            <div className="absolute bottom-2 left-2 text-[8px] font-mono text-black/20 select-none">+</div>
            <div className="absolute bottom-2 right-2 text-[8px] font-mono text-black/20 select-none">+</div>

            {/* Cabeçalho do Cartão */}
            <div className="flex items-start justify-between border-b border-black/[0.08] pb-3">
              <div>
                <span className="text-[9px] font-mono tracking-widest uppercase text-black/50 block">
                  Estúdio Tipográfico & Calibração
                </span>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-black mt-0.5 line-clamp-1">
                  {templateName}
                </h2>
              </div>

              <div className="px-2 py-0.5 rounded-[5px] bg-black/[0.05] border border-black/[0.08] text-[10px] font-mono text-black/70 shrink-0">
                {widthMm} × {heightMm} mm
              </div>
            </div>

            {/* Corpo: Grade / Simulação de Código de Barras e Carimbo */}
            <div className="my-auto py-2 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="w-24 h-1 bg-black/40 rounded-full" />
                <div className="w-16 h-1 bg-black/20 rounded-full" />
                <div className="text-[9px] font-mono text-black/40 mt-1">
                  LOTE #2026-PRINT-OK
                </div>
              </div>

              {/* Faux Barcode Gráfico */}
              <div className="flex items-end gap-[2px] h-8 opacity-75">
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 1, 2].map((w, i) => (
                  <div
                    key={i}
                    style={{ width: `${w}px` }}
                    className="h-full bg-black rounded-[0.5px]"
                  />
                ))}
              </div>
            </div>

            {/* Rodapé do Cartão */}
            <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] text-[9px] font-mono text-black/50">
              <span>FOLIUM MATRIZ • CALIBRADO</span>
              <span className="text-black font-semibold">PRONTO P/ IMPRIMIR</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
