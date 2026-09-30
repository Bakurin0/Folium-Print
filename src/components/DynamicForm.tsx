import React from 'react';
import { TemplateField, TemplateFormData, FontWeightOption } from '../types/template';
import { getTodayIso, getTodayFormatted } from '../utils/dateUtils';
import { FontWeightControl } from './FontWeightControl';
import { cycleFontWeight } from '../utils/fontUtils';
import { 
  Barcode, 
  QrCode, 
  Calendar, 
  Hash, 
  Type, 
  X, 
  Wand2, 
  RotateCcw,
  AlignLeft,
  CalendarCheck
} from 'lucide-react';

interface DynamicFormProps {
  fields: TemplateField[];
  formData: TemplateFormData;
  defaultFontWeight?: FontWeightOption;
  onChangeField: (key: string, value: any) => void;
  onChangeFieldWeight?: (key: string, weight: FontWeightOption) => void;
  firstInputRef?: React.RefObject<HTMLInputElement>;
  onClearAll?: () => void;
}

/**
 * Identifica se um campo deve ser renderizado como textarea inteligente (multilinha)
 */
const isMultilineField = (field: TemplateField) => {
  if (field.type === 'textarea') return true;
  const key = field.key.toLowerCase();
  const label = field.label.toLowerCase();
  const multilineKeywords = [
    'endereco',
    'endereço',
    'obs',
    'observacao',
    'observação',
    'descricao',
    'descrição',
    'nota',
    'notas',
    'mensagem',
    'detalhes',
    'texto_longo',
  ];
  return multilineKeywords.some((k) => key.includes(k) || label.includes(k));
};

/**
 * Gerador de dados de teste rápido para códigos de barras ou QR codes
 */
const generateSampleData = (field: TemplateField) => {
  if (field.type === 'barcode') {
    if (field.barcodeFormat === 'EAN13') {
      const base12 = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(base12[i], 10) * (i % 2 === 0 ? 1 : 3);
      }
      const check = (10 - (sum % 10)) % 10;
      return `${base12}${check}`;
    }
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `FOL-${rand}`;
  }
  if (field.type === 'qrcode') {
    const randomId = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `https://folium.app/item/${randomId}`;
  }
  if (field.type === 'date' || field.isAutoDate) {
    return getTodayIso();
  }
  return '';
};

/**
 * Formulário Dinâmico Refinado (Studio Craft)
 * Suporte a botões de limpar rápido (X), textarea inteligente auto-grow,
 * gerador de dados de teste e densidade consistente de 32px.
 */
export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  formData,
  defaultFontWeight = 'normal',
  onChangeField,
  onChangeFieldWeight,
  firstInputRef,
  onClearAll,
}) => {
  // Filtra apenas os campos desbloqueados (editáveis pelo operador)
  const editableFields = React.useMemo(() => {
    return fields.filter((f) => !f.locked);
  }, [fields]);

  const getFieldIcon = (type: string, isMultiline: boolean) => {
    if (isMultiline) {
      return <AlignLeft className="w-3.5 h-3.5 text-[#3a86ff]" strokeWidth={1.8} aria-hidden="true" />;
    }
    switch (type) {
      case 'barcode':
        return <Barcode className="w-3.5 h-3.5 text-[#3a86ff]" strokeWidth={1.8} aria-hidden="true" />;
      case 'qrcode':
        return <QrCode className="w-3.5 h-3.5 text-[#8338ec]" strokeWidth={1.8} aria-hidden="true" />;
      case 'date':
        return <Calendar className="w-3.5 h-3.5 text-[#fb5607]" strokeWidth={1.8} aria-hidden="true" />;
      case 'number':
        return <Hash className="w-3.5 h-3.5 text-[#ffbe0b]" strokeWidth={1.8} aria-hidden="true" />;
      default:
        return <Type className="w-3.5 h-3.5 text-foreground-muted" strokeWidth={1.8} aria-hidden="true" />;
    }
  };

  // Limpa apenas os campos desbloqueados/editáveis da etiqueta
  const handleClearAllFields = () => {
    if (onClearAll) {
      onClearAll();
      return;
    }
    editableFields.forEach((f) => onChangeField(f.key, ''));
  };

  return (
    <div className="space-y-2.5 select-none">
      {/* Cabeçalho com Contagem e Ação Rápida */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-secondary">
          Campos da Etiqueta ({editableFields.length})
        </span>

        {editableFields.length > 0 && (
          <button
            type="button"
            onClick={handleClearAllFields}
            className="btn-tactile text-[10px] text-foreground-muted hover:text-foreground-primary flex items-center gap-1 hover:bg-black/[0.04] px-1.5 py-0.5 rounded-[4px] transition-colors"
            title="Limpar o conteúdo dos campos editáveis"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Limpar Campos</span>
          </button>
        )}
      </div>

      {/* Cartão de Entradas dos Campos ou Estado Vazio */}
      {editableFields.length === 0 ? (
        <div className="p-4 text-center text-xs text-foreground-muted bg-surface-subtle rounded-lg border border-dashed border-border space-y-1">
          <p className="font-medium text-foreground-primary">Todos os campos deste modelo são fixos.</p>
          <p className="text-[11px]">Nenhum dado variável precisa ser preenchido para impressão.</p>
        </div>
      ) : (
        <div className="bg-surface-card border border-black/[0.06] rounded-[10px] p-3 shadow-xs space-y-3">
          {editableFields.map((field, idx) => {
            const value = formData[field.key] ?? '';
            const hasValue = String(value).length > 0;
            const isFirst = idx === 0;
            const isMultiline = isMultilineField(field);

            return (
              <div key={field.key} className="space-y-1 group">
                {/* Rótulo e Badges Auxiliares */}
                <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor={`field-${field.key}`}
                  className="font-medium text-foreground-primary flex items-center gap-1.5 text-[11px] cursor-pointer"
                >
                  {getFieldIcon(field.type, isMultiline)}
                  <span>{field.label?.trim() || `Campo ${idx + 1}`}</span>
                  {field.required && (
                    <span className="text-[#ff006e] font-mono text-[10px]" title="Campo obrigatório">
                      *
                    </span>
                  )}
                </label>

                <div className="flex items-center gap-1.5">
                  {/* Botão de Amostra/Gerador para Códigos */}
                  {(field.type === 'barcode' || field.type === 'qrcode') && (
                    <button
                      type="button"
                      onClick={() => {
                        const sample = generateSampleData(field);
                        if (sample) onChangeField(field.key, sample);
                      }}
                      className="btn-tactile text-[9.5px] font-mono text-[#3a86ff] hover:bg-[#3a86ff]/10 px-1.5 py-0.5 rounded-[4px] flex items-center gap-1 transition-colors"
                      title="Gerar dado aleatório válido para teste"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      <span>Gerar</span>
                    </button>
                  )}

                  {/* Botão ou badge para token de cópia/volume em campos de texto */}
                  {field.type !== 'barcode' && field.type !== 'qrcode' && field.type !== 'svg' && (
                    /\{(?:copia|cópia|volume|total|volumes)\}/i.test(String(value || '')) ? (
                      <span
                        className="text-[9.5px] font-mono text-foreground-secondary bg-black/[0.035] border border-black/[0.06] px-1.5 py-0.5 rounded-[4px] flex items-center gap-1 select-none"
                        title="Identificador dinâmico ativo neste campo"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{'{copia}/{total}'}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const current = String(value || '');
                          const token = '{copia}/{total}';
                          onChangeField(field.key, current ? `${current} ${token}` : token);
                        }}
                        className="btn-tactile text-[9.5px] font-mono text-foreground-muted hover:text-foreground-primary hover:bg-black/[0.04] active:scale-95 px-1.5 py-0.5 rounded-[4px] flex items-center gap-1 transition-all"
                        title="Inserir identificador automático de volume ({copia}/{total})"
                      >
                        <span>+{'{copia}/{total}'}</span>
                      </button>
                    )
                  )}

                  {field.barcodeFormat && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-[4px] bg-[#3a86ff]/10 text-[#3a86ff] border border-[#3a86ff]/20">
                      {field.barcodeFormat}
                    </span>
                  )}

                  {(field.type === 'date' || field.isAutoDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        onChangeField(field.key, field.type === 'date' ? getTodayIso() : getTodayFormatted(field.dateFormat, field.datePrefix));
                      }}
                      className="btn-tactile text-[9.5px] font-medium text-foreground-muted hover:text-foreground-primary hover:bg-black/[0.04] active:scale-[0.96] px-1.5 py-0.5 rounded-[4px] flex items-center gap-1 transition-all"
                      title="Preencher com a data de hoje"
                    >
                      <CalendarCheck className="w-3 h-3 text-[#fb5607]" />
                      <span>Hoje</span>
                    </button>
                  )}

                  {/* Seletor Tátil de Peso Tipográfico (Regular / Bold / Extra Bold) */}
                  {field.type !== 'barcode' && field.type !== 'qrcode' && field.type !== 'svg' && onChangeFieldWeight && (
                    <FontWeightControl
                      value={field.fontWeight || defaultFontWeight}
                      onChange={(w) => onChangeFieldWeight(field.key, w)}
                      size="sm"
                      ariaLabel={`Peso da fonte para ${field.label}`}
                    />
                  )}
                </div>
              </div>

              {/* Input / Textarea com Botão Limpar X Integrado */}
              <div className="relative flex items-center">
                {isMultiline ? (
                  <div className="w-full relative">
                    <textarea
                      id={`field-${field.key}`}
                      rows={2}
                      value={value}
                      onChange={(e) => {
                        onChangeField(field.key, e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                      }}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && onChangeFieldWeight) {
                          e.preventDefault();
                          const cur = field.fontWeight || defaultFontWeight;
                          onChangeFieldWeight(field.key, cycleFontWeight(cur));
                        }
                      }}
                      placeholder={field.placeholder || `Informe ${field.label.toLowerCase()}`}
                      required={field.required}
                      aria-required={field.required}
                      aria-describedby={field.helperText ? `helper-${field.key}` : undefined}
                      className="w-full text-xs font-medium p-2 pr-7 bg-black/[0.025] hover:bg-black/[0.04] focus:bg-white border border-black/[0.08] focus:border-[#3a86ff] focus:ring-2 focus:ring-[#3a86ff]/20 rounded-[6px] placeholder:text-foreground-muted outline-none transition-all duration-snappy text-foreground-primary resize-none leading-relaxed"
                    />
                    {hasValue && (
                      <button
                        type="button"
                        onClick={() => {
                          onChangeField(field.key, '');
                          document.getElementById(`field-${field.key}`)?.focus();
                        }}
                        className="absolute right-1.5 top-2 p-1 text-foreground-muted hover:text-foreground-primary rounded-[4px] hover:bg-black/[0.05] transition-colors"
                        title="Limpar campo"
                        aria-label={`Limpar ${field.label}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-full relative">
                    <input
                      ref={isFirst ? firstInputRef : undefined}
                      id={`field-${field.key}`}
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      value={value}
                      onChange={(e) => onChangeField(field.key, e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && onChangeFieldWeight) {
                          e.preventDefault();
                          const cur = field.fontWeight || defaultFontWeight;
                          onChangeFieldWeight(field.key, cycleFontWeight(cur));
                        }
                      }}
                      placeholder={field.placeholder || `Informe ${field.label.toLowerCase()}`}
                      required={field.required}
                      aria-required={field.required}
                      aria-describedby={field.helperText ? `helper-${field.key}` : undefined}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      className="w-full text-xs font-medium px-2.5 pr-7 h-8 bg-black/[0.025] hover:bg-black/[0.04] focus:bg-white border border-black/[0.08] focus:border-[#3a86ff] focus:ring-2 focus:ring-[#3a86ff]/20 rounded-[6px] placeholder:text-foreground-muted outline-none transition-all duration-snappy text-foreground-primary"
                    />
                    {hasValue && (
                      <button
                        type="button"
                        onClick={() => {
                          onChangeField(field.key, '');
                          document.getElementById(`field-${field.key}`)?.focus();
                        }}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-foreground-muted hover:text-foreground-primary rounded-[4px] hover:bg-black/[0.05] transition-colors"
                        title="Limpar campo"
                        aria-label={`Limpar ${field.label}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Texto de Ajuda / Contador de Caracteres */}
              <div className="flex items-center justify-between text-[10px] text-foreground-muted px-0.5">
                {field.helperText ? (
                  <p id={`helper-${field.key}`}>{field.helperText}</p>
                ) : (
                  <span />
                )}
                {isMultiline && hasValue && (
                  <span className="font-mono text-[9px] text-foreground-muted/70">
                    {String(value).length} carac.
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
};
