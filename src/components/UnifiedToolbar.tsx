import React from 'react';
import { 
  PanelLeftClose, 
  PanelLeft, 
  PanelRightClose, 
  PanelRight, 
  Printer, 
  Keyboard, 
  Palette, 
  Scissors, 
  Grid 
} from 'lucide-react';
import appIcon from '../assets/app-icon.png';
import { Template, ColorAdjustments, CropMarkSettings } from '../types/template';

interface UnifiedToolbarProps {
  currentTemplate: Template | null;
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  onOpenShortcutsModal: () => void;
  onPrint: () => void;
  isPrinting?: boolean;
  colorAdjustments?: ColorAdjustments;
  cropMarks?: CropMarkSettings;
}

/**
 * Unified Window Toolbar no estilo Apple macOS HIG.
 * Integra controles de janela/sidebars, estado do documento e botão de impressão primário.
 */
export const UnifiedToolbar: React.FC<UnifiedToolbarProps> = ({
  currentTemplate,
  isLeftSidebarOpen,
  isRightSidebarOpen,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  onOpenShortcutsModal,
  onPrint,
  isPrinting = false,
  colorAdjustments,
  cropMarks,
}) => {
  return (
    <header 
      role="banner"
      className="h-13 min-h-[52px] border-b border-border/70 apple-glass px-3.5 flex items-center justify-between shrink-0 select-none sticky top-0 z-30 shadow-xs"
    >
      {/* 1. Lado Esquerdo: Sidebar Toggle & Identidade */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleLeftSidebar}
          aria-label={isLeftSidebarOpen ? 'Ocultar barra de modelos' : 'Mostrar barra de modelos'}
          title={isLeftSidebarOpen ? 'Ocultar modelos (⌘B)' : 'Mostrar modelos (⌘B)'}
          className="btn-tactile p-1.5 rounded-[6px] text-foreground-secondary hover:text-foreground-primary hover:bg-surface-subtle border border-transparent hover:border-border/60 transition-colors"
        >
          {isLeftSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
          ) : (
            <PanelLeft className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <img
            src={appIcon}
            alt="Folium Print Icon"
            className="w-6 h-6 rounded-[5px] object-contain shadow-xs border border-black/5"
            width={24}
            height={24}
          />
          <span className="text-xs font-semibold tracking-display text-foreground-primary">
            Folium Print
          </span>
          <span className="text-[9px] tracking-caption font-mono uppercase px-1.5 py-0.5 rounded-[4px] border border-border/80 bg-surface-subtle text-foreground-muted">
            macOS Studio
          </span>
        </div>
      </div>

      {/* 2. Centro: Título do Documento / Modelo & Status Gráficos */}
      <div className="flex items-center gap-2 max-w-[45%] truncate">
        {currentTemplate ? (
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-semibold text-foreground-primary truncate">
              {currentTemplate.name}
            </span>

            {/* Badge de Dimensões Reais */}
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-surface-subtle border border-border text-foreground-secondary shrink-0">
              {currentTemplate.dimensions.widthMm} × {currentTemplate.dimensions.heightMm} mm
            </span>

            {/* Indicadores Dinâmicos de Status */}
            {colorAdjustments?.mode === 'cmyk-simulated' && (
              <span 
                className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-[4px] bg-pastel-violet-bg text-pastel-violet-text border border-pastel-violet-border shrink-0"
                title="Simulação de Perfil CMYK FOGRA39 Ativa"
              >
                <Palette className="w-2.5 h-2.5" />
                <span>CMYK</span>
              </span>
            )}

            {cropMarks?.enabled && (
              <span 
                className="hidden md:inline-flex items-center gap-1 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-[4px] bg-surface-subtle text-foreground-secondary border border-border shrink-0"
                title={`Marcas de Corte Ativas (${cropMarks.bleedMm}mm)`}
              >
                <Scissors className="w-2.5 h-2.5" />
                <span>Corte</span>
              </span>
            )}

            {currentTemplate.grid && (
              <span 
                className="hidden lg:inline-flex items-center gap-1 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-[4px] bg-pastel-blue-bg text-pastel-blue-text border border-pastel-blue-border shrink-0"
                title={`Grade ${currentTemplate.grid.rows}×${currentTemplate.grid.cols}`}
              >
                <Grid className="w-2.5 h-2.5" />
                <span>{currentTemplate.grid.rows}×{currentTemplate.grid.cols}</span>
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-foreground-muted italic">
            Nenhum modelo selecionado
          </span>
        )}
      </div>

      {/* 3. Lado Direito: Atalhos, Inspector Toggle & Botão Imprimir */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenShortcutsModal}
          className="btn-tactile p-1.5 text-foreground-secondary hover:text-foreground-primary hover:bg-surface-subtle border border-transparent hover:border-border/60 rounded-[6px]"
          title="Atalhos operacionais (?)"
          aria-label="Atalhos operacionais (?)"
        >
          <Keyboard className="w-4 h-4 text-foreground-muted" strokeWidth={1.8} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onToggleRightSidebar}
          aria-label={isRightSidebarOpen ? 'Ocultar Inspector' : 'Mostrar Inspector'}
          title={isRightSidebarOpen ? 'Ocultar Inspector (⌘I)' : 'Mostrar Inspector (⌘I)'}
          className="btn-tactile p-1.5 rounded-[6px] text-foreground-secondary hover:text-foreground-primary hover:bg-surface-subtle border border-transparent hover:border-border/60 transition-colors"
        >
          {isRightSidebarOpen ? (
            <PanelRightClose className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
          ) : (
            <PanelRight className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
          )}
        </button>

        <div className="h-4 w-[1px] bg-border mx-0.5" aria-hidden="true" />

        {/* Botão Primário Proeminente de Impressão */}
        <button
          type="button"
          onClick={onPrint}
          disabled={!currentTemplate || isPrinting}
          className="btn-tactile bg-[#111111] hover:bg-[#27272a] text-white font-medium py-1.5 px-3 rounded-[6px] border border-[#111111] flex items-center gap-2 text-xs shadow-xs disabled:opacity-40 disabled:pointer-events-none group"
          title="Imprimir documento (Ctrl+P / ⌘P)"
          aria-label="Imprimir documento"
        >
          <span 
            className={`w-1.5 h-1.5 rounded-full transition-transform duration-snappy ${
              isPrinting ? 'bg-[#ffbe0b] animate-ping' : 'bg-[#3a86ff] group-hover:scale-125'
            }`} 
            aria-hidden="true"
          />
          <Printer className="w-3.5 h-3.5 text-white" strokeWidth={1.8} aria-hidden="true" />
          <span className="font-medium">
            {isPrinting ? 'Enviando...' : 'Imprimir'}
          </span>
          <kbd className="hidden sm:inline font-mono text-[9px] bg-white/15 px-1 py-0.2 rounded-[3px] text-white/80 border border-white/10" aria-hidden="true">
            ⌘P
          </kbd>
        </button>
      </div>
    </header>
  );
};
