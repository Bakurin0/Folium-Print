import { useEffect } from 'react';

interface UseKeyboardShortcutsOptions {
  onPrint: () => void;
  onNextTemplate: () => void;
  onReset: () => void;
  onToggleShortcutsModal: () => void;
  onToggleLeftSidebar?: () => void;
  onToggleRightSidebar?: () => void;
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

      // Ctrl + P or Cmd + P -> Trigger Print
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        onPrint();
        return;
      }

      // Ctrl + B or Cmd + B -> Toggle Left Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && onToggleLeftSidebar) {
        e.preventDefault();
        onToggleLeftSidebar();
        return;
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
    isModalOpen, 
    onCloseModal
  ]);
};
