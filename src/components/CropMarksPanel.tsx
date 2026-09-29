import React from 'react';
import { CropMarkSettings } from '../types/template';
import { Scissors, Target, Grid } from 'lucide-react';

interface CropMarksPanelProps {
  settings: CropMarkSettings;
  onChangeSettings: (settings: CropMarkSettings) => void;
  hasGrid?: boolean;
}

export const CropMarksPanel: React.FC<CropMarksPanelProps> = ({
  settings,
  onChangeSettings,
  hasGrid = false,
}) => {
  const handleToggleEnabled = (enabled: boolean) => {
    onChangeSettings({
      ...settings,
      enabled,
    });
  };

  const handleUpdate = (partial: Partial<CropMarkSettings>) => {
    onChangeSettings({
      ...settings,
      ...partial,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header and Main Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Scissors className="w-4 h-4 text-pastel-violet-text" strokeWidth={2} />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-primary">
            Marcas de Corte (CorelDRAW)
          </h3>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => handleToggleEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-8 h-4.5 bg-surface-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-transform after:duration-snappy after:ease-out transition-colors duration-snappy ease-out peer-checked:bg-[#111111]" />
        </label>
      </div>

      {settings.enabled ? (
        <div className="space-y-3.5 pt-1">
          {/* Bleed (Sangria) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground-secondary font-medium">Sangria (Bleed)</span>
              <span className="font-mono text-[11px] font-semibold text-foreground-primary">
                {settings.bleedMm} mm
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[0, 1.5, 2, 3].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleUpdate({ bleedMm: val })}
                  className={`py-1 text-xs font-medium rounded-[4px] border transition-colors ${
                    settings.bleedMm === val
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-surface-subtle border-border text-foreground-secondary hover:text-foreground-primary hover:bg-surface-card'
                  }`}
                >
                  {val === 0 ? 'Sem sangria' : `${val} mm`}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-foreground-muted leading-tight">
              A sangria expande a área de segurança para que o corte na guilhotina mecânica não deixe filetes brancos.
            </p>
          </div>

          {/* Registration Targets Toggle */}
          <div className="flex items-center justify-between p-2 bg-surface-subtle border border-border rounded-[6px]">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-foreground-muted" />
              <div>
                <div className="text-xs font-medium text-foreground-primary">Alvos de Registro</div>
                <div className="text-[10px] text-foreground-muted">Cruzetas nos eixos centrais</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.showRegistrationMarks}
              onChange={(e) => handleUpdate({ showRegistrationMarks: e.target.checked })}
              className="w-4 h-4 rounded border-border text-[#111111] focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Grid Inter-label Marks Toggle (Only if document has a grid) */}
          {hasGrid && (
            <div className="flex items-center justify-between p-2 bg-surface-subtle border border-border rounded-[6px]">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-foreground-muted" />
                <div>
                  <div className="text-xs font-medium text-foreground-primary">Marcas na Grade Interna</div>
                  <div className="text-[10px] text-foreground-muted">Traços entre cada etiqueta/cartão</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.showGridMarks}
                onChange={(e) => handleUpdate({ showGridMarks: e.target.checked })}
                className="w-4 h-4 rounded border-border text-[#111111] focus:ring-0 cursor-pointer"
              />
            </div>
          )}

          {/* Mark Length */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground-secondary font-medium">Tamanho do Traço</span>
              <span className="font-mono text-[11px] text-foreground-muted">{settings.markLengthMm} mm</span>
            </div>
            <input
              type="range"
              min={2}
              max={8}
              step={1}
              value={settings.markLengthMm}
              onChange={(e) => handleUpdate({ markLengthMm: Number(e.target.value) })}
              className="w-full h-1.5 bg-surface-subtle rounded-lg appearance-none cursor-pointer accent-[#111111]"
            />
          </div>
        </div>
      ) : (
        <div className="p-3 bg-surface-subtle rounded-[6px] border border-dashed border-border text-center space-y-1">
          <p className="text-[11px] text-foreground-muted">
            Marcas de corte desativadas. Ative a chave acima para incluir linhas guia de corte e cruzetas de registro.
          </p>
        </div>
      )}
    </div>
  );
};
