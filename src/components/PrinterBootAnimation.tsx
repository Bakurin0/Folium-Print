import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { Template, TemplateFormData } from '../types/template';

interface PrinterBootAnimationProps {
  activeTemplate: Template | null;
  formData: TemplateFormData;
  onComplete: () => void;
}

/**
 * Animação Tátil de Boot: "A Impressora Térmica Ligando"
 * Construída com GSAP seguindo os princípios de Design Engineering de Emil Kowalski:
 * - Metáfora física do motor de passo (stepper motor) com tração escalonada do papel
 * - LED industrial de calibração térmica (âmbar -> verde)
 * - Ejeção real dos dados e código de barras da etiqueta
 * - O chassi da impressora se expande e se transforma na barra de ferramentas do estúdio
 * - Totalmente interrompível via tecla Esc ou clique
 */
export const PrinterBootAnimation: React.FC<PrinterBootAnimationProps> = ({
  activeTemplate,
  formData,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const assemblyRef = useRef<HTMLDivElement>(null);
  const chassisFaceRef = useRef<HTMLDivElement>(null);
  const paperChuteRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const ledRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const [isDone, setIsDone] = useState(false);

  // Encerramento instantâneo e seguro
  const handleSkip = useCallback(() => {
    if (isDone) return;
    setIsDone(true);
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    onComplete();
  }, [isDone, onComplete]);

  // Atalho de teclado para pular
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  // Timeline GSAP de Boot e Tração Mecânica
  useEffect(() => {
    // Respeita prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsDone(true);
          onComplete();
        },
      });

      timelineRef.current = tl;

      // Emil Kowalski Design Engineering: Curvas Cúbicas Customizadas
      const easeOutQuint = 'cubic-bezier(0.23, 1, 0.32, 1)';
      const easeInOutCubic = 'cubic-bezier(0.65, 0, 0.35, 1)';

      // 1. Estado inicial físico (nunca parte de scale(0))
      gsap.set(assemblyRef.current, {
        scale: 0.96,
        opacity: 0,
        y: -14,
      });

      // O papel fica 100% recolhido dentro do corpo da impressora
      // (oculto pela máscara superior do paperChute)
      gsap.set(paperRef.current, {
        y: '-100%',
      });

      // 2. Chassis surge no centro superior com desaceleração firme
      tl.to(assemblyRef.current, {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.32,
        ease: easeOutQuint,
      });

      // 3. Power On: LED de calibração térmica pulsa âmbar e estabiliza em verde laser
      tl.to(ledRef.current, {
        backgroundColor: '#ffbe0b',
        boxShadow: '0 0 10px #ffbe0b',
        duration: 0.16,
        repeat: 1,
        yoyo: true,
      })
      .to(ledRef.current, {
        backgroundColor: '#10b981',
        boxShadow: '0 0 12px #10b981',
        duration: 0.22,
      });

      // 4. Tração do Papel Térmico em Micropassos (Física de Stepper Motor)
      // Micropasso 1 de tração mecânica: sai os primeiros 32% sob a lâmina
      tl.to(paperRef.current, {
        y: '-68%',
        duration: 0.16,
        ease: easeInOutCubic,
      })
      .to(assemblyRef.current, {
        x: 1,
        yoyo: true,
        repeat: 1,
        duration: 0.04,
      }, '<');

      // Micropasso 2 de tração: avança até 68%
      tl.to(paperRef.current, {
        y: '-32%',
        duration: 0.16,
        ease: easeInOutCubic,
      }, '+=0.05')
      .to(assemblyRef.current, {
        x: -1,
        yoyo: true,
        repeat: 1,
        duration: 0.04,
      }, '<');

      // Micropasso 3: papel completamente ejetado e alinhado
      tl.to(paperRef.current, {
        y: '0%',
        duration: 0.24,
        ease: easeOutQuint,
      }, '+=0.05')
      .to(assemblyRef.current, {
        y: 0.5,
        yoyo: true,
        repeat: 1,
        duration: 0.04,
      }, '<');

      // Pausa táctil para leitura e reconhecimento da etiqueta impressa
      tl.to({}, { duration: 0.26 });

      // 5. Transição Contínua Dupla (Emil Kowalski Design Engineering):
      // - Chassi frontal sobe suavemente em direção à Toolbar superior com blur(2px)
      // - Etiqueta desliza até o centro da tela onde o StudioCanvas está montado
      // - Fundo desfocado desvanece revelando o estúdio ativo
      tl.to(chassisFaceRef.current, {
        y: -36,
        scale: 0.98,
        opacity: 0,
        filter: 'blur(2px)',
        duration: 0.48,
        ease: easeOutQuint,
      })
      .to(paperRef.current, {
        y: 130,
        scale: 1.03,
        opacity: 0,
        filter: 'blur(2px)',
        duration: 0.48,
        ease: easeOutQuint,
      }, '<')
      .to(containerRef.current, {
        opacity: 0,
        backdropFilter: 'blur(0px)',
        duration: 0.48,
        ease: 'power2.out',
      }, '<');

    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [onComplete]);

  if (isDone) return null;

  const widthMm = activeTemplate?.dimensions?.widthMm ?? 100;
  const heightMm = activeTemplate?.dimensions?.heightMm ?? 50;
  const templateName = activeTemplate?.name || 'Etiqueta Térmica';
  const labelHeadline =
    (typeof formData?.name === 'string' && formData.name) ||
    (typeof formData?.title === 'string' && formData.title) ||
    (typeof formData?.productName === 'string' && formData.productName) ||
    templateName;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label="Inicialização da impressora térmica"
      onClick={handleSkip}
      className="fixed inset-0 z-[120] flex flex-col items-center justify-start bg-surface-app/90 backdrop-blur-md select-none cursor-pointer overflow-hidden will-change-[opacity,backdrop-filter]"
    >
      {/* Indicador de Atalho Esc com física táctil no active */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleSkip();
        }}
        className="absolute top-4 right-6 z-40 flex items-center gap-1.5 text-[10px] font-mono text-foreground-muted cursor-pointer transition-transform duration-140 active:scale-[0.97] hover:text-foreground-primary focus:outline-none"
      >
        <span>INICIALIZANDO MOTOR TÉRMICO</span>
        <span className="px-1.5 py-0.5 rounded-[4px] bg-black/[0.06] border border-black/[0.08] shadow-xs">
          Esc p/ pular
        </span>
      </button>

      {/* Conjunto Mecânico da Impressora Térmica */}
      <div
        ref={assemblyRef}
        className="relative mt-8 sm:mt-12 w-[340px] sm:w-[460px] md:w-[540px] flex flex-col items-center z-20 will-change-transform"
      >
        {/* Chassi Frontal: Carcaça da Impressora, LED e Painel */}
        <div
          ref={chassisFaceRef}
          className="relative w-full bg-[#141416] border border-[#27272a] rounded-[16px] shadow-[0_24px_60px_rgba(0,0,0,0.25)] p-4 pb-3 flex flex-col items-center z-30 will-change-transform"
        >
          {/* Painel Frontal do Chassi: LED, Nome da Impressora e Logo */}
          <div className="w-full flex items-center justify-between pb-3 text-white">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest font-semibold text-white/90 uppercase">
                FOLIUM THERMAL T-800
              </span>
              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-white/10 text-white/60">
                203 DPI
              </span>
            </div>

            {/* LED de Status Industrial */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-white/50 tracking-wider">STATUS</span>
              <div
                ref={ledRef}
                className="w-2.5 h-2.5 rounded-full bg-white/20 transition-colors shadow-xs"
              />
            </div>
          </div>

          {/* Fenda Mecânica de Alimentação do Papel (Boca com Roletes e Cortador de Guilhotina) */}
          <div
            ref={slotRef}
            className="relative w-full h-3.5 bg-[#09090b] rounded-[4px] border-t border-b border-white/10 flex items-center justify-between px-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
          >
            {/* Lâmina serrilhada metálica com sombra projetada na boca */}
            <div className="absolute inset-x-0 -bottom-0.5 h-[1.5px] bg-white/25 shadow-[0_3px_6px_rgba(0,0,0,0.5)]" />
          </div>
        </div>

        {/* Chute de Saída Mecânica com Máscara de Corte (Clip-Path na Navalha) */}
        {/* NADA acima de y = 0px é desenhado, mantendo o papel estritamente dentro da máquina */}
        <div
          ref={paperChuteRef}
          className="relative w-full flex justify-center z-20 pointer-events-none -mt-1.5"
          style={{
            clipPath: 'polygon(-100vw 0px, 200vw 0px, 200vw 500vh, -100vw 500vh)',
          }}
        >
          {/* Papel Térmico Ejetado da Fenda */}
          <div
            ref={paperRef}
            className="w-[280px] sm:w-[380px] md:w-[440px] bg-white border border-black/15 shadow-[0_18px_38px_rgba(0,0,0,0.22)] rounded-b-[10px] p-5 text-[#111111] overflow-hidden origin-top will-change-transform"
            style={{
              aspectRatio: `${widthMm} / ${heightMm}`,
            }}
          >
            {/* Linha serrilhada de picote no topo */}
            <div className="absolute top-0 inset-x-0 border-t-2 border-dashed border-black/20" />

            {/* Conteúdo Térmico da Etiqueta */}
            <div className="w-full h-full flex flex-col justify-between pt-2">
              <div className="flex items-start justify-between border-b border-black/10 pb-2">
                <div>
                  <span className="text-[8px] font-mono uppercase text-black/50 tracking-wider">
                    ALIMENTAÇÃO TÉRMICA DIRETA
                  </span>
                  <h3 className="text-sm font-bold tracking-tight text-black line-clamp-1">
                    {labelHeadline}
                  </h3>
                </div>
                <span className="text-[9px] font-mono bg-black/5 px-1.5 py-0.5 rounded border border-black/10 text-black/70">
                  {widthMm}×{heightMm}mm
                </span>
              </div>

              {/* Linhas de Dados e Código de Barras */}
              <div className="my-auto py-2 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="w-20 h-1 bg-black/40 rounded-full" />
                  <div className="w-12 h-1 bg-black/20 rounded-full" />
                  <div className="text-[8px] font-mono text-black/40">
                    SPOOLER: ONLINE
                  </div>
                </div>

                {/* Código de barras impresso */}
                <div className="flex items-end gap-[1.5px] h-7 opacity-80">
                  {[2, 1, 3, 1, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1].map((w, i) => (
                    <div
                      key={i}
                      style={{ width: `${w}px` }}
                      className="h-full bg-black rounded-[0.5px]"
                    />
                  ))}
                </div>
              </div>

              {/* Rodapé da Etiqueta */}
              <div className="flex items-center justify-between pt-1 border-t border-black/5 text-[8px] font-mono text-black/50">
                <span>MATRIZ CALIBRADA</span>
                <span className="text-black font-semibold">FEED OK</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
