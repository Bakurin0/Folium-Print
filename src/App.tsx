import React, { useState, useRef, useEffect, useCallback, Suspense, lazy } from 'react';
import gsap from 'gsap';
import { getDefaultFormData } from './templates';
import { Template, TemplateFormData, CustomTemplateDefinition } from './types/template';
import { UnifiedToolbar } from './components/UnifiedToolbar';
import { ModelsSidebar } from './components/ModelsSidebar';
import { StudioCanvas } from './components/StudioCanvas';
import { InspectorPanel, InspectorTab } from './components/InspectorPanel';
import { HomeDashboard } from './components/HomeDashboard';
import { PrinterBootAnimation } from './components/PrinterBootAnimation';
import { executePixelPerfectPrint } from './utils/printService';

// Carregamento sob demanda (code-splitting dinâmico) para modais secundários
const ShortcutsModal = lazy(() => import('./components/ShortcutsModal').then(m => ({ default: m.ShortcutsModal })));
const PrivacySettingsModal = lazy(() => import('./components/PrivacySettingsModal').then(m => ({ default: m.PrivacySettingsModal })));
const VisualTemplateEditorModal = lazy(() => import('./components/VisualTemplateEditorModal').then(m => ({ default: m.VisualTemplateEditorModal })));
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
    customTemplates,
    selectedTemplateId,
    currentTemplate,
    selectTemplate,
    closeTemplate,
    nextTemplate,
    saveTemplate,
    updateCurrentTemplateFields,
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

  // 6. Estado das Barras Laterais, Foco e Modais
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(true);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState<InspectorTab>('data');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplateDefinition | null>(null);
  // Estado de Boot Mecânico da Impressora Térmica (disparado ao abrir modelo na Home)
  const [isPrinterBooting, setIsPrinterBooting] = useState<boolean>(false);
  const [bootingTemplate, setBootingTemplate] = useState<Template | null>(null);

  // 6.5 Estado da Tela de Início / Home Dashboard com persistência de sessão
  const [isHomeOpen, setIsHomeOpen] = useState<boolean>(() => {
    try {
      const savedHome = localStorage.getItem('folium-is-home-open');
      if (savedHome !== null) {
        return savedHome === 'true';
      }
    } catch {}
    return !currentTemplate;
  });

  useEffect(() => {
    try {
      localStorage.setItem('folium-is-home-open', String(isHomeOpen));
    } catch {}
  }, [isHomeOpen]);

  // 6.6 Transição Cinemática entre Home e Editor via GSAP
  const isInitialMount = useRef(true);
  const viewContainerRef = useRef<HTMLDivElement>(null);
  const prevIsHomeOpen = useRef(isHomeOpen);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevIsHomeOpen.current = isHomeOpen;
      return;
    }

    if (!viewContainerRef.current) return;

    // Respeita acessibilidade (prefers-reduced-motion)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Previne re-execução duplicada se isHomeOpen não mudou
    if (prevIsHomeOpen.current === isHomeOpen) {
      return;
    }
    prevIsHomeOpen.current = isHomeOpen;

    if (isHomeOpen) {
      // Editor -> Home: Afastamento em profundidade (Zoom Out Z)
      gsap.fromTo(
        viewContainerRef.current,
        {
          opacity: 0,
          scale: 1.04,
          z: 50,
          filter: 'blur(4px)',
        },
        {
          opacity: 1,
          scale: 1,
          z: 0,
          filter: 'blur(0px)',
          duration: 0.4,
          ease: 'power2.out',
          clearProps: 'transform,filter,opacity',
        }
      );
    } else {
      // Home -> Editor: Entrada contínua suave (0 -> 1 em 400ms) sem duplo piscar
      gsap.fromTo(
        viewContainerRef.current,
        {
          opacity: 0,
          scale: 0.98,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        }
      );
    }
  }, [isHomeOpen]);

  // Seleção de modelo com transição tátil mecânica da impressora para o editor
  const handleSelectTemplate = useCallback(
    (id: string) => {
      const target = templates.find((t) => t.id === id) || null;
      selectTemplate(id);
      if (isHomeOpen) {
        setBootingTemplate(target);
        setIsPrinterBooting(true);
      }
    },
    [selectTemplate, isHomeOpen, templates]
  );

  // Duplicação de modelo personalizado ou padrão para customizado
  const handleDuplicateTemplate = useCallback(
    (tpl: Template) => {
      const def: CustomTemplateDefinition = {
        id: `custom-${Date.now()}`,
        name: `${tpl.name} (Cópia)`,
        category: tpl.category,
        description: tpl.description,
        dimensions: tpl.dimensions,
        grid: tpl.grid,
        backgroundSvg: tpl.backgroundSvg,
        fields: tpl.fields ? JSON.parse(JSON.stringify(tpl.fields)) : [],
        isCustom: true,
      };
      saveTemplate(def);
      showToast(`Modelo duplicado como "${def.name}".`);
    },
    [saveTemplate, showToast]
  );

  // Alternância do Modo Foco (Oculta ambas as barras laterais)
  const handleToggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => {
      const next = !prev;
      if (next) {
        setIsLeftSidebarOpen(false);
        setIsRightSidebarOpen(false);
      } else {
        setIsLeftSidebarOpen(true);
        setIsRightSidebarOpen(true);
      }
      return next;
    });
  }, []);

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
    if (isHomeOpen) {
      setBootingTemplate(saved);
      setIsPrinterBooting(true);
    }
    setIsHomeOpen(false);
    showToast(`Modelo "${saved.name}" salvo com sucesso!`);
  };

  const handleDeleteCustomTemplate = (id: string) => {
    deleteTemplate(id);
    showToast('Modelo personalizado excluído.');
  };

  // Cálculo de produção (total de etiquetas impressas nesta folha/sessão)
  const productionCount = currentTemplate?.grid
    ? Number(formData._gridCopies ?? (currentTemplate.grid.rows * currentTemplate.grid.cols))
    : Number(formData._thermalCopies ?? 1);

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

  // Fechar o arquivo / modelo aberto atual e retornar à Home
  const handleCloseFile = useCallback(() => {
    closeTemplate();
    setIsHomeOpen(true);
    showToast('Modelo fechado.');
  }, [closeTemplate, showToast]);

  // 8. Atalhos de Teclado Operacionais (macOS & Windows)
  useKeyboardShortcuts({
    onPrint: () => {
      if (currentTemplate) handlePrint();
    },
    onNextTemplate: nextTemplate,
    onReset: handleResetForm,
    onCloseFile: handleCloseFile,
    onToggleHome: () => setIsHomeOpen((prev) => !prev),
    onToggleShortcutsModal: () => setIsShortcutsModalOpen((prev) => !prev),
    onToggleLeftSidebar: () => setIsLeftSidebarOpen((prev) => !prev),
    onToggleRightSidebar: () => setIsRightSidebarOpen((prev) => !prev),
    onToggleFocusMode: handleToggleFocusMode,
    isModalOpen: isShortcutsModalOpen || isEditorOpen || isPrivacyModalOpen,
    onCloseModal: () => {
      setIsShortcutsModalOpen(false);
      setIsEditorOpen(false);
      setIsPrivacyModalOpen(false);
    },
  });

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface-app text-foreground-primary">
      {/* Animação Tátil de Boot: Impressora Térmica Alimentando o Papel */}
      {isPrinterBooting && (
        <PrinterBootAnimation
          activeTemplate={bootingTemplate || currentTemplate}
          formData={formData}
          onRevealStudio={() => {
            setIsHomeOpen(false);
          }}
          onComplete={() => {
            setIsHomeOpen(false);
            setIsPrinterBooting(false);
            setBootingTemplate(null);
          }}
        />
      )}

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
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
        onPrint={handlePrint}
        onCloseTemplate={handleCloseFile}
        isPrinting={isPrinting}
        colorAdjustments={colorAdjustments}
        cropMarks={cropMarks}
        isFocusMode={isFocusMode}
        onToggleFocusMode={handleToggleFocusMode}
        productionCount={productionCount}
        isHomeOpen={isHomeOpen}
        onToggleHome={() => setIsHomeOpen((prev) => !prev)}
      />

      {/* 2. Conteúdo Principal: Transição 3D Cinemática (Home ⇄ Editor) */}
      <div
        ref={viewContainerRef}
        className="flex-1 flex overflow-hidden relative"
        style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
      >
        {isHomeOpen ? (
          <div key="home-view" className="flex-1 flex flex-col overflow-hidden">
            <HomeDashboard
              currentTemplate={currentTemplate}
              customTemplates={customTemplates}
              onSelectTemplate={handleSelectTemplate}
              onOpenCreateModal={() => {
                setEditingTemplate(null);
                setIsEditorOpen(true);
              }}
              onImportTemplate={(def) => {
                const saved = saveTemplate(def);
                handleSelectTemplate(saved.id);
              }}
              onDeleteCustomTemplate={handleDeleteCustomTemplate}
              onDuplicateTemplate={handleDuplicateTemplate}
              onReturnToEditor={() => setIsHomeOpen(false)}
              showToast={showToast}
            />
          </div>
        ) : (
          <main key="editor-view" id="main-content" className="flex-1 flex overflow-hidden relative">
          {/* Coluna 1: Biblioteca de Modelos (Retrátil) */}
          <ModelsSidebar
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            isOpen={isLeftSidebarOpen}
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

        {/* Coluna 2: Studio Canvas - Prancheta WYSIWYG de Alta Fidelidade */}
        <StudioCanvas
          template={currentTemplate}
          formData={formData}
          offset={offset}
          colorAdjustments={colorAdjustments}
          cropMarks={cropMarks}
          onUpdateTemplateFields={updateCurrentTemplateFields}
          onCreateTemplate={() => {
            setEditingTemplate(null);
            setIsEditorOpen(true);
          }}
          onOpenHome={() => setIsHomeOpen(true)}
        />

        {/* Coluna 3: Inspector de Ajustes (Retrátil com Segmented Control) */}
        <InspectorPanel
          currentTemplate={currentTemplate}
          isOpen={isRightSidebarOpen}
          activeTab={activeInspectorTab}
          onChangeTab={setActiveInspectorTab}
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
      )}
      </div>

      {/* Container de Impressão Off-screen Isolado (Garante envio puro ao spooler fora do fluxo de renderização) */}
      <div
        ref={printOffscreenRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-99999px',
          top: '-99999px',
          width: currentTemplate ? `${currentTemplate.dimensions.widthMm}mm` : '0',
          height: currentTemplate ? `${currentTemplate.dimensions.heightMm}mm` : '0',
          pointerEvents: 'none',
          visibility: 'hidden',
          zIndex: -9999,
        }}
      >
        {currentTemplate && (
          currentTemplate.grid ? (
            <div
              className="print-page"
              style={{
                position: 'relative',
                width: `${currentTemplate.dimensions.widthMm}mm`,
                height: `${currentTemplate.dimensions.heightMm}mm`,
                overflow: 'hidden',
              }}
            >
              {currentTemplate.render({
                data: formData,
                offset: offset,
                isPreview: false,
                hideSingleCopy: formData._hideSingleCopy !== false,
              })}
              {cropMarks?.enabled && (
                <div
                  style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
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
          ) : (
            (() => {
              const copies = Math.max(1, Number(formData._thermalCopies ?? 1));
              return Array.from({ length: copies }, (_, i) => (
                <div
                  key={`print-page-${i}`}
                  className="print-page"
                  style={{
                    position: 'relative',
                    width: `${currentTemplate.dimensions.widthMm}mm`,
                    height: `${currentTemplate.dimensions.heightMm}mm`,
                    overflow: 'hidden',
                  }}
                >
                  {currentTemplate.render({
                    data: formData,
                    offset: offset,
                    isPreview: false,
                    copyIndex: i + 1,
                    copyTotal: copies,
                    hideSingleCopy: formData._hideSingleCopy !== false,
                  })}
                  {cropMarks?.enabled && (
                    <div
                      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
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
              ));
            })()
          )
        )}
      </div>

      {/* Modais com Carregamento Sob Demanda (Suspense) */}
      <Suspense fallback={null}>
        {isEditorOpen && (
          <VisualTemplateEditorModal
            isOpen={isEditorOpen}
            initialTemplate={editingTemplate}
            onClose={() => {
              setIsEditorOpen(false);
              setEditingTemplate(null);
            }}
            onSave={handleSaveCustomTemplate}
          />
        )}

        {isShortcutsModalOpen && (
          <ShortcutsModal
            isOpen={isShortcutsModalOpen}
            onClose={() => setIsShortcutsModalOpen(false)}
          />
        )}

        {isPrivacyModalOpen && (
          <PrivacySettingsModal
            isOpen={isPrivacyModalOpen}
            onClose={() => setIsPrivacyModalOpen(false)}
            showToast={showToast}
            onDataPurged={() => {
              setIsPrivacyModalOpen(false);
              window.location.reload();
            }}
          />
        )}
      </Suspense>

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
          <span>{toastState.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
