import React, { useState } from 'react';
import { Template } from '../types/template';
import { Tag, FileText, Layers, Plus, Trash2, Pencil, Check, X } from 'lucide-react';

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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
            className="btn-tactile inline-flex items-center gap-1.5 text-xs font-medium text-foreground-primary hover:bg-surface-subtle bg-surface-card px-2.5 py-1 rounded-[6px] border border-border"
            title="Criar novo modelo personalizado"
            aria-label="Criar novo modelo personalizado"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-violet" aria-hidden="true" />
            <Plus className="w-3 h-3 text-foreground-muted" strokeWidth={2} aria-hidden="true" />
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
                className={`w-full text-left p-2.5 rounded-[6px] border transition-[border-color,background-color,box-shadow] duration-snappy ease-emil-out flex items-start gap-3 relative group ${
                  isSelected
                    ? 'border-[#111111] bg-surface-card text-foreground-primary ring-1 ring-[#111111]'
                    : 'border-border bg-surface-card hover:bg-surface-subtle text-foreground-secondary'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectTemplate(tpl.id)}
                  className="flex items-start gap-2.5 flex-1 min-w-0 text-left active:scale-[0.97] transition-transform duration-snappy ease-emil-out"
                >
                  <div
                    className={`mt-0.5 p-1.5 rounded-[5px] shrink-0 border transition-colors duration-snappy ease-emil-out ${
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
                  <div className="flex items-center gap-0.5 self-center shrink-0">
                    {confirmDeleteId === tpl.id ? (
                      <div className="flex items-center gap-1 bg-surface-subtle border border-feedback-error/40 px-1.5 py-0.5 rounded-[5px] animate-toast-in">
                        <span className="text-[10px] font-medium text-feedback-error">Excluir?</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCustomTemplate(tpl.id);
                            setConfirmDeleteId(null);
                          }}
                          className="btn-tactile p-1 bg-feedback-error hover:bg-feedback-error/90 text-white rounded-[3px] min-w-[24px] min-h-[24px] flex items-center justify-center"
                          title="Confirmar exclusão"
                          aria-label={`Confirmar exclusão do modelo ${tpl.name}`}
                        >
                          <Check className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(null);
                          }}
                          className="btn-tactile p-1 text-foreground-muted hover:text-foreground-primary rounded-[3px] min-w-[24px] min-h-[24px] flex items-center justify-center"
                          title="Cancelar"
                          aria-label="Cancelar exclusão"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-0.5 transition-opacity duration-snappy">
                        {onEditCustomTemplate && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditCustomTemplate(tpl);
                            }}
                            className="btn-tactile p-1.5 text-foreground-muted hover:text-foreground-primary rounded-[4px] hover:bg-surface-subtle min-w-[24px] min-h-[24px] flex items-center justify-center"
                            title="Editar modelo no editor visual"
                            aria-label={`Editar modelo ${tpl.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" strokeWidth={1.8} aria-hidden="true" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(tpl.id);
                          }}
                          className="btn-tactile p-1.5 text-foreground-muted hover:text-feedback-error rounded-[4px] hover:bg-surface-subtle min-w-[24px] min-h-[24px] flex items-center justify-center"
                          title="Excluir este modelo"
                          aria-label={`Excluir modelo ${tpl.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} aria-hidden="true" />
                        </button>
                      </div>
                    )}
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
