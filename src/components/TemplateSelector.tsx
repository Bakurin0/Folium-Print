import React from 'react';
import { Template } from '../types/template';
import { Tag, FileText, Layers, Plus, Trash2, Pencil } from 'lucide-react';

interface TemplateSelectorProps {
  templates: Template[];
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  onOpenCreateModal: () => void;
  onEditCustomTemplate?: (template: Template) => void;
  onDeleteCustomTemplate: (templateId: string) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onOpenCreateModal,
  onEditCustomTemplate,
  onDeleteCustomTemplate,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'thermal':
        return <Tag className="w-3.5 h-3.5 text-inherit" strokeWidth={1.8} />;
      case 'a4-sheet':
        return <Layers className="w-3.5 h-3.5 text-inherit" strokeWidth={1.8} />;
      default:
        return <FileText className="w-3.5 h-3.5 text-inherit" strokeWidth={1.8} />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'thermal':
        return 'Térmica';
      case 'a4-sheet':
        return 'Folha A4';
      default:
        return 'Documento';
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary flex items-center gap-1.5">
          <span>Modelos ({templates.length})</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-primary hover:bg-surface-subtle bg-surface-card px-2.5 py-1 rounded-[6px] transition-colors border border-border"
            title="Criar novo modelo personalizado"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-violet" />
            <Plus className="w-3 h-3 text-foreground-muted" strokeWidth={2} />
            <span>Novo Modelo</span>
          </button>
          <span className="text-[10px] text-foreground-muted flex items-center gap-1 font-mono">
            <kbd className="bg-surface-subtle px-1.5 py-0.5 rounded-[4px] border border-border">Ctrl+T</kbd>
          </span>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="p-3 text-center bg-surface-subtle rounded-[6px] border border-dashed border-border text-xs text-foreground-muted">
          <span>Nenhum modelo cadastrado. Clique em <strong>+ Novo Modelo</strong> acima.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-0.5">
          {templates.map((tpl) => {
            const isSelected = tpl.id === selectedTemplateId;

            return (
              <div
                key={tpl.id}
                className={`w-full text-left p-2.5 rounded-[6px] border transition-all flex items-start gap-3 relative group ${
                  isSelected
                    ? 'border-[#111111] bg-surface-card text-foreground-primary ring-1 ring-[#111111]'
                    : 'border-border bg-surface-card hover:bg-surface-subtle text-foreground-secondary'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectTemplate(tpl.id)}
                  className="flex items-start gap-2.5 flex-1 min-w-0 text-left"
                >
                  <div
                    className={`mt-0.5 p-1.5 rounded-[5px] shrink-0 border transition-colors ${
                      isSelected
                        ? 'bg-[#111111] text-white border-[#111111]'
                        : 'bg-surface-subtle text-foreground-muted border-border'
                    }`}
                  >
                    {getCategoryIcon(tpl.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-semibold truncate ${isSelected ? 'text-[#111111]' : 'text-foreground-primary'}`}>
                        {tpl.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {tpl.isCustom && (
                          <span className="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded-[4px] bg-pastel-pink-bg text-pastel-pink-text border border-pastel-pink-border flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-neon-pink" />
                            <span>Custom</span>
                          </span>
                        )}
                        <span
                          className={`text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded-[4px] border flex items-center gap-1 ${
                            tpl.category === 'thermal'
                              ? 'bg-pastel-blue-bg text-pastel-blue-text border-pastel-blue-border'
                              : tpl.category === 'a4-sheet'
                              ? 'bg-pastel-violet-bg text-pastel-violet-text border-pastel-violet-border'
                              : 'bg-surface-subtle text-foreground-muted border-border'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              tpl.category === 'thermal'
                                ? 'bg-azure-blue'
                                : tpl.category === 'a4-sheet'
                                ? 'bg-blue-violet'
                                : 'bg-foreground-muted'
                            }`}
                          />
                          <span>{getCategoryName(tpl.category)}</span>
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-surface-subtle border border-border text-foreground-muted shrink-0">
                          {tpl.dimensions.widthMm} × {tpl.dimensions.heightMm} mm
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-foreground-muted truncate mt-0.5">
                      {tpl.description}
                    </div>
                  </div>
                </button>

                {/* Ações para modelos customizados */}
                {tpl.isCustom && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity self-center shrink-0">
                    {onEditCustomTemplate && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCustomTemplate(tpl);
                        }}
                        className="p-1 text-foreground-muted hover:text-foreground-primary rounded-[4px] hover:bg-surface-subtle"
                        title="Editar modelo no editor visual"
                      >
                        <Pencil className="w-3.5 h-3.5" strokeWidth={1.8} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Deseja excluir o modelo "${tpl.name}"?`)) {
                          onDeleteCustomTemplate(tpl.id);
                        }
                      }}
                      className="p-1 text-foreground-muted hover:text-feedback-error rounded-[4px] hover:bg-surface-subtle"
                      title="Excluir este modelo"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
