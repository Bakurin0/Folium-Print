import React from 'react';
import {
  Type,
  FileText,
  Barcode,
  QrCode,
  Calendar,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Copy,
  Trash2,
  Lock,
  Unlock,
} from 'lucide-react';
import { FieldType, TemplateField } from '../types/template';
import { formatShortcut } from '../utils/platform';

interface StudioFloatingDockProps {
  onAddField: (type: FieldType, extra?: Partial<TemplateField>) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  selectedField: TemplateField | null;
  onDuplicateSelected?: () => void;
  onDeleteSelected?: () => void;
  onToggleLockSelected?: () => void;
}

/**
 * Floating Dock de Ferramentas de Design (Apple HIG / Emil Kowalski Craft).
 * Pílula flutuante translúcida suspensa sobre o canvas com feedback tátil instantâneo.
 */
export const StudioFloatingDock: React.FC<StudioFloatingDockProps> = ({
  onAddField,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  selectedField,
  onDuplicateSelected,
  onDeleteSelected,
  onToggleLockSelected,
}) => {
  return (
    <div
      role="toolbar"
      aria-label="Ferramentas de Criação e Design"
      className="apple-glass-pill px-2 py-1 flex items-center gap-0.5 rounded-full border border-black/[0.08] select-none shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl"
    >
      {/* 1. Inserção de Elementos */}
      <button
        type="button"
        onClick={() => onAddField('text')}
        className="btn-tactile px-2.5 py-1 rounded-full text-foreground-secondary hover:text-foreground-primary hover:bg-black/[0.05] transition-colors flex items-center gap-1.5 text-[11px] font-medium"
        title="Adicionar Texto (T)"
        aria-label="Adicionar Texto"
      >
        <Type className="w-3.5 h-3.5 text-[#3a86ff]" strokeWidth={2} />
        <span className="hidden sm:inline">Texto</span>
      </button>

      <button
        type="button"
        onClick={() => onAddField('textarea')}
        className="btn-tactile px-2.5 py-1 rounded-full text-foreground-secondary hover:text-foreground-primary hover:bg-black/[0.05] transition-colors flex items-center gap-1.5 text-[11px] font-medium"
        title="Adicionar Parágrafo Multilinha"
        aria-label="Adicionar Parágrafo Multilinha"
      >
        <FileText className="w-3.5 h-3.5 text-[#00b4d8]" strokeWidth={2} />
        <span className="hidden sm:inline">Parágrafo</span>
      </button>

      <button
        type="button"
        onClick={() => onAddField('barcode', { barcodeFormat: 'CODE128', defaultValue: '123456789' })}
        className="btn-tactile px-2.5 py-1 rounded-full text-foreground-secondary hover:text-foreground-primary hover:bg-black/[0.05] transition-colors flex items-center gap-1.5 text-[11px] font-medium"
        title="Adicionar Código de Barras (B)"
        aria-label="Adicionar Código de Barras"
      >
        <Barcode className="w-3.5 h-3.5 text-[#8338ec]" strokeWidth={2} />
        <span className="hidden sm:inline">Código</span>
      </button>

      <button
        type="button"
        onClick={() => onAddField('qrcode', { defaultValue: 'https://folium.print' })}
        className="btn-tactile px-2.5 py-1 rounded-full text-foreground-secondary hover:text-foreground-primary hover:bg-black/[0.05] transition-colors flex items-center gap-1.5 text-[11px] font-medium"
        title="Adicionar QR Code (Q)"
        aria-label="Adicionar QR Code"
      >
        <QrCode className="w-3.5 h-3.5 text-[#ff006e]" strokeWidth={2} />
        <span className="hidden sm:inline">QR Code</span>
      </button>

      <button
        type="button"
        onClick={() => onAddField('date', { isAutoDate: true, dateFormat: 'DD/MM/YYYY', defaultValue: 'today' })}
        className="btn-tactile px-2.5 py-1 rounded-full text-foreground-secondary hover:text-foreground-primary hover:bg-black/[0.05] transition-colors flex items-center gap-1.5 text-[11px] font-medium"
        title="Adicionar Data Dinâmica (D)"
        aria-label="Adicionar Data Dinâmica"
      >
        <Calendar className="w-3.5 h-3.5 text-[#fb5607]" strokeWidth={2} />
        <span className="hidden sm:inline">Data</span>
      </button>

      <button
        type="button"
        onClick={() => onAddField('svg', {
          svgContent: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="80" height="80" rx="10" fill="none" stroke="currentColor" stroke-width="6"/><circle cx="50" cy="50" r="22" fill="currentColor"/></svg>',
          svgFill: '#000000',
        })}
        className="btn-tactile px-2.5 py-1 rounded-full text-foreground-secondary hover:text-foreground-primary hover:bg-black/[0.05] transition-colors flex items-center gap-1.5 text-[11px] font-medium"
        title="Adicionar Ícone ou Logotipo SVG"
        aria-label="Adicionar Ícone ou Logotipo SVG"
      >
        <ImageIcon className="w-3.5 h-3.5 text-[#e5a900]" strokeWidth={2} />
        <span className="hidden sm:inline">SVG</span>
      </button>

      {/* Divisor Delicado */}
      <div className="h-4 w-[1px] bg-black/[0.08] mx-1 shrink-0" aria-hidden="true" />

      {/* 2. Histórico de Edição (Undo / Redo) */}
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className="btn-tactile p-1.5 rounded-full text-foreground-secondary hover:text-foreground-primary hover:bg-black/[0.05] disabled:opacity-25 disabled:pointer-events-none transition-colors"
        title={`Desfazer (${formatShortcut('Z')})`}
        aria-label="Desfazer alteração"
      >
        <Undo2 className="w-3.5 h-3.5" strokeWidth={1.8} />
      </button>

      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className="btn-tactile p-1.5 rounded-full text-foreground-secondary hover:text-foreground-primary hover:bg-black/[0.05] disabled:opacity-25 disabled:pointer-events-none transition-colors"
        title={`Refazer (${formatShortcut('Y')})`}
        aria-label="Refazer alteração"
      >
        <Redo2 className="w-3.5 h-3.5" strokeWidth={1.8} />
      </button>

      {/* 3. Ações Contextuais do Elemento Selecionado */}
      {selectedField && (
        <>
          <div className="h-4 w-[1px] bg-black/[0.08] mx-1 shrink-0" aria-hidden="true" />

          {onToggleLockSelected && (
            <button
              type="button"
              onClick={onToggleLockSelected}
              className={`btn-tactile p-1.5 rounded-full transition-colors ${
                selectedField.locked
                  ? 'bg-amber-500/10 text-amber-600'
                  : 'text-foreground-secondary hover:text-foreground-primary hover:bg-black/[0.05]'
              }`}
              title={selectedField.locked ? 'Desbloquear elemento selecionado' : 'Bloquear posição do elemento'}
              aria-label={selectedField.locked ? 'Desbloquear elemento' : 'Bloquear elemento'}
            >
              {selectedField.locked ? (
                <Lock className="w-3.5 h-3.5" strokeWidth={2} />
              ) : (
                <Unlock className="w-3.5 h-3.5" strokeWidth={1.8} />
              )}
            </button>
          )}

          {onDuplicateSelected && (
            <button
              type="button"
              onClick={onDuplicateSelected}
              className="btn-tactile p-1.5 rounded-full text-foreground-secondary hover:text-foreground-primary hover:bg-black/[0.05] transition-colors"
              title={`Duplicar elemento selecionado (${formatShortcut('D')})`}
              aria-label="Duplicar elemento"
            >
              <Copy className="w-3.5 h-3.5" strokeWidth={1.8} />
            </button>
          )}

          {onDeleteSelected && (
            <button
              type="button"
              onClick={onDeleteSelected}
              className="btn-tactile p-1.5 rounded-full text-destructive hover:bg-destructive/10 transition-colors"
              title="Excluir elemento selecionado (Delete)"
              aria-label="Excluir elemento"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
            </button>
          )}
        </>
      )}
    </div>
  );
};
