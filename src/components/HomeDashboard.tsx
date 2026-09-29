import React, { useState, useRef } from 'react';
import {
  Plus,
  Upload,
  ArrowRight,
  Trash2,
  Copy,
  FolderOpen
} from 'lucide-react';
import { Template, CustomTemplateDefinition } from '../types/template';
import { importTemplateFromFile } from '../utils/templateFileIO';

interface HomeDashboardProps {
  currentTemplate: Template | null;
  customTemplates: Template[];
  builtInTemplates?: Template[];
  onSelectTemplate: (templateId: string) => void;
  onOpenCreateModal: () => void;
  onImportTemplate: (templateDef: CustomTemplateDefinition) => void;
  onDeleteCustomTemplate: (templateId: string) => void;
  onDuplicateTemplate: (template: Template) => void;
  onReturnToEditor: () => void;
  showToast: (message: string) => void;
}

/**
 * Miniatura geométrica proporcional da etiqueta física (estilo Figma / Apple Pages).
 * Reconhecimento visual instantâneo baseado nas dimensões reais (L × A mm) e conteúdo.
 */
const LabelMiniature: React.FC<{
  widthMm?: number;
  heightMm?: number;
  grid?: any;
  fieldCount?: number;
  name?: string;
}> = ({ widthMm = 80, heightMm = 50, grid, fieldCount = 1, name = '' }) => {
  const safeW = (typeof widthMm === 'number' && widthMm > 0) ? widthMm : 80;
  const safeH = (typeof heightMm === 'number' && heightMm > 0) ? heightMm : 50;
  const maxBoxSize = 34; // px
  const isLandscape = safeW >= safeH;
  const ratio = isLandscape ? safeH / safeW : safeW / safeH;
  const boxW = isLandscape ? maxBoxSize : Math.max(16, Math.round(maxBoxSize * ratio));
  const boxH = isLandscape ? Math.max(14, Math.round(maxBoxSize * ratio)) : maxBoxSize;

  const isBlank = fieldCount === 0 || /em\s*branco|vazi[ao]|blank/i.test(name);

  return (
    <div
      className="w-11 h-11 rounded-[8px] bg-black/[0.035] border border-black/[0.05] flex items-center justify-center shrink-0 group-hover:bg-white group-hover:shadow-2xs group-hover:border-black/10 transition-all duration-snappy"
      aria-hidden="true"
    >
      <div
        style={{ width: `${boxW}px`, height: `${boxH}px` }}
        className={`rounded-[3px] bg-white border border-black/20 shadow-2xs p-1 flex flex-col justify-between overflow-hidden ${
          isBlank ? 'border-dashed border-black/25' : ''
        }`}
      >
        {grid ? (
          <div className="w-full h-full grid grid-cols-2 grid-rows-3 gap-0.5 opacity-60">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-black/20 rounded-[1px]" />
            ))}
          </div>
        ) : isBlank ? (
          <div className="w-full h-full flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-black/15" />
          </div>
        ) : (
          <>
            <div className="w-full h-1 bg-black/35 rounded-full" />
            <div className="w-3/4 h-0.5 bg-black/20 rounded-full" />
            <div className="w-1/2 h-1 bg-black/45 rounded-xs self-end" />
          </>
        )}
      </div>
    </div>
  );
};

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  currentTemplate,
  customTemplates,
  onSelectTemplate,
  onOpenCreateModal,
  onImportTemplate,
  onDeleteCustomTemplate,
  onDuplicateTemplate,
  onReturnToEditor,
  showToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Manipulador de Importação de Arquivo (.folium, .json, .svg, .html)
  const handleFileProcess = async (file: File) => {
    try {
      const result = await importTemplateFromFile(file);
      if (result.success && result.data) {
        const importedDef: CustomTemplateDefinition = {
          id: result.data.id || `custom-${Date.now()}`,
          name: result.data.name || file.name.replace(/\.[^/.]+$/, ''),
          category: result.data.category || 'thermal',
          description: result.data.description || `Importado de ${file.name}`,
          dimensions: result.data.dimensions || {
            widthMm: 100,
            heightMm: 50,
            orientation: 'landscape',
          },
          grid: result.data.grid,
          backgroundSvg: result.data.backgroundSvg,
          fields: result.data.fields || [],
          isCustom: true,
        };
        onImportTemplate(importedDef);
        showToast(`Modelo "${importedDef.name}" importado com sucesso!`);
      } else {
        showToast(result.error || 'Falha ao importar modelo.');
      }
    } catch (err) {
      console.error('File import error:', err);
      showToast('Erro inesperado ao processar o arquivo.');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full overflow-y-auto bg-surface-app select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Input Oculto de Arquivo */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".folium,.json,.svg,.html,.htm"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Indicador Flutuante de Dropzone */}
      {isDraggingFile && (
        <div className="fixed inset-0 z-50 bg-[#3a86ff]/10 backdrop-blur-sm border-2 border-dashed border-[#3a86ff] flex flex-col items-center justify-center p-6 pointer-events-none animate-fadeIn">
          <div className="bg-surface-card p-6 rounded-2xl shadow-elevated border border-border flex flex-col items-center gap-3">
            <Upload className="w-12 h-12 text-[#3a86ff] animate-pulse transition-transform duration-snappy" strokeWidth={1.75} />
            <h3 className="text-base font-semibold text-foreground-primary">
              Solte seu arquivo de modelo aqui
            </h3>
            <p className="text-xs text-foreground-secondary">
              Formatos aceitos: .folium, .json, .svg, .html
            </p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8 md:py-12 space-y-8">
        {/* 1. Header de Boas-Vindas */}
        <div className="dashboard-hero">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground-primary">
            Início
          </h1>
          <p className="text-xs md:text-sm text-foreground-secondary mt-1">
            Crie novas etiquetas, importe layouts ou continue de onde parou.
          </p>
        </div>

        {/* 2. Ações Rápidas em Destaque (Cards Táteis com Física de Toque) */}
        <div>
          <h2 className="text-[11px] font-semibold tracking-wider uppercase text-foreground-muted mb-3">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Criar Novo Modelo Personalizado */}
            <button
              type="button"
              onClick={onOpenCreateModal}
              style={{ animationDelay: '40ms' }}
              className="quick-action-card btn-tactile group text-left p-5 rounded-[14px] bg-surface-card border border-border/90 hover:border-[#3a86ff]/60 hover:shadow-subtle hover:-translate-y-0.5 flex flex-col justify-between h-34 relative overflow-hidden"
            >
              <div className="w-9 h-9 rounded-[9px] bg-[#3a86ff]/10 text-[#3a86ff] flex items-center justify-center transition-transform duration-snappy group-hover:scale-105">
                <Plus className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-bold text-foreground-primary group-hover:text-[#3a86ff] transition-colors flex items-center gap-1.5">
                  <span>Novo Modelo Personalizado</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#3a86ff]" />
                </h3>
                <p className="text-[11px] text-foreground-secondary mt-0.5 line-clamp-1">
                  Configure dimensões em milímetros, códigos de barras e campos do zero.
                </p>
              </div>
            </button>

            {/* Card 2: Importar Arquivo */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ animationDelay: '80ms' }}
              className="quick-action-card btn-tactile group text-left p-5 rounded-[14px] bg-surface-card border border-border/90 hover:border-emerald-500/60 hover:shadow-subtle hover:-translate-y-0.5 flex flex-col justify-between h-34 relative overflow-hidden"
            >
              <div className="w-9 h-9 rounded-[9px] bg-emerald-500/10 text-emerald-600 flex items-center justify-center transition-transform duration-snappy group-hover:scale-105">
                <Upload className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-bold text-foreground-primary group-hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                  <span>Importar Arquivo de Modelo</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-600" />
                </h3>
                <p className="text-[11px] text-foreground-secondary mt-0.5 line-clamp-1">
                  Carregue arquivos .folium, .json, .svg ou .html locais.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 3. Lista de Modelos Salvos */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-foreground-primary">
                Modelos Salvos
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[4px] bg-black/[0.05] text-foreground-muted">
                {customTemplates.length}
              </span>
            </div>

            <span className="text-[11px] text-foreground-muted">
              Armazenados localmente com segurança no seu navegador
            </span>
          </div>

          <div>
            {customTemplates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {customTemplates.map((template, idx) => {
                  const isCurrent = currentTemplate?.id === template.id;
                  const fieldCount = template.fields?.length || 0;
                  const widthMm = template.dimensions?.widthMm ?? 80;
                  const heightMm = template.dimensions?.heightMm ?? 50;

                  const handleClick = () => {
                    if (isCurrent) {
                      onReturnToEditor();
                    } else {
                      onSelectTemplate(template.id);
                    }
                  };

                  return (
                    <div
                      key={template.id}
                      role="button"
                      tabIndex={0}
                      onClick={handleClick}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleClick();
                        }
                      }}
                      style={{ animationDelay: `${120 + idx * 40}ms` }}
                      className={`template-card-item group relative p-4 rounded-[12px] bg-surface-card border cursor-pointer select-none flex flex-col justify-between gap-3 ${
                        isCurrent
                          ? 'border-[#3a86ff] ring-1 ring-[#3a86ff]/30 shadow-subtle'
                          : 'border-border/80 hover:border-border hover:shadow-subtle hover:-translate-y-0.5'
                      }`}
                    >
                      {/* Topo do Card: Miniatura Proporcional e Título */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <LabelMiniature
                            widthMm={widthMm}
                            heightMm={heightMm}
                            grid={template.grid}
                            fieldCount={fieldCount}
                            name={template.name}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-semibold text-foreground-primary truncate group-hover:text-[#3a86ff] transition-colors">
                                {template.name}
                              </h4>
                              {isCurrent && (
                                <span className="text-[9px] font-mono text-[#3a86ff] bg-[#3a86ff]/10 px-1 py-0.2 rounded-[4px] border border-[#3a86ff]/20 shrink-0 font-medium">
                                  Em edição
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-foreground-muted">
                              {widthMm} × {heightMm} mm
                            </span>
                          </div>
                        </div>

                        {/* Ações Secundárias Isoladas (Duplicar e Excluir) */}
                        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateTemplate(template);
                            }}
                            className="btn-tactile p-1.5 text-foreground-muted hover:text-foreground-primary rounded-[5px] hover:bg-black/[0.05]"
                            title="Duplicar modelo"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteCustomTemplate(template.id);
                            }}
                            className="btn-tactile p-1.5 text-foreground-muted hover:text-red-500 rounded-[5px] hover:bg-red-50"
                            title="Excluir modelo salvo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Rodapé do Card: Metadados e Indicador de Ação */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                        <span className="text-foreground-muted text-[10px] font-mono">
                          {fieldCount} {fieldCount === 1 ? 'campo' : 'campos'}
                        </span>

                        <div
                          className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${
                            isCurrent
                              ? 'text-[#3a86ff] font-semibold'
                              : 'text-foreground-secondary group-hover:text-[#3a86ff]'
                          }`}
                        >
                          <span>{isCurrent ? 'Continuar editando' : 'Abrir'}</span>
                          <ArrowRight className="w-3 h-3 transition-transform duration-snappy group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 px-4 rounded-xl border border-dashed border-border bg-surface-card/50 flex flex-col items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-black/[0.03] flex items-center justify-center text-foreground-muted">
                  <FolderOpen className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-semibold text-foreground-primary">
                    Nenhum modelo salvo ainda
                  </h3>
                  <p className="text-xs text-foreground-secondary mt-1 max-w-sm">
                    Comece criando uma etiqueta em branco sob medida ou importe um arquivo existente (.folium, .json, .svg,ou .html).
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={onOpenCreateModal}
                    className="btn-tactile inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[7px] bg-[#111111] hover:bg-[#27272a] active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all duration-snappy"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Criar Primeiro Modelo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-tactile inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[7px] bg-surface-card border border-border/80 hover:bg-black/[0.03] active:scale-[0.98] text-foreground-primary text-xs font-medium shadow-2xs transition-all duration-snappy"
                  >
                    <Upload className="w-3.5 h-3.5 text-foreground-muted" />
                    <span>Importar Arquivo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
