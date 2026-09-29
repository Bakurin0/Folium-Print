import { useState, useRef, useCallback } from 'react';

export interface ToastState {
  message: string;
  isExiting: boolean;
}

export interface UseToastReturn {
  toastState: ToastState | null;
  showToast: (message: string) => void;
}

/**
 * Hook modular para gerenciamento de notificações tipo Sonner com física de transição.
 * Sincronizado com as variáveis CSS --duration-normal (200ms).
 */
export function useToast(displayDurationMs: number = 2600, exitDurationMs: number = 200): UseToastReturn {
  const [toastState, setToastState] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toastExitTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback(
    (message: string) => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastExitTimerRef.current) clearTimeout(toastExitTimerRef.current);

      setToastState({ message, isExiting: false });

      toastTimerRef.current = setTimeout(() => {
        setToastState((curr) => (curr ? { ...curr, isExiting: true } : null));
        toastExitTimerRef.current = setTimeout(() => {
          setToastState(null);
        }, exitDurationMs);
      }, displayDurationMs);
    },
    [displayDurationMs, exitDurationMs]
  );

  return { toastState, showToast };
}
