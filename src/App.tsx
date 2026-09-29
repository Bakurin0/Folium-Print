import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ALL_TEMPLATES, getDefaultFormData } from './templates';
import { CalibrationOffset, TemplateFormData, Template, CustomTemplateDefinition } from './types/template';
import { Header } from './components/Header';
import { TemplateSelector } from './components/TemplateSelector';
import { DynamicForm } from './components/DynamicForm';
import { SheetGridOptions } from './components/SheetGridOptions';
import { CalibrationPanel } from './components/CalibrationPanel';
import { PrintActions } from './components/PrintActions';
import { PreviewCanvas } from './components/PreviewCanvas';
import { ShortcutsModal } from './components/ShortcutsModal';
import { VisualTemplateEditorModal } from './components/VisualTemplateEditorModal';
import { executePixelPerfectPrint } from './utils/printService';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { loadCustomTemplates, saveCustomTemplate, deleteCustomTemplate } from './utils/customTemplatesStorage';
import { FilePlus, Printer } from 'lucide-react';

export const App: React.FC = () => {
  // ponytail: App defaults to clean physical print daylight theme for ergonomics.
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('folium-theme');
  }, []);

  // Custom Templates loaded from localStorage
  const [customTemplates, setCustomTemplates] = useState<Template[]>(() => loadCustomTemplates());

  // Combined Template Catalog
  const allAvailableTemplates = useMemo(() => {
    return [...ALL_TEMPLATES, ...customTemplates];
  }, [customTemplates]);

  // Selected Template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    const list = loadCustomTemplates();
    return list[0]?.id || '';
  });

  const currentTemplate = useMemo(() => {
    return (
      allAvailableTemplates.find((t) => t.id === selectedTemplateId) ||
      allAvailableTemplates[0] ||
      null
    );
  }, [allAvailableTemplates, selectedTemplateId]);

  // Form Data per template
  const [formData, setFormData] = useState<TemplateFormData>(() =>
    getDefaultFormData(currentTemplate)
  );

  // Calibration Offsets per template (persisted in localStorage)
  const [offset, setOffset] = useState<CalibrationOffset>(() => {
    if (!currentTemplate) return { offsetX: 0, offsetY: 0 };
    try {
      const saved = localStorage.getItem(`folium-offset-${currentTemplate.id}`);
      return saved ? JSON.parse(saved) : { offsetX: 0, offsetY: 0 };
    } catch {
      return { offsetX: 0, offsetY: 0 };
    }
  });

  // UI state
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplateDefinition | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Refs
  const printContainerRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Handle template selection
  const handleSelectTemplate = useCallback((templateId: string) => {
    const nextTemplate = allAvailableTemplates.find((t) => t.id === templateId);
    if (!nextTemplate) return;

    setSelectedTemplateId(templateId);
    setFormData(getDefaultFormData(nextTemplate));

    // Load saved offset for template
    try {
      const savedOffset = localStorage.getItem(`folium-offset-${templateId}`);
      setOffset(savedOffset ? JSON.parse(savedOffset) : { offsetX: 0, offsetY: 0 });
    } catch {
      setOffset({ offsetX: 0, offsetY: 0 });
    }

    // Auto-focus first input for ergonomic keyboard workflow
    setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);
  }, [allAvailableTemplates]);

  // Cycle next template (via shortcut Ctrl+T)
  const handleNextTemplate = useCallback(() => {
    if (allAvailableTemplates.length <= 1) return;
    const currentIndex = allAvailableTemplates.findIndex((t) => t.id === selectedTemplateId);
    const nextIndex = (currentIndex + 1) % allAvailableTemplates.length;
    handleSelectTemplate(allAvailableTemplates[nextIndex].id);
  }, [allAvailableTemplates, selectedTemplateId, handleSelectTemplate]);

  // Field change
  const handleChangeField = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Grid options change (copies & start position)
  const handleChangeCopies = (copies: number) => {
    setFormData((prev) => ({
      ...prev,
      _gridCopies: copies,
    }));
  };

  const handleChangeStartPosition = (startPosition: number) => {
    setFormData((prev) => ({
      ...prev,
      _gridStartPosition: startPosition,
    }));
  };

  // Calibration offset change
  const handleChangeOffset = (newOffset: CalibrationOffset) => {
    setOffset(newOffset);
    if (!currentTemplate) return;
    try {
      localStorage.setItem(`folium-offset-${currentTemplate.id}`, JSON.stringify(newOffset));
    } catch (e) {
      console.warn('Could not save offset to localStorage', e);
    }
  };

  // Reset form data to defaults
  const handleResetForm = useCallback(() => {
    if (!currentTemplate) return;
    setFormData(getDefaultFormData(currentTemplate));
    showToast('Formulário restaurado para os valores padrão.');
  }, [currentTemplate]);

  // Toast notification helper
  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification((curr) => (curr === message ? null : curr));
    }, 2800);
  };

  // Create or update custom template
  const handleSaveCustomTemplate = (def: CustomTemplateDefinition) => {
    const newTemplate = saveCustomTemplate(def);
    const updated = loadCustomTemplates();
    setCustomTemplates(updated);
    handleSelectTemplate(newTemplate.id);
    showToast(`Modelo "${def.name}" salvo com sucesso!`);
  };

  // Delete custom template
  const handleDeleteCustomTemplate = (id: string) => {
    deleteCustomTemplate(id);
    const updated = loadCustomTemplates();
    setCustomTemplates(updated);
    if (selectedTemplateId === id) {
      if (updated.length > 0) {
        handleSelectTemplate(updated[0].id);
      } else {
        setSelectedTemplateId('');
        setFormData({});
      }
    }
    showToast('Modelo personalizado excluído.');
  };

  // Print execution
  const handlePrint = useCallback(async () => {
    if (!currentTemplate || !printContainerRef.current) return;

    try {
      setIsPrinting(true);
      showToast('Enviando para o spooler de impressão...');

      // Clone rendered markup for exact printing
      const htmlContent = printContainerRef.current.innerHTML;

      await executePixelPerfectPrint({
        template: currentTemplate,
        htmlContent,
        offset,
      });

      setIsPrinting(false);
    } catch (error) {
      console.error('Print error:', error);
      setIsPrinting(false);
      showToast('Erro ao disparar impressão.');
    }
  }, [currentTemplate, offset]);

  // Operational Keyboard Shortcuts
  useKeyboardShortcuts({
    onPrint: () => {
      if (currentTemplate) handlePrint();
    },
    onNextTemplate: handleNextTemplate,
    onReset: handleResetForm,
    onToggleShortcutsModal: () => setIsShortcutsModalOpen((prev) => !prev),
    isModalOpen: isShortcutsModalOpen || isEditorOpen,
    onCloseModal: () => {
      setIsShortcutsModalOpen(false);
      setIsEditorOpen(false);
    },
  });

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface-app text-foreground-primary">
      {/* Top Application Bar */}
      <Header
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
      />

      {/* Main Split-Screen Layout (40% Left Form / 60% Right Vector Preview) */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: 40% Width (Form-First Architecture) */}
        <section
          aria-label="Controles e Formulário"
          className="w-full lg:w-[40%] xl:w-[38%] border-r border-border bg-surface-card flex flex-col h-full overflow-hidden shrink-0 z-10"
        >
          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 1. Template Selector */}
            <TemplateSelector
              templates={allAvailableTemplates}
              selectedTemplateId={selectedTemplateId}
              onSelectTemplate={handleSelectTemplate}
              onOpenCreateModal={() => {
                setEditingTemplate(null);
                setIsEditorOpen(true);
              }}
              onEditCustomTemplate={(tpl) => {
                setEditingTemplate(tpl);
                setIsEditorOpen(true);
              }}
              onDeleteCustomTemplate={handleDeleteCustomTemplate}
            />

            <hr className="border-border" />

            {/* 2. Dynamic Form Inputs or Empty State */}
            {currentTemplate ? (
              <>
                <DynamicForm
                  fields={currentTemplate.fields}
                  formData={formData}
                  onChangeField={handleChangeField}
                  firstInputRef={firstInputRef}
                />

                {/* 3. A4 Sheet Grid Configuration (if applicable) */}
                {currentTemplate.grid && (
                  <SheetGridOptions
                    grid={currentTemplate.grid}
                    copies={Number(formData._gridCopies ?? 30)}
                    startPosition={Number(formData._gridStartPosition ?? 0)}
                    onChangeCopies={handleChangeCopies}
                    onChangeStartPosition={handleChangeStartPosition}
                  />
                )}

                {/* 4. Mechanical Offset Calibration (Collapsible) */}
                <CalibrationPanel
                  offset={offset}
                  onChangeOffset={handleChangeOffset}
                  templateName={currentTemplate.name}
                />
              </>
            ) : (
              <div className="p-6 text-center bg-surface-subtle rounded-[6px] border border-dashed border-border space-y-3 my-4">
                <div className="w-8 h-8 rounded-[6px] border border-border bg-surface-card text-foreground-primary flex items-center justify-center mx-auto">
                  <FilePlus className="w-4 h-4 text-foreground-muted" strokeWidth={1.8} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-foreground-primary">Nenhum modelo cadastrado</h4>
                  <p className="text-[11px] text-foreground-muted">
                    Crie um modelo personalizado com vetores SVG e posicionamento milimétrico.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTemplate(null);
                    setIsEditorOpen(true);
                  }}
                  className="px-3 py-1.5 bg-[#111111] text-white text-xs font-medium rounded-[6px] hover:bg-[#27272a] inline-flex items-center gap-1.5 transition-colors"
                >
                  <FilePlus className="w-3.5 h-3.5" strokeWidth={1.8} />
                  <span>Criar Primeiro Modelo</span>
                </button>
              </div>
            )}
          </div>

          {/* Sticky Bottom Actions */}
          <div className="p-4 bg-surface-card border-t border-border">
            <PrintActions
              onPrint={handlePrint}
              onReset={handleResetForm}
              isPrinting={isPrinting}
              disabled={!currentTemplate}
            />
          </div>
        </section>

        {/* Right Panel: 60% Width (Vector WYSIWYG Preview) */}
        <section
          aria-label="Área de Pré-visualização"
          className="hidden lg:flex lg:w-[60%] xl:w-[62%] h-full flex-col relative"
        >
          {currentTemplate ? (
            <PreviewCanvas
              template={currentTemplate}
              formData={formData}
              offset={offset}
              printContainerRef={printContainerRef}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-foreground-muted space-y-3 bg-surface-canvas p-8 text-center select-none">
              <div className="w-16 h-16 rounded-2xl bg-surface-card border border-border flex items-center justify-center shadow-md text-primary">
                <Printer className="w-8 h-8 opacity-40" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="font-semibold text-sm text-foreground-primary">Nenhum modelo selecionado</h3>
                <p className="text-xs text-foreground-muted">
                  Crie ou selecione um modelo de etiqueta para visualizar em escala real com calibração milimétrica.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingTemplate(null);
                  setIsEditorOpen(true);
                }}
                className="mt-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover shadow-md transition-all flex items-center gap-1.5"
              >
                <FilePlus className="w-4 h-4" />
                <span>Criar Modelo Personalizado</span>
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Visual Template & SVG Editor Modal */}
      <VisualTemplateEditorModal
        isOpen={isEditorOpen}
        initialTemplate={editingTemplate}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveCustomTemplate}
      />

      {/* Shortcuts Help Modal */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Floating Status Notification / Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-surface-card border border-border text-foreground-primary px-3 py-2 rounded-[6px] shadow-subtle text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-1.5 h-1.5 rounded-full bg-azure-blue" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
};

export default App;
