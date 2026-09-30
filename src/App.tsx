import React, { useState, useRef, useEffect, useCallback, Suspense, lazy } from 'react';
import { getDefaultFormData } from './templates';
import { 
  Template, 
  TemplateField,
  FieldType,
  TemplateFormData, 
  CustomTemplateDefinition, 
  FontWeightOption 
} from './types/template';
import { UnifiedToolbar } from './components/UnifiedToolbar';
import { ModelsSidebar } from './components/ModelsSidebar';
import { StudioCanvas } from './components/StudioCanvas';
import { InspectorPanel, InspectorTab } from './components/InspectorPanel';
import { HomeDashboard } from './components/HomeDashboard';
import { executePixelPerfectPrint } from './utils/printService';
import { exportTemplateAsFile, ExportFormat } from './utils/templateFileIO';

// Carregamento sob demanda (code-splitting dinâmico) para modais secundários
const ShortcutsModal = lazy(() => import('./components/ShortcutsModal').then(m => ({ default: m.ShortcutsModal })));
const PrivacySettingsModal = lazy(() => import('./components/PrivacySettingsModal').then(m => ({ default: m.PrivacySettingsModal })));
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
    updateCurrentTemplate,
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

  // Modo de Operação do Studio: 'print' (Impressão) vs 'design' (Edição Visual)
  const [studioMode, setStudioMode] = useState<'print' | 'design'>('print');
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Pilha de Histórico de Undo / Redo no Modo Design
  const [history, setHistory] = useState<TemplateField[][]>(() =>
    currentTemplate ? [currentTemplate.fields] : []
  );
  const [historyIndex, setHistoryIndex] = useState<number>(() =>
    currentTemplate ? 0 : -1
  );

  // Nome da impressora do usuário com persistência local
  const [printerName, setPrinterName] = useState<string>(() => {
    try {
      return localStorage.getItem('folium_printer_name') || '';
    } catch {
      return '';
    }
  });

  const handleUpdatePrinterName = (name: string) => {
    setPrinterName(name);
    try {
      if (name.trim()) {
        localStorage.setItem('folium_printer_name', name.trim());
      } else {
        localStorage.removeItem('folium_printer_name');
      }
    } catch {}
  };

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
      // Editor -> Home: Afastamento suave
      // ponytail: Native Web Animations API replaces 70kB GSAP bundle
      viewContainerRef.current.animate(
        [
          { opacity: 0, transform: 'scale(1.03)', filter: 'blur(3px)' },
          { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
        ],
        { duration: 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      );
    } else {
      // Home -> Editor: Entrada contínua suave
      viewContainerRef.current.animate(
        [
          { opacity: 0, transform: 'scale(0.98)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        { duration: 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      );
    }
  }, [isHomeOpen]);

  // Seleção de modelo com transição direta e ágil para o estúdio
  const handleSelectTemplate = useCallback(
    (id: string) => {
      selectTemplate(id);
      if (isHomeOpen) {
        setIsHomeOpen(false);
      }
    },
    [selectTemplate, isHomeOpen]
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

  const handleChangeFieldWeight = useCallback(
    (fieldKey: string, weight: FontWeightOption) => {
      if (!currentTemplate) return;
      const updatedFields = currentTemplate.fields.map((f) =>
        f.key === fieldKey ? { ...f, fontWeight: weight } : f
      );
      updateCurrentTemplateFields(updatedFields);
    },
    [currentTemplate, updateCurrentTemplateFields]
  );

  const handleResetForm = useCallback(() => {
    if (!currentTemplate) return;
    setFormData(getDefaultFormData(currentTemplate));
    showToast('Formulário restaurado para os valores padrão.');
  }, [currentTemplate, showToast]);

  // Sincroniza histórico de undo/redo ao trocar de template
  useEffect(() => {
    if (currentTemplate) {
      setHistory([currentTemplate.fields]);
      setHistoryIndex(0);
      setHasUnsavedChanges(false);
      setSelectedFieldKey(null);
    }
  }, [currentTemplate?.id]);

  const pushHistory = useCallback((nextFields: TemplateField[]) => {
    setHistory((prev) => {
      const updated = prev.slice(0, historyIndex + 1);
      const newStack = [...updated, nextFields];
      if (newStack.length > 30) newStack.shift();
      return newStack;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 29));
    setHasUnsavedChanges(true);
  }, [historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (!canUndo || !currentTemplate) return;
    const targetFields = history[historyIndex - 1];
    setHistoryIndex(historyIndex - 1);
    updateCurrentTemplateFields(targetFields);
    showToast('Ação desfeita.');
  }, [canUndo, currentTemplate, history, historyIndex, updateCurrentTemplateFields, showToast]);

  const handleRedo = useCallback(() => {
    if (!canRedo || !currentTemplate) return;
    const targetFields = history[historyIndex + 1];
    setHistoryIndex(historyIndex + 1);
    updateCurrentTemplateFields(targetFields);
    showToast('Ação refeita.');
  }, [canRedo, currentTemplate, history, historyIndex, updateCurrentTemplateFields, showToast]);

  const handleAddField = useCallback((type: FieldType, extra?: Partial<TemplateField>) => {
    if (!currentTemplate) return;
    const key = `campo_${Date.now()}`;
    const isDate = type === 'date' || extra?.isAutoDate;
    const defaultLabel = isDate
      ? 'Data'
      : type === 'barcode'
      ? 'Código de Barras'
      : type === 'qrcode'
      ? 'QR Code'
      : type === 'svg'
      ? 'Logotipo SVG'
      : type === 'textarea'
      ? 'Observações'
      : `Campo ${currentTemplate.fields.length + 1}`;

    const defaultVal = isDate
      ? 'today'
      : type === 'barcode'
      ? '123456789'
      : type === 'qrcode'
      ? 'https://folium.print'
      : type === 'textarea'
      ? 'Texto multilinha aqui...'
      : 'Texto de exemplo';

    const newField: TemplateField = {
      key,
      label: defaultLabel,
      type,
      required: false,
      defaultValue: defaultVal,
      xMm: 5,
      yMm: Math.min(currentTemplate.dimensions.heightMm - 10, 5 + currentTemplate.fields.length * 6),
      widthMm: type === 'qrcode' ? 14 : type === 'svg' ? 20 : isDate ? Math.min(currentTemplate.dimensions.widthMm - 10, 36) : Math.min(currentTemplate.dimensions.widthMm - 10, 60),
      heightMm: type === 'barcode' ? 16 : type === 'qrcode' ? 14 : type === 'svg' ? 14 : type === 'textarea' ? 16 : 8,
      fontSizePt: 8.5,
      fontWeight: 'normal',
      textAlign: 'left',
      autoScaleFont: false,
      showBorder: false,
      showLabel: type === 'text' || isDate,
      barcodeFormat: type === 'barcode' ? 'CODE128' : undefined,
      dateFormat: isDate ? 'DD/MM/YYYY' : undefined,
      datePrefix: '',
      isAutoDate: isDate,
      svgFill: type === 'svg' ? '#000000' : undefined,
      svgStroke: type === 'svg' ? '' : undefined,
      svgStrokeWidth: type === 'svg' ? 0 : undefined,
      svgRotation: 0,
      svgFlipH: false,
      svgFlipV: false,
      ...extra,
    };

    const nextFields = [...currentTemplate.fields, newField];
    updateCurrentTemplateFields(nextFields);
    pushHistory(nextFields);
    setSelectedFieldKey(key);
    showToast(`Elemento "${defaultLabel}" adicionado`);
  }, [currentTemplate, updateCurrentTemplateFields, pushHistory, showToast]);

  const handleRemoveField = useCallback((key: string) => {
    if (!currentTemplate || currentTemplate.fields.length <= 1) {
      showToast('O modelo precisa ter pelo menos um elemento.');
      return;
    }
    const nextFields = currentTemplate.fields.filter((f) => f.key !== key);
    updateCurrentTemplateFields(nextFields);
    pushHistory(nextFields);
    if (selectedFieldKey === key) {
      setSelectedFieldKey(nextFields[0]?.key || null);
    }
    showToast('Elemento removido.');
  }, [currentTemplate, selectedFieldKey, updateCurrentTemplateFields, pushHistory, showToast]);

  const handleDuplicateField = useCallback((field: TemplateField) => {
    if (!currentTemplate) return;
    const newKey = `campo_${Date.now()}`;
    const duplicated: TemplateField = {
      ...field,
      key: newKey,
      label: `${field.label} (Cópia)`,
      xMm: Math.min(currentTemplate.dimensions.widthMm - (field.widthMm ?? 30), (field.xMm ?? 0) + 3),
      yMm: Math.min(currentTemplate.dimensions.heightMm - (field.heightMm ?? 8), (field.yMm ?? 0) + 3),
    };
    const nextFields = [...currentTemplate.fields, duplicated];
    updateCurrentTemplateFields(nextFields);
    pushHistory(nextFields);
    setSelectedFieldKey(newKey);
    showToast('Elemento duplicado.');
  }, [currentTemplate, updateCurrentTemplateFields, pushHistory, showToast]);

  const handleToggleLockField = useCallback((key: string) => {
    if (!currentTemplate) return;
    const nextFields = currentTemplate.fields.map((f) =>
      f.key === key ? { ...f, locked: !f.locked } : f
    );
    updateCurrentTemplateFields(nextFields);
    pushHistory(nextFields);
  }, [currentTemplate, updateCurrentTemplateFields, pushHistory]);

  const handleUpdateField = useCallback((key: string, updates: Partial<TemplateField>) => {
    if (!currentTemplate) return;
    const nextFields = currentTemplate.fields.map((f) =>
      f.key === key ? { ...f, ...updates } : f
    );
    updateCurrentTemplateFields(nextFields);
    pushHistory(nextFields);
  }, [currentTemplate, updateCurrentTemplateFields, pushHistory]);

  const handleUpdateTemplateProps = useCallback((updates: Partial<Template>) => {
    if (!currentTemplate) return;
    updateCurrentTemplate(updates);
    setHasUnsavedChanges(true);
  }, [currentTemplate, updateCurrentTemplate]);

  const handleSaveTemplate = useCallback(() => {
    if (!currentTemplate) return;
    if (currentTemplate.isCustom) {
      updateCurrentTemplate({});
      setHasUnsavedChanges(false);
      showToast('Modelo personalizado salvo com sucesso!');
    } else {
      const customDef: CustomTemplateDefinition = {
        id: `custom_${Date.now()}`,
        name: `${currentTemplate.name} (Personalizado)`,
        category: currentTemplate.category,
        description: currentTemplate.description || 'Modelo personalizado criado a partir de modelo nativo.',
        dimensions: { ...currentTemplate.dimensions },
        grid: currentTemplate.grid,
        fields: [...currentTemplate.fields],
        backgroundSvg: currentTemplate.backgroundSvg,
        backgroundSvgFill: currentTemplate.backgroundSvgFill,
        backgroundSvgStroke: currentTemplate.backgroundSvgStroke,
        backgroundSvgStrokeWidth: currentTemplate.backgroundSvgStrokeWidth,
        backgroundSvgRotation: currentTemplate.backgroundSvgRotation,
        backgroundSvgFlipH: currentTemplate.backgroundSvgFlipH,
        backgroundSvgFlipV: currentTemplate.backgroundSvgFlipV,
        backgroundSvgOpacity: currentTemplate.backgroundSvgOpacity,
        defaultFontWeight: currentTemplate.defaultFontWeight,
        isCustom: true,
      };
      const saved = saveTemplate(customDef);
      selectTemplate(saved.id);
      setHasUnsavedChanges(false);
      showToast('Novo modelo personalizado criado e salvo!');
    }
  }, [currentTemplate, updateCurrentTemplate, saveTemplate, selectTemplate, showToast]);

  const handleDiscardChanges = useCallback(() => {
    if (!currentTemplate) return;
    selectTemplate(currentTemplate.id);
    setHasUnsavedChanges(false);
    showToast('Alterações descartadas.');
  }, [currentTemplate, selectTemplate, showToast]);

  const handleCreateNewBlankTemplate = useCallback(() => {
    const newDef: CustomTemplateDefinition = {
      id: `custom_${Date.now()}`,
      name: 'Nova Etiqueta Personalizada',
      category: 'thermal',
      description: 'Etiqueta térmica em branco criada no Studio.',
      dimensions: {
        widthMm: 80,
        heightMm: 50,
        orientation: 'landscape',
      },
      fields: [
        {
          key: 'titulo',
          label: 'Título Principal',
          type: 'text',
          required: true,
          defaultValue: 'FOLIUM PRINT',
          xMm: 5,
          yMm: 5,
          widthMm: 70,
          heightMm: 10,
          fontSizePt: 12,
          fontWeight: 'bold',
          textAlign: 'center',
          showLabel: false,
        },
        {
          key: 'codigo',
          label: 'Código de Barras',
          type: 'barcode',
          required: false,
          defaultValue: '7891234567890',
          barcodeFormat: 'CODE128',
          xMm: 5,
          yMm: 18,
          widthMm: 70,
          heightMm: 18,
          showLabel: false,
        },
        {
          key: 'data_emissao',
          label: 'Data',
          type: 'date',
          required: false,
          defaultValue: 'today',
          dateFormat: 'DD/MM/YYYY',
          isAutoDate: true,
          datePrefix: 'Data: ',
          xMm: 5,
          yMm: 38,
          widthMm: 40,
          heightMm: 7,
          fontSizePt: 8,
          showLabel: false,
        },
      ],
      isCustom: true,
    };

    const created = saveTemplate(newDef);
    selectTemplate(created.id);
    setStudioMode('design');
    setIsHomeOpen(false);
    showToast('Nova etiqueta criada! Pronto para edição de design.');
  }, [saveTemplate, selectTemplate, showToast]);

  const handleExportTemplate = useCallback((format: ExportFormat) => {
    if (!currentTemplate) return;
    const def: CustomTemplateDefinition = {
      id: currentTemplate.id,
      name: currentTemplate.name,
      category: currentTemplate.category,
      description: currentTemplate.description,
      dimensions: currentTemplate.dimensions,
      grid: currentTemplate.grid,
      fields: currentTemplate.fields,
      backgroundSvg: currentTemplate.backgroundSvg,
      backgroundSvgFill: currentTemplate.backgroundSvgFill,
      backgroundSvgStroke: currentTemplate.backgroundSvgStroke,
      backgroundSvgStrokeWidth: currentTemplate.backgroundSvgStrokeWidth,
      backgroundSvgRotation: currentTemplate.backgroundSvgRotation,
      backgroundSvgFlipH: currentTemplate.backgroundSvgFlipH,
      backgroundSvgFlipV: currentTemplate.backgroundSvgFlipV,
      backgroundSvgOpacity: currentTemplate.backgroundSvgOpacity,
      defaultFontWeight: currentTemplate.defaultFontWeight,
      isCustom: true,
    };
    exportTemplateAsFile(def, format);
    showToast(`Modelo exportado em formato ${format.toUpperCase()}`);
  }, [currentTemplate, showToast]);

  const handleImportTemplate = useCallback((def: CustomTemplateDefinition) => {
    const saved = saveTemplate(def);
    selectTemplate(saved.id);
    setStudioMode('design');
    setIsHomeOpen(false);
    showToast(`Modelo "${saved.name}" importado com sucesso!`);
  }, [saveTemplate, selectTemplate, showToast]);

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
    onToggleStudioMode: () => setStudioMode((prev) => (prev === 'print' ? 'design' : 'print')),
    onToggleShortcutsModal: () => setIsShortcutsModalOpen((prev) => !prev),
    onToggleLeftSidebar: () => setIsLeftSidebarOpen((prev) => !prev),
    onToggleRightSidebar: () => setIsRightSidebarOpen((prev) => !prev),
    onToggleFocusMode: handleToggleFocusMode,
    isModalOpen: isShortcutsModalOpen || isPrivacyModalOpen,
    onCloseModal: () => {
      setIsShortcutsModalOpen(false);
      setIsPrivacyModalOpen(false);
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
        studioMode={studioMode}
        onToggleStudioMode={setStudioMode}
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
              onOpenCreateModal={handleCreateNewBlankTemplate}
              onImportTemplate={handleImportTemplate}
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
            onOpenCreateModal={handleCreateNewBlankTemplate}
            onEditCustomTemplate={(tpl) => {
              selectTemplate(tpl.id);
              setStudioMode('design');
              setIsHomeOpen(false);
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
          onCreateTemplate={handleCreateNewBlankTemplate}
          onOpenHome={() => setIsHomeOpen(true)}
          studioMode={studioMode}
          selectedFieldKey={selectedFieldKey}
          onSelectFieldKey={setSelectedFieldKey}
          onAddField={handleAddField}
          onRemoveField={handleRemoveField}
          onDuplicateField={handleDuplicateField}
          onToggleLockField={handleToggleLockField}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onInlineEditCommit={(key, val) => {
            handleUpdateField(key, { defaultValue: val });
            handleChangeField(key, val);
          }}
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
          onChangeFieldWeight={handleChangeFieldWeight}
          onChangeCopies={handleChangeCopies}
          onChangeStartPosition={handleChangeStartPosition}
          onChangeOffset={setOffset}
          onChangeColorAdjustments={setColorAdjustments}
          onChangeCropMarks={setCropMarks}
          onChangePaperSelection={setPaperSelection}
          onResetForm={handleResetForm}
          onExportPdf={handlePrint}
          printerName={printerName}
          onChangePrinterName={handleUpdatePrinterName}
          studioMode={studioMode}
          selectedFieldKey={selectedFieldKey}
          onUpdateField={handleUpdateField}
          onRemoveField={handleRemoveField}
          onDuplicateField={handleDuplicateField}
          onUpdateTemplateProps={handleUpdateTemplateProps}
          onSaveTemplate={handleSaveTemplate}
          onDiscardChanges={handleDiscardChanges}
          hasUnsavedChanges={hasUnsavedChanges}
          onExportTemplate={handleExportTemplate}
          onImportTemplate={handleImportTemplate}
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
