import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getDefaultFormData } from './templates';
import { TemplateFormData, CustomTemplateDefinition } from './types/template';
import { UnifiedToolbar } from './components/UnifiedToolbar';
import { ModelsSidebar } from './components/ModelsSidebar';
import { StudioCanvas } from './components/StudioCanvas';
import { InspectorPanel } from './components/InspectorPanel';
import { ShortcutsModal } from './components/ShortcutsModal';
import { VisualTemplateEditorModal } from './components/VisualTemplateEditorModal';
import { executePixelPerfectPrint } from './utils/printService';
import { generateCropMarksSvg } from './utils/cropMarksGenerator';
import { sanitizeSvg } from './utils/sanitizeSvg';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTemplateCatalog } from './hooks/useTemplateCatalog';
import { usePrintSettings } from './hooks/usePrintSettings';
import { useToast } from './hooks/useToast';

export const App: React.FC = () => {
  // Configuração inicial de tema claro nativo
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('folium-theme');
  }, []);

  // 1. Notificações do Spooler / Toast Modular
  const { toastState, showToast } = useToast();

  // 2. Refs operacionais
  const firstInputRef = useRef<HTMLInputElement>(null);
  const printOffscreenRef = useRef<HTMLDivElement>(null);

  // 3. Catálogo de Modelos (Built-in + Personalizados)
  const {
    templates,
    selectedTemplateId,
    currentTemplate,
    selectTemplate,
    nextTemplate,
    saveTemplate,
    deleteTemplate,
  } = useTemplateCatalog((newTemplate) => {
    setFormData(getDefaultFormData(newTemplate));
    setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);
  });

  // 4. Configurações de Impressão, Calibração e Mídia
  const {
    offset,
    setOffset,
    colorAdjustments,
    setColorAdjustments,
    cropMarks,
    setCropMarks,
    paperSelection,
    setPaperSelection,
  } = usePrintSettings(currentTemplate);

  // 5. Dados do Formulário da Etiqueta Atual
  const [formData, setFormData] = useState<TemplateFormData>(() =>
    getDefaultFormData(currentTemplate)
  );

  // 6. Estado das Barras Laterais e Modais (macOS Studio Layout)
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(true);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplateDefinition | null>(null);

  // Handlers de dados
  const handleChangeField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleChangeCopies = (copies: number) => {
    setFormData((prev) => ({ ...prev, _gridCopies: copies }));
  };

  const handleChangeStartPosition = (startPosition: number) => {
    setFormData((prev) => ({ ...prev, _gridStartPosition: startPosition }));
  };

  const handleResetForm = useCallback(() => {
    if (!currentTemplate) return;
    setFormData(getDefaultFormData(currentTemplate));
    showToast('Formulário restaurado para os valores padrão.');
  }, [currentTemplate, showToast]);

  const handleSaveCustomTemplate = (def: CustomTemplateDefinition) => {
    const saved = saveTemplate(def);
    showToast(`Modelo "${saved.name}" salvo com sucesso!`);
  };

  const handleDeleteCustomTemplate = (id: string) => {
    deleteTemplate(id);
    showToast('Modelo personalizado excluído.');
  };

  // 7. Despacho de Impressão Físico (Desacoplado do DOM da tela)
  const handlePrint = useCallback(async () => {
    if (!currentTemplate || !printOffscreenRef.current) return;

    try {
      setIsPrinting(true);
      showToast('Enviando para o spooler de impressão...');

      // Captura o markup limpo do container dedicado de impressão física
      const htmlContent = printOffscreenRef.current.innerHTML;

      await executePixelPerfectPrint({
        template: currentTemplate,
        htmlContent,
        offset,
        colorAdjustments,
      });

      setIsPrinting(false);
    } catch (error) {
      console.error('Print error:', error);
      setIsPrinting(false);
      showToast('Erro ao disparar impressão.');
    }
  }, [currentTemplate, offset, colorAdjustments, showToast]);

  // 8. Atalhos de Teclado Operacionais (macOS & Windows)
  useKeyboardShortcuts({
    onPrint: () => {
      if (currentTemplate) handlePrint();
    },
    onNextTemplate: nextTemplate,
    onReset: handleResetForm,
    onToggleShortcutsModal: () => setIsShortcutsModalOpen((prev) => !prev),
    onToggleLeftSidebar: () => setIsLeftSidebarOpen((prev) => !prev),
    onToggleRightSidebar: () => setIsRightSidebarOpen((prev) => !prev),
    isModalOpen: isShortcutsModalOpen || isEditorOpen,
    onCloseModal: () => {
      setIsShortcutsModalOpen(false);
      setIsEditorOpen(false);
    },
  });

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface-app text-foreground-primary">
      {/* Skip Link de Acessibilidade (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-surface-card focus:text-foreground-primary focus:border focus:border-border focus:rounded-[6px] focus:shadow-md text-xs font-semibold"
      >
        Pular para o conteúdo principal
      </a>

      {/* 1. Barra de Ferramentas Superior Unificada macOS */}
      <UnifiedToolbar
        currentTemplate={currentTemplate}
        isLeftSidebarOpen={isLeftSidebarOpen}
        isRightSidebarOpen={isRightSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen((prev) => !prev)}
        onToggleRightSidebar={() => setIsRightSidebarOpen((prev) => !prev)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onPrint={handlePrint}
        isPrinting={isPrinting}
        colorAdjustments={colorAdjustments}
        cropMarks={cropMarks}
      />

      {/* 2. Workspace de Três Colunas (macOS Studio Layout) */}
      <main id="main-content" className="flex-1 flex overflow-hidden relative">
        {/* Coluna 1: Biblioteca de Modelos (Retrátil) */}
        <ModelsSidebar
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          isOpen={isLeftSidebarOpen}
          onSelectTemplate={selectTemplate}
          onOpenCreateModal={() => {
            setEditingTemplate(null);
            setIsEditorOpen(true);
          }}
          onEditCustomTemplate={(tpl) => {
            setEditingTemplate(tpl);
            setIsEditorOpen(true);
          }}
          onDeleteCustomTemplate={handleDeleteCustomTemplate}
          onSaveQuickPreset={handleSaveCustomTemplate}
        />

        {/* Coluna 2: Studio Canvas com Réguas Milimétricas Óticas */}
        <StudioCanvas
          template={currentTemplate}
          formData={formData}
          offset={offset}
          colorAdjustments={colorAdjustments}
          cropMarks={cropMarks}
        />

        {/* Coluna 3: Inspector de Ajustes (Retrátil com Segmented Control) */}
        <InspectorPanel
          currentTemplate={currentTemplate}
          isOpen={isRightSidebarOpen}
          formData={formData}
          offset={offset}
          colorAdjustments={colorAdjustments}
          cropMarks={cropMarks}
          paperSelection={paperSelection}
          firstInputRef={firstInputRef}
          onChangeField={handleChangeField}
          onChangeCopies={handleChangeCopies}
          onChangeStartPosition={handleChangeStartPosition}
          onChangeOffset={setOffset}
          onChangeColorAdjustments={setColorAdjustments}
          onChangeCropMarks={setCropMarks}
          onChangePaperSelection={setPaperSelection}
          onResetForm={handleResetForm}
          onExportPdf={handlePrint}
        />
      </main>

      {/* Container de Impressão Off-screen Isolado (Garante envio puro ao spooler) */}
      <div
        ref={printOffscreenRef}
        aria-hidden="true"
        className="sr-only fixed -left-[9999px] -top-[9999px] pointer-events-none"
        style={{
          width: currentTemplate ? `${currentTemplate.dimensions.widthMm}mm` : '0',
          height: currentTemplate ? `${currentTemplate.dimensions.heightMm}mm` : '0',
          position: 'relative',
        }}
      >
        {currentTemplate &&
          currentTemplate.render({
            data: formData,
            offset: offset,
            isPreview: false,
          })}
        {currentTemplate && cropMarks?.enabled && (
          <div
            className="absolute inset-0 pointer-events-none"
            dangerouslySetInnerHTML={{
              __html: sanitizeSvg(
                generateCropMarksSvg({
                  widthMm: currentTemplate.dimensions.widthMm,
                  heightMm: currentTemplate.dimensions.heightMm,
                  grid: currentTemplate.grid,
                  settings: cropMarks,
                })
              ),
            }}
          />
        )}
      </div>

      {/* Modais */}
      <VisualTemplateEditorModal
        isOpen={isEditorOpen}
        initialTemplate={editingTemplate}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveCustomTemplate}
      />

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Toast Notifier com Física de Transição Retargetável */}
      {toastState && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={`toast-container fixed bottom-4 right-4 z-50 bg-surface-card border border-border text-foreground-primary px-3 py-2 rounded-[6px] shadow-subtle text-xs font-medium flex items-center gap-2 ${
            toastState.isExiting ? 'toast-hidden' : 'toast-visible'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#3a86ff] shrink-0" aria-hidden="true" />
          <span>{toastState.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
