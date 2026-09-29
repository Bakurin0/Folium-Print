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
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Template, CustomTemplateDefinition } from '../types/template';

interface ModelsSidebarProps {
  templates: Template[];
  selectedTemplateId: string;
  isOpen: boolean;
  onSelectTemplate: (templateId: string) => void;
  onOpenCreateModal: () => void;
  onEditCustomTemplate?: (template: Template) => void;
  onDeleteCustomTemplate: (templateId: string) => void;
  onSaveQuickPreset?: (preset: CustomTemplateDefinition) => void;
}

// Presets de mercado populares para criação instantânea com 1 clique
const QUICK_PRESETS: Array<{
  name: string;
  category: 'thermal' | 'a4-sheet' | 'document';
  widthMm: number;
  heightMm: number;
  description: string;
  presetDef: CustomTemplateDefinition;
}> = [
  {
    name: 'Etiqueta Térmica 100×50',
    category: 'thermal',
    widthMm: 100,
    heightMm: 50,
    description: 'Padrão logístico e e-commerce para Zebra / Argox',
    presetDef: {
      id: 'quick-thermal-100x50',
      name: 'Etiqueta Térmica 100×50',
      description: 'Padrão logístico e e-commerce para impressoras térmicas',
      category: 'thermal',
      dimensions: { widthMm: 100, heightMm: 50, orientation: 'landscape' },
      fields: [
        {
          key: 'destinatario',
          label: 'Destinatário',
          type: 'text',
          required: true,
          xMm: 5,
          yMm: 6,
          widthMm: 90,
          heightMm: 8,
          fontSizePt: 12,
          fontWeight: 'bold',
          defaultValue: 'DESTINATÁRIO EXEMPLO',
        },
        {
          key: 'endereco',
          label: 'Endereço',
          type: 'text',
          required: true,
          xMm: 5,
          yMm: 15,
          widthMm: 90,
          heightMm: 10,
          fontSizePt: 9,
          defaultValue: 'Av. Paulista, 1000 - Bela Vista - São Paulo/SP',
        },
        {
          key: 'codigo_rastreio',
          label: 'Código de Rastreio',
          type: 'barcode',
          required: true,
          xMm: 10,
          yMm: 27,
          widthMm: 80,
          heightMm: 16,
          barcodeFormat: 'CODE128',
          defaultValue: 'BR9876543210',
        },
      ],
    },
  },
  {
    name: 'Folha A4 10 Etiquetas (Pimaco)',
    category: 'a4-sheet',
    widthMm: 210,
    heightMm: 297,
    description: '2 colunas × 5 linhas (101.6 × 50.8 mm)',
    presetDef: {
      id: 'quick-a4-pimaco-10',
      name: 'Folha A4 10 Etiquetas',
      description: 'Matriz Pimaco 2x5 para envio de encomendas e pastas',
      category: 'a4-sheet',
      dimensions: { widthMm: 210, heightMm: 297, orientation: 'portrait' },
      grid: {
        rows: 5,
        cols: 2,
        labelWidthMm: 101.6,
        labelHeightMm: 50.8,
        marginTopMm: 21.2,
        marginLeftMm: 3.4,
        gapX: 0,
        gapY: 0,
      },
      fields: [
        {
          key: 'titulo',
          label: 'Título da Etiqueta',
          type: 'text',
          required: true,
          xMm: 4,
          yMm: 5,
          widthMm: 93,
          heightMm: 8,
          fontSizePt: 11,
          fontWeight: 'bold',
          defaultValue: 'ARQUIVO / DOCUMENTO',
        },
        {
          key: 'subtitulo',
          label: 'Descrição',
          type: 'text',
          required: false,
          xMm: 4,
          yMm: 14,
          widthMm: 93,
          heightMm: 12,
          fontSizePt: 9,
          defaultValue: 'Referência interna de inventário Folium',
        },
        {
          key: 'qr_doc',
          label: 'QR Code',
          type: 'qrcode',
          required: true,
          xMm: 75,
          yMm: 26,
          widthMm: 20,
          heightMm: 20,
          defaultValue: 'https://folium.app',
        },
      ],
    },
  },
  {
    name: 'Mini Tag / Joia (35×15 mm)',
    category: 'thermal',
    widthMm: 35,
    heightMm: 15,
    description: 'Etiqueta compacta para produtos, joias ou cabos',
    presetDef: {
      id: 'quick-tag-35x15',
      name: 'Mini Tag 35×15',
      description: 'Etiqueta compacta de preço e identificação',
      category: 'thermal',
      dimensions: { widthMm: 35, heightMm: 15, orientation: 'landscape' },
      fields: [
        {
          key: 'produto',
          label: 'Produto',
          type: 'text',
          required: true,
          xMm: 2,
          yMm: 2.5,
          widthMm: 31,
          heightMm: 4,
          fontSizePt: 7,
          fontWeight: 'bold',
          defaultValue: 'ANEL PRATA 925',
        },
        {
          key: 'preco',
          label: 'Preço',
          type: 'text',
          required: true,
          xMm: 2,
          yMm: 7,
          widthMm: 18,
          heightMm: 5,
          fontSizePt: 8,
          fontWeight: 'bold',
          defaultValue: 'R$ 149,90',
        },
        {
          key: 'codigo_item',
          label: 'Código',
          type: 'qrcode',
          required: false,
          xMm: 22,
          yMm: 5.5,
          widthMm: 9,
          heightMm: 9,
          defaultValue: 'ITEM-00912',
        },
      ],
    },
  },
  {
    name: 'Cartão de Visita / Crachá (90×50 mm)',
    category: 'document',
    widthMm: 90,
    heightMm: 50,
    description: 'Padrão brasileiro de cartões e identificação',
    presetDef: {
      id: 'quick-card-90x50',
      name: 'Cartão de Visita 90×50',
      description: 'Cartão de visita com acabamento gráfico',
      category: 'document',
      dimensions: { widthMm: 90, heightMm: 50, orientation: 'landscape' },
      fields: [
        {
          key: 'nome',
          label: 'Nome Completo',
          type: 'text',
          required: true,
          xMm: 6,
          yMm: 8,
          widthMm: 78,
          heightMm: 8,
          fontSizePt: 13,
          fontWeight: 'bold',
          defaultValue: 'ALEXANDRE SILVA',
        },
        {
          key: 'cargo',
          label: 'Cargo / Função',
          type: 'text',
          required: false,
          xMm: 6,
          yMm: 16,
          widthMm: 78,
          heightMm: 6,
          fontSizePt: 9,
          defaultValue: 'Diretor de Design & Tecnologia',
        },
        {
          key: 'contato',
          label: 'Contato / Email',
          type: 'text',
          required: false,
          xMm: 6,
          yMm: 34,
          widthMm: 55,
          heightMm: 10,
          fontSizePt: 8,
          defaultValue: 'alexandre@empresa.com.br\n+55 (11) 98765-4321',
        },
        {
          key: 'vcard_qr',
          label: 'vCard QR',
          type: 'qrcode',
          required: true,
          xMm: 67,
          yMm: 27,
          widthMm: 17,
          heightMm: 17,
          defaultValue: 'https://contato.bio/alexandre',
        },
      ],
    },
  },
];

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
  onSaveQuickPreset,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPresetsDropdownOpen, setIsPresetsDropdownOpen] = useState<boolean>(false);
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

  const handleApplyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    if (onSaveQuickPreset) {
      const uniqueId = `custom-${Date.now()}`;
      onSaveQuickPreset({
        ...preset.presetDef,
        id: uniqueId,
        name: preset.name,
      });
    }
    setIsPresetsDropdownOpen(false);
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Biblioteca de Modelos"
      className="w-72 xl:w-80 h-full border-r border-border/80 bg-surface-card flex flex-col shrink-0 z-20 transition-all duration-snappy ease-out select-none"
    >
      {/* 1. Header da Barra de Modelos */}
      <div className="p-3 border-b border-border/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold tracking-display text-foreground-primary">
            Biblioteca
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[4px] bg-surface-subtle text-foreground-muted">
            {templates.length}
          </span>
        </div>

        {/* Botão Novo Modelo com Dropdown de Presets */}
        <div className="relative">
          <div className="inline-flex rounded-[6px] shadow-xs border border-border bg-surface-card">
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="btn-tactile px-2 py-1 text-xs font-medium text-foreground-primary hover:bg-surface-subtle flex items-center gap-1 rounded-l-[6px]"
              title="Criar novo modelo em branco"
            >
              <Plus className="w-3 h-3 text-[#3a86ff]" strokeWidth={2.5} />
              <span>Novo</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPresetsDropdownOpen((prev) => !prev)}
              aria-label="Ver presets rápidos de modelo"
              aria-expanded={isPresetsDropdownOpen}
              className="btn-tactile px-1.5 py-1 text-foreground-muted hover:text-foreground-primary hover:bg-surface-subtle border-l border-border rounded-r-[6px]"
              title="Modelos rápidos pré-configurados"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Menu Dropdown de Presets Rápidos */}
          {isPresetsDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsPresetsDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 w-64 apple-glass border border-border/80 rounded-[8px] shadow-lg p-1.5 z-40 animate-modal-enter">
                <div className="px-2 py-1 text-[10px] font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#ffbe0b]" />
                  <span>Modelos de Ponto de Partida</span>
                </div>
                <div className="space-y-0.5 mt-1">
                  {QUICK_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="btn-tactile w-full p-2 text-left rounded-[6px] hover:bg-surface-subtle/80 flex items-start gap-2 text-xs"
                    >
                      <div className="mt-0.5 text-foreground-muted">
                        {p.category === 'thermal' ? (
                          <Tag className="w-3.5 h-3.5 text-[#3a86ff]" />
                        ) : (
                          <Layers className="w-3.5 h-3.5 text-[#8338ec]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground-primary truncate flex items-center justify-between">
                          <span>{p.name}</span>
                          <span className="text-[10px] font-mono text-foreground-muted">
                            {p.widthMm}×{p.heightMm}mm
                          </span>
                        </div>
                        <div className="text-[10px] text-foreground-muted truncate">
                          {p.description}
                        </div>
                      </div>
                    </button>
                  ))}
                  <hr className="border-border my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsPresetsDropdownOpen(false);
                      onOpenCreateModal();
                    }}
                    className="btn-tactile w-full p-1.5 text-center text-xs font-medium text-[#3a86ff] hover:bg-surface-subtle/80 rounded-[6px]"
                  >
                    + Criar Modelo Personalizado em Branco
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Campo de Busca Instantânea */}
      <div className="p-2.5 border-b border-border/60">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar modelos..."
            aria-label="Buscar modelos por nome ou dimensão"
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-surface-subtle/70 hover:bg-surface-subtle focus:bg-surface-card border border-border/80 focus:border-[#3a86ff] rounded-[6px] transition-colors outline-none placeholder:text-foreground-muted"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground-primary"
              aria-label="Limpar busca"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Lista de Modelos Cadastrados */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredTemplates.length === 0 ? (
          <div className="p-6 text-center space-y-2 text-foreground-muted">
            <div className="w-8 h-8 rounded-[8px] bg-surface-subtle border border-border flex items-center justify-center mx-auto text-foreground-muted">
              <FileText className="w-4 h-4" />
            </div>
            <p className="text-xs">Nenhum modelo encontrado.</p>
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="btn-tactile text-xs text-[#3a86ff] font-medium hover:underline inline-block mt-1"
            >
              Criar modelo agora
            </button>
          </div>
        ) : (
          filteredTemplates.map((tpl) => {
            const isSelected = tpl.id === selectedTemplateId;
            const theme = getCategoryTheme(tpl.category);

            return (
              <div
                key={tpl.id}
                className={`group relative rounded-[8px] border transition-all duration-snappy ${
                  isSelected
                    ? 'border-[#3a86ff]/80 bg-white shadow-xs ring-1 ring-[#3a86ff]/30'
                    : 'border-border/70 bg-surface-card hover:bg-surface-subtle/60 text-foreground-secondary'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectTemplate(tpl.id)}
                  className="w-full p-2.5 text-left flex items-start gap-2.5"
                >
                  <div
                    className="p-1.5 rounded-[6px] shrink-0 transition-colors"
                    style={{
                      color: theme.color,
                      backgroundColor: theme.bg,
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    {theme.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs font-semibold truncate ${
                          isSelected ? 'text-foreground-primary' : 'text-foreground-primary'
                        }`}
                      >
                        {tpl.name}
                      </span>
                      <span className="text-[10px] font-mono text-foreground-muted shrink-0">
                        {tpl.dimensions.widthMm}×{tpl.dimensions.heightMm}mm
                      </span>
                    </div>

                    <div className="text-[11px] text-foreground-muted truncate mt-0.5">
                      {tpl.description || 'Modelo sem descrição'}
                    </div>

                    {/* Tags da Categoria e Custom */}
                    <div className="flex items-center gap-1.5 mt-1.5">
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
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-[4px] bg-[#ff006e]/10 text-[#ff006e] border border-[#ff006e]/20">
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
    </aside>
  );
};
