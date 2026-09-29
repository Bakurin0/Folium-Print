import React, { useState, useMemo } from 'react';
import { 
  Tag, 
  Layers, 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Pencil, 
  Check, 
  X, 
} from 'lucide-react';
import { Template } from '../types/template';
import { formatShortcut } from '../utils/platform';

interface ModelsSidebarProps {
  templates: Template[];
  selectedTemplateId: string;
  isOpen: boolean;
  onSelectTemplate: (templateId: string) => void;
  onOpenCreateModal: () => void;
  onEditCustomTemplate?: (template: Template) => void;
  onDeleteCustomTemplate: (templateId: string) => void;
}


/**
 * Miniatura geométrica proporcional da etiqueta física na barra lateral.
 */
const SidebarLabelMiniature: React.FC<{ widthMm: number; heightMm: number; grid?: any }> = ({
  widthMm,
  heightMm,
  grid,
}) => {
  const maxBoxSize = 22; // px
  const isLandscape = widthMm >= heightMm;
  const ratio = isLandscape ? heightMm / widthMm : widthMm / heightMm;
  const boxW = isLandscape ? maxBoxSize : Math.max(11, Math.round(maxBoxSize * ratio));
  const boxH = isLandscape ? Math.max(9, Math.round(maxBoxSize * ratio)) : maxBoxSize;

  return (
    <div
      className="w-7 h-7 rounded-[6px] bg-black/[0.04] border border-black/[0.06] flex items-center justify-center shrink-0 group-hover:bg-white group-hover:shadow-2xs transition-all duration-snappy mt-0.5"
      aria-hidden="true"
    >
      <div
        style={{ width: `${boxW}px`, height: `${boxH}px` }}
        className="rounded-[2px] bg-white border border-black/25 shadow-2xs p-0.5 flex flex-col justify-between overflow-hidden"
      >
        {grid ? (
          <div className="w-full h-full grid grid-cols-2 grid-rows-3 gap-0.5 opacity-60">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-black/30 rounded-[0.5px]" />
            ))}
          </div>
        ) : (
          <>
            <div className="w-full h-0.5 bg-black/40 rounded-full" />
            <div className="w-2/3 h-0.5 bg-black/20 rounded-full" />
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Sidebar de Modelos macOS Studio.
 * Gerencia a biblioteca, busca e criação rápida de presets ou modelos em branco.
 */
export const ModelsSidebar: React.FC<ModelsSidebarProps> = ({
  templates,
  selectedTemplateId,
  isOpen,
  onSelectTemplate,
  onOpenCreateModal,
  onEditCustomTemplate,
  onDeleteCustomTemplate,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filtra modelos pela busca
  const filteredTemplates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        `${t.dimensions.widthMm}x${t.dimensions.heightMm}`.includes(q)
    );
  }, [templates, searchQuery]);

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'thermal':
        return {
          icon: <Tag className="w-3.5 h-3.5" strokeWidth={1.8} />,
          label: 'Térmica',
          color: '#3a86ff',
          bg: 'rgba(58, 134, 255, 0.08)',
          border: 'rgba(58, 134, 255, 0.25)',
        };
      case 'a4-sheet':
        return {
          icon: <Layers className="w-3.5 h-3.5" strokeWidth={1.8} />,
          label: 'Folha A4',
          color: '#8338ec',
          bg: 'rgba(131, 56, 236, 0.08)',
          border: 'rgba(131, 56, 236, 0.25)',
        };
      default:
        return {
          icon: <FileText className="w-3.5 h-3.5" strokeWidth={1.8} />,
          label: 'Documento',
          color: '#fb5607',
          bg: 'rgba(251, 86, 7, 0.08)',
          border: 'rgba(251, 86, 7, 0.25)',
        };
    }
  };

  return (
    <aside
      aria-label="Biblioteca de Modelos"
      aria-hidden={!isOpen}
      className={`h-full border-black/[0.06] bg-[#fbfbfa] flex flex-col shrink-0 z-20 transition-all duration-snappy ease-out select-none overflow-hidden ${
        isOpen
          ? 'w-72 xl:w-80 border-r opacity-100 pointer-events-auto'
          : 'w-0 border-r-0 opacity-0 pointer-events-none'
      }`}
    >
      <div className="w-72 xl:w-80 h-full flex flex-col shrink-0">
      {/* 1. Header da Barra de Modelos */}
      <div className="p-3 border-b border-black/[0.06] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold tracking-display text-foreground-primary">
            Biblioteca
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[4px] bg-black/[0.05] text-foreground-muted">
            {templates.length}
          </span>
        </div>

        {/* Botão Novo Modelo */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="btn-tactile px-2.5 py-1 text-xs font-medium text-foreground-primary hover:bg-black/[0.04] rounded-[7px] border border-black/[0.08] bg-surface-card flex items-center gap-1 shadow-2xs transition-all duration-snappy"
          title="Criar novo modelo em branco"
        >
          <Plus className="w-3.5 h-3.5 text-[#3a86ff]" strokeWidth={2.5} />
          <span>Novo</span>
        </button>
      </div>

      {/* 2. Campo de Busca Instantânea Estilo macOS Search Field */}
      <div className="p-2.5 border-b border-black/[0.06]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar modelos..."
            aria-label="Buscar modelos por nome ou dimensão"
            className="w-full pl-8 pr-14 h-7 text-xs bg-black/[0.035] hover:bg-black/[0.05] focus:bg-white border border-black/[0.06] focus:border-[#3a86ff] focus:ring-2 focus:ring-[#3a86ff]/20 rounded-[7px] transition-all outline-none placeholder:text-foreground-muted"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground-primary"
              aria-label="Limpar busca"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[9px] bg-black/[0.04] text-foreground-muted px-1.5 py-0.5 rounded-[4px] border border-black/[0.06] pointer-events-none select-none">
              {formatShortcut('F')}
            </kbd>
          )}
        </div>
      </div>

      {/* 3. Lista de Modelos Cadastrados com Seleção em Pílula Apple */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredTemplates.length === 0 ? (
          <div className="p-6 text-center space-y-3 text-foreground-muted animate-fadeIn">
            <div className="w-10 h-10 rounded-[10px] bg-black/[0.04] border border-black/[0.06] flex items-center justify-center mx-auto text-foreground-muted">
              <FileText className="w-5 h-5 text-foreground-muted" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-foreground-primary">Nenhum modelo encontrado</p>
              <p className="text-[11px] text-foreground-muted">Crie ou importe etiquetas para sua biblioteca.</p>
            </div>
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="btn-tactile mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] bg-white border border-black/[0.08] shadow-2xs hover:bg-black/[0.03] text-foreground-primary text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#3a86ff]" strokeWidth={2.5} />
              <span>Criar Novo Modelo</span>
            </button>
          </div>
        ) : (
          filteredTemplates.map((tpl) => {
            const isSelected = tpl.id === selectedTemplateId;
            const theme = getCategoryTheme(tpl.category);

            return (
              <div
                key={tpl.id}
                className={`group relative rounded-[8px] transition-all duration-snappy ${
                  isSelected
                    ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.08)]'
                    : 'hover:bg-black/[0.03] text-foreground-secondary'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectTemplate(tpl.id)}
                  className="w-full p-2.5 text-left flex items-start gap-2.5 active:scale-[0.985] transition-transform duration-120"
                >
                  <SidebarLabelMiniature
                    widthMm={tpl.dimensions.widthMm}
                    heightMm={tpl.dimensions.heightMm}
                    grid={tpl.grid}
                  />

                  <div className="flex-1 min-w-0 pr-10">
                    <span className="text-xs font-semibold text-foreground-primary line-clamp-2 leading-tight block">
                      {tpl.name}
                    </span>

                    <div className="text-[11px] text-foreground-muted truncate mt-0.5">
                      {tpl.description || 'Modelo pronto para impressão'}
                    </div>

                    {/* Badges de Dimensões, Categoria e Custom */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[4px] bg-black/[0.04] text-foreground-secondary border border-black/[0.05]">
                        {tpl.dimensions.widthMm}×{tpl.dimensions.heightMm}mm
                      </span>

                      <span
                        className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-[4px] border"
                        style={{
                          color: theme.color,
                          backgroundColor: theme.bg,
                          borderColor: theme.border,
                        }}
                      >
                        {theme.label}
                      </span>

                      {tpl.isCustom && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-[4px] bg-black/[0.04] text-foreground-secondary border border-black/[0.06]">
                          Personalizado
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Ações de Edição e Exclusão no Card */}
                {tpl.isCustom && (
                  <div className="absolute top-2 right-2">
                    {confirmDeleteId === tpl.id ? (
                      <div className="flex items-center gap-1 bg-surface-card border border-feedback-error px-1 py-0.5 rounded-[5px] shadow-sm animate-modal-enter">
                        <span className="text-[10px] text-feedback-error font-medium">Excluir?</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCustomTemplate(tpl.id);
                            setConfirmDeleteId(null);
                          }}
                          className="btn-tactile p-1 text-feedback-error hover:bg-feedback-error hover:text-white rounded-[3px]"
                          aria-label="Confirmar exclusão"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(null);
                          }}
                          className="btn-tactile p-1 text-foreground-muted hover:text-foreground-primary rounded-[3px]"
                          aria-label="Cancelar exclusão"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-0.5 transition-opacity">
                        {onEditCustomTemplate && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditCustomTemplate(tpl);
                            }}
                            className="btn-tactile p-1 text-foreground-muted hover:text-foreground-primary hover:bg-surface-subtle rounded-[4px]"
                            title="Editar no editor visual"
                            aria-label={`Editar ${tpl.name}`}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(tpl.id);
                          }}
                          className="btn-tactile p-1 text-foreground-muted hover:text-feedback-error hover:bg-surface-subtle rounded-[4px]"
                          title="Excluir modelo"
                          aria-label={`Excluir ${tpl.name}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        </div>
      </div>
    </aside>
  );
};
