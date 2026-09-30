import React from 'react';
import { Calendar, Tag } from 'lucide-react';
import { DateFormat } from '../types/template';
import { DATE_FORMAT_OPTIONS, formatDate } from '../utils/dateUtils';

interface DatePropertiesControlProps {
  dateFormat?: DateFormat;
  onChangeDateFormat: (format: DateFormat) => void;
  datePrefix?: string;
  onChangeDatePrefix: (prefix: string) => void;
  isAutoDate?: boolean;
  onChangeIsAutoDate: (auto: boolean) => void;
}

const COMMON_PREFIXES = ['Data: ', 'Fab: ', 'Val: ', 'Emissão: ', 'Lote: '];

export const DatePropertiesControl: React.FC<DatePropertiesControlProps> = ({
  dateFormat = 'DD/MM/YYYY',
  onChangeDateFormat,
  datePrefix = '',
  onChangeDatePrefix,
  isAutoDate = true,
  onChangeIsAutoDate,
}) => {
  // Prévia da data atual com as configurações selecionadas
  const livePreview = React.useMemo(() => {
    return formatDate(new Date(), dateFormat, datePrefix);
  }, [dateFormat, datePrefix]);

  return (
    <div className="space-y-3 p-2.5 bg-black/[0.02] border border-border/70 rounded-[8px]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground-primary flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#fb5607]" />
          <span>Configuração da Data</span>
        </span>
        <span className="text-[10px] font-mono text-[#fb5607] bg-[#fb5607]/10 px-1.5 py-0.5 rounded border border-[#fb5607]/20 font-medium">
          {dateFormat}
        </span>
      </div>

      {/* Caixa de Live Preview */}
      <div className="p-2 bg-white rounded-[6px] border border-border/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[9.5px] uppercase tracking-wider text-foreground-muted block font-semibold">
            Pré-visualização do Valor
          </span>
          <span className="text-xs font-semibold text-foreground-primary font-mono">
            {livePreview}
          </span>
        </div>
        <div className="text-[10px] text-foreground-muted bg-surface-subtle px-1.5 py-0.5 rounded border border-border">
          Hoje
        </div>
      </div>

      {/* Seletor de Formato */}
      <div className="space-y-1">
        <label className="text-[10.5px] font-medium text-foreground-primary block">
          Formato de Exibição
        </label>
        <select
          value={dateFormat}
          onChange={(e) => onChangeDateFormat(e.target.value as DateFormat)}
          className="w-full px-2 py-1.5 bg-white border border-border/80 focus:border-[#3a86ff] focus:ring-2 focus:ring-[#3a86ff]/15 rounded-[6px] text-xs font-medium text-foreground-primary outline-none transition-colors duration-instant"
        >
          {DATE_FORMAT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} — Ex: {opt.example}
            </option>
          ))}
        </select>
      </div>

      {/* Prefixo Customizado */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10.5px] font-medium text-foreground-primary flex items-center gap-1">
            <Tag className="w-3 h-3 text-foreground-muted" />
            <span>Prefixo da Data (Opcional)</span>
          </label>
          {datePrefix && (
            <button
              type="button"
              onClick={() => onChangeDatePrefix('')}
              className="text-[10px] text-foreground-muted hover:text-foreground-primary hover:underline"
            >
              Limpar
            </button>
          )}
        </div>
        <input
          type="text"
          value={datePrefix}
          onChange={(e) => onChangeDatePrefix(e.target.value)}
          placeholder="ex: Fab: , Val: , Data: "
          className="w-full px-2 py-1.5 bg-white border border-border/80 focus:border-[#3a86ff] focus:ring-2 focus:ring-[#3a86ff]/15 rounded-[6px] text-xs text-foreground-primary outline-none transition-colors duration-instant font-mono"
        />

        {/* Chips de atalhos de prefixos comuns */}
        <div className="flex items-center gap-1 flex-wrap pt-0.5">
          <span className="text-[9.5px] text-foreground-muted">Sugestões:</span>
          {COMMON_PREFIXES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChangeDatePrefix(p)}
              className={`btn-tactile text-[9.5px] px-1.5 py-0.5 rounded-[4px] border font-mono transition-all active:scale-[0.96] ${
                datePrefix === p
                  ? 'border-[#fb5607] bg-[#fb5607]/10 text-[#fb5607] font-semibold'
                  : 'border-border/80 text-foreground-muted hover:text-foreground-primary hover:bg-white'
              }`}
            >
              {p.trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Preenchimento Automático Switch */}
      <div className="pt-2 border-t border-border/60">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground-primary">
          <input
            type="checkbox"
            checked={isAutoDate}
            onChange={(e) => onChangeIsAutoDate(e.target.checked)}
            className="rounded accent-[#111111]"
          />
          <span className="font-medium">Preencher com a data atual automaticamente</span>
        </label>
        <p className="text-[10px] text-foreground-muted pl-5 mt-0.5">
          No formulário de impressão, o operador ainda poderá alterar a data manualmente se necessário.
        </p>
      </div>
    </div>
  );
};
