import React from 'react';
import { Keyboard } from 'lucide-react';
import appIcon from '../assets/app-icon.png';

interface HeaderProps {
  onOpenShortcutsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenShortcutsModal }) => {
  return (
    <header className="h-14 border-b border-border/80 apple-glass px-5 flex items-center justify-between shrink-0 select-none sticky top-0 z-30">
      {/* Brand & Identity */}
      <div className="flex items-center gap-2.5">
        <img
          src={appIcon}
          alt="Folium Print Icon"
          className="w-7 h-7 rounded-[7px] object-contain shadow-xs border border-black/5"
        />
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold tracking-display text-foreground-primary">
            Folium Print
          </h1>
          <span className="text-[9px] tracking-caption uppercase font-mono px-1.5 py-0.5 rounded-[4px] border border-border bg-surface-subtle/80 text-foreground-muted">
            V0.1 · DESKTOP
          </span>
        </div>
      </div>

      {/* Right Actions: Shortcuts */}
      <div className="flex items-center gap-3">

        <button
          type="button"
          onClick={onOpenShortcutsModal}
          className="btn-tactile inline-flex items-center gap-1.5 text-xs text-foreground-secondary hover:text-foreground-primary bg-surface-card hover:bg-surface-subtle border border-border px-2.5 py-1 rounded-[6px]"
          title="Ver atalhos operacionais (?)"
          aria-label="Atalhos operacionais de teclado (pressione ?)"
        >
          <Keyboard className="w-3.5 h-3.5 text-foreground-muted" strokeWidth={1.8} aria-hidden="true" />
          <span className="hidden sm:inline">Atalhos</span>
          <kbd className="text-[10px] font-mono border border-border bg-surface-subtle px-1 py-0.5 rounded-[4px] text-foreground-muted" aria-hidden="true">
            ?
          </kbd>
        </button>
      </div>
    </header>
  );
};
