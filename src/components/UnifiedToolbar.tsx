import { 
  PanelLeftClose, 
  PanelLeft, 
  PanelRightClose, 
  PanelRight, 
  Printer, 
  Keyboard, 
  Palette, 
  Scissors, 
  Grid,
  Maximize2,
  Minimize2,
  X,
  ArrowRight
} from 'lucide-react';
import appIcon from '../assets/app-icon.png';
import { Template, ColorAdjustments, CropMarkSettings } from '../types/template';
import { formatShortcut } from '../utils/platform';

interface UnifiedToolbarProps {
  currentTemplate: Template | null;
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  onOpenShortcutsModal: () => void;
  onPrint: () => void;
  onCloseTemplate?: () => void;
  isPrinting?: boolean;
  colorAdjustments?: ColorAdjustments;
  cropMarks?: CropMarkSettings;
  onToggleFocusMode?: () => void;
  isFocusMode?: boolean;
  productionCount?: number;
  isHomeOpen?: boolean;
  onToggleHome?: () => void;
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
  onCloseTemplate,
  isPrinting = false,
  colorAdjustments,
  cropMarks,
  isFocusMode,
  onToggleFocusMode,
  productionCount,
  isHomeOpen = false,
  onToggleHome,
}) => {
  return (
    <header 
      role="banner"
      className="h-13 min-h-[52px] border-b border-border/70 apple-glass px-3.5 flex items-center justify-between shrink-0 select-none sticky top-0 z-30 shadow-xs"
    >
      {/* 1. Lado Esquerdo: Identidade & Navegação Unificada */}
      <div className="flex items-center gap-2">
        {isHomeOpen ? (
          <div className="flex items-center gap-2 px-1 py-1">
            <img
              src={appIcon}
              alt="Folium Print Icon"
              className="w-5 h-5 rounded-[4px] object-contain shadow-xs border border-black/5"
              width={20}
              height={20}
            />
            <span className="text-xs font-semibold tracking-display text-foreground-primary">
              Folium Print
            </span>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onToggleLeftSidebar}
              aria-label={isLeftSidebarOpen ? 'Ocultar barra de modelos' : 'Mostrar barra de modelos'}
              title={isLeftSidebarOpen ? `Ocultar modelos (${formatShortcut('B')})` : `Mostrar modelos (${formatShortcut('B')})`}
              className="btn-tactile p-1.5 rounded-[6px] text-foreground-secondary hover:text-foreground-primary hover:bg-surface-subtle border border-transparent hover:border-border/60 transition-colors"
            >
              {isLeftSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
              ) : (
                <PanelLeft className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
              )}
            </button>

            {onToggleHome && (
              <button
                type="button"
                onClick={onToggleHome}
                className="btn-tactile flex items-center gap-2 px-2 py-1 rounded-[6px] hover:bg-black/[0.04] active:scale-[0.97] transition-all text-left group"
                title={`Ir para o Início (${formatShortcut('H')})`}
                aria-label="Ir para o Início"
              >
                <img
                  src={appIcon}
                  alt="Folium Print Icon"
                  className="w-5 h-5 rounded-[4px] object-contain shadow-xs border border-black/5 transition-transform group-hover:scale-105"
                  width={20}
                  height={20}
                />
                <span className="text-xs font-semibold tracking-display text-foreground-primary">
                  Folium Print
                </span>
                <kbd className="hidden lg:inline font-mono text-[9px] px-1 py-0.2 rounded-[3px] bg-black/[0.04] text-foreground-muted border border-black/[0.04] ml-0.5">
                  {formatShortcut('H')}
                </kbd>
              </button>
            )}
          </>
        )}
      </div>

      {/* 2. Centro: Document Title Pill com Centralização Óptica Absoluta (Apenas no Editor) */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center max-w-[50%] truncate pointer-events-none z-10">
        {!isHomeOpen && (
          currentTemplate ? (
            <div className="pointer-events-auto flex items-center gap-2 px-2.5 py-1 rounded-[8px] bg-black/[0.035] border border-black/[0.06] hover:bg-black/[0.05] transition-colors shadow-2xs truncate">
              <span className="text-xs font-semibold text-foreground-primary truncate">
                {currentTemplate.name}
              </span>

              {/* Badge de Dimensões Reais */}
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[4px] bg-white shadow-2xs border border-black/[0.05] text-foreground-secondary shrink-0">
                {currentTemplate.dimensions.widthMm} × {currentTemplate.dimensions.heightMm} mm
              </span>

              {/* Indicadores Dinâmicos de Status */}
              {colorAdjustments?.mode === 'cmyk-simulated' && (
                <span 
                  className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono font-medium px-1.5 py-0.2 rounded-[4px] bg-[#8338ec]/10 text-[#8338ec] border border-[#8338ec]/20 shrink-0"
                  title="Simulação de Perfil CMYK FOGRA39 Ativa"
                >
                  <Palette className="w-2.5 h-2.5" />
                  <span>CMYK</span>
                </span>
              )}

              {cropMarks?.enabled && (
                <span 
                  className="hidden md:inline-flex items-center gap-1 text-[9px] font-mono font-medium px-1.5 py-0.2 rounded-[4px] bg-[#ff006e]/10 text-[#ff006e] border border-[#ff006e]/20 shrink-0"
                  title={`Marcas de Corte Ativas (${cropMarks.bleedMm}mm)`}
                >
                  <Scissors className="w-2.5 h-2.5" />
                  <span>Corte</span>
                </span>
              )}

              {currentTemplate.grid && (
                <span 
                  className="hidden lg:inline-flex items-center gap-1 text-[9px] font-mono font-medium px-1.5 py-0.2 rounded-[4px] bg-[#3a86ff]/10 text-[#3a86ff] border border-[#3a86ff]/20 shrink-0"
                  title={`Grade ${currentTemplate.grid.rows}×${currentTemplate.grid.cols}`}
                >
                  <Grid className="w-2.5 h-2.5" />
                  <span>{currentTemplate.grid.rows}×{currentTemplate.grid.cols}</span>
                </span>
              )}

              {/* Botão de Fechar Arquivo Aberto */}
              {onCloseTemplate && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTemplate();
                  }}
                  className="btn-tactile w-4 h-4 ml-0.5 rounded-full flex items-center justify-center text-foreground-muted hover:text-foreground-primary hover:bg-black/10 active:scale-90 transition-all shrink-0"
                  title={`Fechar modelo aberto (${formatShortcut('W')})`}
                  aria-label="Fechar modelo aberto"
                >
                  <X className="w-3 h-3" strokeWidth={2} />
                </button>
              )}
            </div>
          ) : (
            <div className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-black/[0.03] text-foreground-muted text-[11px] font-medium border border-black/[0.05]">
              <span>Nenhum modelo selecionado</span>
            </div>
          )
        )}
      </div>

      {/* 3. Lado Direito: Modo Foco, Atalhos, Inspector Toggle & Botão Imprimir */}
      <div className="flex items-center gap-2">
        {isHomeOpen ? (
          <>
            {currentTemplate && (
              <button
                type="button"
                onClick={onToggleHome}
                className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#111111] hover:bg-[#27272a] text-white text-xs font-semibold shadow-xs transition-colors"
                title="Voltar para a prancheta de edição"
              >
                <span>Voltar ao Editor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onOpenShortcutsModal}
              className="btn-tactile p-1.5 text-foreground-secondary hover:text-foreground-primary hover:bg-surface-subtle border border-transparent hover:border-border/60 rounded-[6px]"
              title="Atalhos operacionais (?)"
              aria-label="Atalhos operacionais (?)"
            >
              <Keyboard className="w-4 h-4 text-foreground-muted" strokeWidth={1.8} aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            {/* Indicador de Produção / Cópias (Apenas quando houver documento ativo) */}
            {currentTemplate && productionCount !== undefined && productionCount > 0 && (
              <div 
                className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 text-foreground-muted font-mono text-[10px]"
                title="Total de etiquetas prontas para envio ao spooler"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <span>{productionCount} {productionCount === 1 ? 'etiqueta pronta' : 'etiquetas prontas'}</span>
              </div>
            )}

            {/* Botão de Modo Foco */}
            {onToggleFocusMode && (
              <button
                type="button"
                onClick={onToggleFocusMode}
                className={`btn-tactile p-1.5 rounded-[6px] border transition-colors ${
                  isFocusMode
                    ? 'bg-[#3a86ff] text-white border-[#3a86ff] shadow-xs'
                    : 'text-foreground-secondary hover:text-foreground-primary hover:bg-surface-subtle border-transparent hover:border-border/60'
                }`}
                title={isFocusMode ? `Sair do Modo Foco (${formatShortcut('F', true)})` : `Entrar no Modo Foco (${formatShortcut('F', true)})`}
                aria-label={isFocusMode ? 'Sair do Modo Foco' : 'Entrar no Modo Foco'}
              >
                {isFocusMode ? (
                  <Minimize2 className="w-4 h-4" strokeWidth={1.8} />
                ) : (
                  <Maximize2 className="w-4 h-4" strokeWidth={1.8} />
                )}
              </button>
            )}

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
              title={isRightSidebarOpen ? `Ocultar Inspector (${formatShortcut('I')})` : `Mostrar Inspector (${formatShortcut('I')})`}
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
              className="btn-tactile font-medium py-1.5 px-3 rounded-[6px] flex items-center gap-2 text-xs transition-colors group disabled:pointer-events-none disabled:bg-black/[0.04] disabled:text-foreground-muted disabled:border-black/[0.06] disabled:shadow-none bg-[#111111] hover:bg-[#27272a] text-white border border-[#111111] shadow-xs"
              title={`Imprimir documento (${formatShortcut('P')})`}
              aria-label="Imprimir documento"
            >
              <Printer className={`w-3.5 h-3.5 transition-colors ${isPrinting ? 'animate-pulse' : ''} group-disabled:text-foreground-muted text-white`} strokeWidth={1.8} aria-hidden="true" />
              <span className="font-medium">
                {isPrinting ? 'Enviando...' : 'Imprimir'}
              </span>
              <kbd className="hidden sm:inline font-mono text-[9px] px-1.5 py-0.5 rounded-[3px] font-semibold border transition-colors group-disabled:bg-black/[0.04] group-disabled:text-foreground-muted group-disabled:border-black/[0.06] bg-white/15 text-white/90 border-white/10" aria-hidden="true">
                {formatShortcut('P')}
              </kbd>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
