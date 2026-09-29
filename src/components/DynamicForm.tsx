import React from 'react';
import { TemplateField, TemplateFormData } from '../types/template';
import { Barcode, QrCode, Calendar, Hash, Type } from 'lucide-react';

interface DynamicFormProps {
  fields: TemplateField[];
  formData: TemplateFormData;
  onChangeField: (key: string, value: any) => void;
  firstInputRef?: React.RefObject<HTMLInputElement>;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  formData,
  onChangeField,
  firstInputRef,
}) => {
  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'barcode':
        return <Barcode className="w-3.5 h-3.5 text-foreground-muted" strokeWidth={1.8} />;
      case 'qrcode':
        return <QrCode className="w-3.5 h-3.5 text-foreground-muted" strokeWidth={1.8} />;
      case 'date':
        return <Calendar className="w-3.5 h-3.5 text-foreground-muted" strokeWidth={1.8} />;
      case 'number':
        return <Hash className="w-3.5 h-3.5 text-foreground-muted" strokeWidth={1.8} />;
      default:
        return <Type className="w-3.5 h-3.5 text-foreground-muted" strokeWidth={1.8} />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
          Dados da Etiqueta
        </label>
        <span className="text-[11px] text-foreground-muted font-mono">
          Form-First
        </span>
      </div>

      <div className="space-y-2.5">
        {fields.map((field, idx) => {
          const value = formData[field.key] ?? '';
          const isFirst = idx === 0;

          return (
            <div key={field.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor={`field-${field.key}`}
                  className="font-medium text-foreground-primary flex items-center gap-1.5"
                >
                  {getFieldIcon(field.type)}
                  <span>{field.label}</span>
                  {field.required && (
                    <span className="text-neon-pink font-mono text-[10px]" title="Obrigatório">
                      *
                    </span>
                  )}
                </label>
                {field.barcodeFormat && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-[3px] bg-pastel-blue-bg text-pastel-blue-text border border-pastel-blue-border">
                    {field.barcodeFormat}
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  ref={isFirst ? firstInputRef : undefined}
                  id={`field-${field.key}`}
                  type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  value={value}
                  onChange={(e) => onChangeField(field.key, e.target.value)}
                  placeholder={field.placeholder || `Informe ${field.label.toLowerCase()}`}
                  required={field.required}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  className="w-full text-xs font-medium px-2.5 py-1.5 bg-surface-card border border-border rounded-[4px] placeholder:text-foreground-muted focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all text-foreground-primary"
                />
              </div>

              {field.helperText && (
                <p className="text-[10px] text-foreground-muted">
                  {field.helperText}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
