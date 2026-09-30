import { useEffect } from 'react';

interface UseKeyboardShortcutsOptions {
  onPrint: () => void;
  onNextTemplate: () => void;
  onReset: () => void;
  onToggleShortcutsModal: () => void;
  onToggleLeftSidebar?: () => void;
  onToggleRightSidebar?: () => void;
  onToggleFocusMode?: () => void;
  onCloseFile?: () => void;
  onToggleHome?: () => void;
  isModalOpen: boolean;
  onCloseModal: () => void;
}

export const useKeyboardShortcuts = ({
  onPrint,
  onNextTemplate,
  onReset,
  onToggleShortcutsModal,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  onToggleFocusMode,
  onCloseFile,
  onToggleHome,
  isModalOpen,
  onCloseModal,
}: UseKeyboardShortcutsOptions) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If modal is open, ESC closes modal
      if (isModalOpen && e.key === 'Escape') {
        e.preventDefault();
        onCloseModal();
        return;
      }

      // Ctrl + H or Cmd + H -> Toggle Home / Dashboard
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h' && onToggleHome) {
        e.preventDefault();
        onToggleHome();
        return;
      }

      // Ctrl + W or Cmd + W -> Fechar arquivo aberto
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w' && onCloseFile) {
        e.preventDefault();
        onCloseFile();
        return;
      }

      // Ctrl + P or Cmd + P -> Trigger Print
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        onPrint();
        return;
      }

      // Ctrl + Shift + F or Cmd + Shift + F -> Toggle Focus Mode
      if ((e.ctrlKey || e.metaKey) && (e.shiftKey || e.altKey) && e.key.toLowerCase() === 'f' && onToggleFocusMode) {
        e.preventDefault();
        onToggleFocusMode();
        return;
      }

      // Se estiver digitando em um campo de texto, preserva atalhos tipográficos locais
      const isInputFocused =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      // Ctrl + B or Cmd + B -> Toggle Left Sidebar (apenas quando fora de campos de texto)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        if (!isInputFocused && onToggleLeftSidebar) {
          e.preventDefault();
          onToggleLeftSidebar();
          return;
        }
      }

      // Ctrl + I or Cmd + I -> Toggle Right Inspector
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i' && onToggleRightSidebar) {
        e.preventDefault();
        onToggleRightSidebar();
        return;
      }

      // Ctrl + Enter -> Trigger Print
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        onPrint();
        return;
      }

      // Ctrl + T -> Cycle Template
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        onNextTemplate();
        return;
      }

      // Esc -> Reset Form (when not inside modal)
      if (e.key === 'Escape') {
        onReset();
        return;
      }

      // F1 or Shift + ? -> Toggle Shortcuts Help
      if (e.key === 'F1' || (e.shiftKey && e.key === '?')) {
        e.preventDefault();
        onToggleShortcutsModal();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onPrint, 
    onNextTemplate, 
    onReset, 
    onToggleShortcutsModal, 
    onToggleLeftSidebar, 
    onToggleRightSidebar, 
    onToggleFocusMode,
    onCloseFile,
    onToggleHome,
    isModalOpen, 
    onCloseModal
  ]);
};
