import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { sanitizeSvg } from '../utils/sanitizeSvg';

interface BarcodeProps {
  value: string;
  format?: 'CODE128' | 'EAN13';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

export const BarcodeSvg: React.FC<BarcodeProps> = ({
  value,
  format = 'CODE128',
  width = 2,
  height = 50,
  displayValue = true,
  fontSize = 12,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    if (!value || value.trim() === '') {
      setError('Código vazio');
      return;
    }

    try {
      setError(null);
      // EAN-13 requires strictly 12 or 13 digits
      if (format === 'EAN13') {
        const cleanVal = value.replace(/\D/g, '');
        if (cleanVal.length !== 12 && cleanVal.length !== 13) {
          setError('EAN-13 requer 12 ou 13 dígitos');
          return;
        }
      }

      JsBarcode(svgRef.current, value, {
        format: format,
        width: width,
        height: height,
        displayValue: displayValue,
        fontSize: fontSize,
        font: 'JetBrains Mono, monospace',
        fontOptions: 'bold',
        textAlign: 'center',
        textPosition: 'bottom',
        textMargin: 3,
        margin: 0,
        background: 'transparent',
        lineColor: '#000000',
      });
    } catch (err: any) {
      console.warn('Barcode generation error:', err);
      setError(err?.message || 'Código inválido');
    }
  }, [value, format, width, height, displayValue, fontSize]);

  if (error) {
    return (
      <div className={`flex items-center justify-center border border-dashed border-red-500 bg-red-50/50 p-2 text-xs text-red-600 rounded font-mono ${className}`}>
        ⚠️ {error}: "{value}"
      </div>
    );
  }

  return <svg ref={svgRef} className={`max-w-full block ${className}`} />;
};

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeSvg: React.FC<QRCodeProps> = ({
  value,
  size = 64,
  className = '',
}) => {
  const [svgString, setSvgString] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value || value.trim() === '') {
      setError('QR Code vazio');
      setSvgString('');
      return;
    }

    QRCode.toString(
      value,
      {
        type: 'svg',
        margin: 0,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#00000000', // transparent
        },
      },
      (err, string) => {
        if (err) {
          setError('Erro ao gerar QR Code');
          setSvgString('');
        } else {
          setError(null);
          setSvgString(string);
        }
      }
    );
  }, [value]);

  if (error) {
    return (
      <div className={`flex items-center justify-center border border-dashed border-red-500 bg-red-50 p-2 text-xs text-red-600 rounded font-mono ${className}`}>
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`inline-block overflow-hidden ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeSvg(svgString) }}
    />
  );
};
