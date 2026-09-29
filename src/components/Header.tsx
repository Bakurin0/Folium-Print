import React from 'react';
import { Keyboard } from 'lucide-react';
import appIcon from '../assets/app-icon.png';

interface HeaderProps {
  onOpenShortcutsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenShortcutsModal }) => {
  return (
    <header className="h-14 border-b border-border bg-surface-card px-5 flex items-center justify-between shrink-0 select-none">
      {/* Brand & Identity */}
      <div className="flex items-center gap-2.5">
        <img
          src={appIcon}
          alt="Folium Print Icon"
          className="w-7 h-7 rounded-[6px] object-contain"
        />
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold tracking-tight text-foreground-primary">
            Folium Print
          </h1>
          <span className="text-[9px] tracking-wider uppercase font-mono px-1.5 py-0.5 rounded-[4px] border border-border bg-surface-subtle text-foreground-muted">
            V0.1 · DESKTOP
          </span>
        </div>
      </div>

      {/* Right Actions: Spot Palette Micro-Swatches & Shortcuts */}
      <div className="flex items-center gap-3">
        {/* Spot Palette Micro-Bar */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-[6px] border border-border bg-surface-subtle"
          title="Paleta do Design System (5 Spot Colors)"
        >
          <span className="w-2 h-2 rounded-full bg-amber-gold" title="Amber Gold (#ffbe0b)" />
          <span className="w-2 h-2 rounded-full bg-blaze-orange" title="Blaze Orange (#fb5607)" />
          <span className="w-2 h-2 rounded-full bg-neon-pink" title="Neon Pink (#ff006e)" />
          <span className="w-2 h-2 rounded-full bg-blue-violet" title="Blue Violet (#8338ec)" />
          <span className="w-2 h-2 rounded-full bg-azure-blue" title="Azure Blue (#3a86ff)" />
        </div>

        <button
          type="button"
          onClick={onOpenShortcutsModal}
          className="inline-flex items-center gap-1.5 text-xs text-foreground-secondary hover:text-foreground-primary bg-surface-card hover:bg-surface-subtle border border-border px-2.5 py-1 rounded-[6px] transition-colors"
          title="Ver atalhos operacionais"
        >
          <Keyboard className="w-3.5 h-3.5 text-foreground-muted" strokeWidth={1.8} />
          <span className="hidden sm:inline">Atalhos</span>
          <kbd className="text-[10px] font-mono border border-border bg-surface-subtle px-1 py-0.5 rounded-[4px] text-foreground-muted">
            ?
          </kbd>
        </button>
      </div>
    </header>
  );
};
