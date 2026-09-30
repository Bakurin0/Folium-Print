import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Download,
  Trash2,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileText
} from 'lucide-react';
import {
  auditLocalStorage,
  exportFoliumBackup,
  purgeAllFoliumData,
  sanitizeTemplateDefinition,
  LocalStorageAuditReport
} from '../utils/sanitization';
import { loadCustomTemplates, saveCustomTemplate } from '../utils/customTemplatesStorage';

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
  onDataPurged?: () => void;
}

export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
  isOpen,
  onClose,
  showToast,
  onDataPurged,
}) => {
  const [report, setReport] = useState<LocalStorageAuditReport>({ items: [], totalBytes: 0 });
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [activeTab, setActiveTab] = useState<'storage' | 'compliance'>('storage');

  useEffect(() => {
    if (isOpen) {
      setReport(auditLocalStorage());
      setConfirmPurge(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExportBackup = () => {
    try {
      const json = exportFoliumBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `folium-print-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Backup dos dados locais exportado com sucesso.');
    } catch {
      showToast('Erro ao exportar dados locais.');
    }
  };

  const handleSanitizeCustomTemplates = () => {
    try {
      const templates = loadCustomTemplates();
      let totalPiiFixed = 0;

      templates.forEach((tmpl) => {
        // Objeto puro CustomTemplateDefinition
        const { render, isCustom, ...cleanDef } = tmpl;
        const result = sanitizeTemplateDefinition(cleanDef);
        if (result.piiCount > 0) {
          totalPiiFixed += result.piiCount;
          saveCustomTemplate(result.sanitized);
        }
      });

      setReport(auditLocalStorage());
      if (totalPiiFixed > 0) {
        showToast(`${totalPiiFixed} campo(s) de teste com dados sensíveis foram anonimizados.`);
      } else {
        showToast('Nenhum dado pessoal sensível detectado nos modelos.');
      }
    } catch {
      showToast('Erro ao sanitizar modelos.');
    }
  };

  const handleExecutePurge = () => {
    purgeAllFoliumData();
    showToast('Todos os dados locais foram excluídos com sucesso.');
    if (onDataPurged) {
      onDataPurged();
    } else {
      window.location.reload();
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-backdrop-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-card border border-border rounded-[10px] shadow-subtle max-w-xl w-full overflow-hidden animate-modal-enter flex flex-col max-h-[85vh]"
      >
        {/* Header no estilo macOS Window Chrome */}
        <div className="p-3.5 border-b border-border flex items-center justify-between bg-surface-subtle/50 shrink-0">
          <div className="flex items-center gap-2 text-foreground-primary">
            <div className="w-5 h-5 rounded-[5px] bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
            </div>
            <div>
              <h3 id="privacy-modal-title" className="font-semibold text-xs tracking-tight">
                Privacidade & Gestão de Dados Locais (LGPD)
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-tactile text-foreground-muted hover:text-foreground-primary p-1 rounded-[4px] hover:bg-surface-subtle"
            title="Fechar (Esc)"
            aria-label="Fechar janela de privacidade (Esc)"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        {/* Segmented Control / Tabs */}
        <div className="px-4 pt-3 border-b border-border/60 flex items-center justify-between shrink-0 bg-surface-app/30">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('storage')}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-[6px] border-b-2 transition-colors ${
                activeTab === 'storage'
                  ? 'border-foreground-primary text-foreground-primary bg-surface-card font-semibold'
                  : 'border-transparent text-foreground-muted hover:text-foreground-secondary'
              }`}
            >
              Armazenamento no Host ({formatSize(report.totalBytes)})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('compliance')}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-[6px] border-b-2 transition-colors ${
                activeTab === 'compliance'
                  ? 'border-foreground-primary text-foreground-primary bg-surface-card font-semibold'
                  : 'border-transparent text-foreground-muted hover:text-foreground-secondary'
              }`}
            >
              Declaração Privacy by Design
            </button>
          </div>

          <span className="text-[10px] font-mono text-emerald-600 font-medium px-2 py-0.5 rounded-[4px] bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            100% Offline
          </span>
        </div>

        {/* Conteúdo Principal com Scroll */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'storage' ? (
            <>
              {/* Card Informativo de Soberania do Dado */}
              <div className="p-3 rounded-[8px] bg-surface-subtle/60 border border-border/80 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-foreground-muted shrink-0 mt-0.5" />
                <div className="space-y-1 text-foreground-secondary leading-relaxed">
                  <p>
                    <strong className="text-foreground-primary">Soberania e Direitos do Titular (Art. 18):</strong>{' '}
                    Todos os dados de configuração, modelos e calibrações residem exclusivamente na memória do seu dispositivo. Nenhum registro é enviado a servidores externos.
                  </p>
                </div>
              </div>

              {/* Tabela de Itens Auditados no localStorage */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-foreground-muted uppercase tracking-wider px-1">
                  <span>Dado Persistido</span>
                  <span>Tamanho</span>
                </div>
                <div className="border border-border rounded-[6px] divide-y divide-border/60 bg-surface-card overflow-hidden">
                  {report.items.length === 0 ? (
                    <div className="p-3 text-center text-foreground-muted">
                      Nenhum dado local registrado no momento.
                    </div>
                  ) : (
                    report.items.map((item) => (
                      <div key={item.key} className="p-2.5 flex items-center justify-between hover:bg-surface-subtle/40 transition-colors">
                        <div className="space-y-0.5 max-w-[75%]">
                          <div className="font-medium text-foreground-primary flex items-center gap-1.5">
                            <span>{item.label}</span>
                            <span className="text-[10px] font-mono text-foreground-muted">({item.key})</span>
                          </div>
                          <p className="text-[11px] text-foreground-muted truncate">{item.description}</p>
                        </div>
                        <span className="font-mono text-xs text-foreground-secondary bg-surface-subtle px-1.5 py-0.5 rounded border border-border/40">
                          {formatSize(item.bytes)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Ações de Gestão de Dados (Portabilidade e Sanitização) */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="btn-tactile flex items-center justify-center gap-2 p-2 rounded-[6px] border border-border bg-surface-card hover:bg-surface-subtle text-foreground-primary font-medium text-xs shadow-2xs"
                  title="Exportar todos os modelos e dados para backup (Portabilidade - Art. 18, V)"
                >
                  <Download className="w-3.5 h-3.5 text-foreground-muted" />
                  <span>Exportar Dados (Art. 18, V)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSanitizeCustomTemplates}
                  className="btn-tactile flex items-center justify-center gap-2 p-2 rounded-[6px] border border-border bg-surface-card hover:bg-surface-subtle text-foreground-primary font-medium text-xs shadow-2xs"
                  title="Varre e anonimiza CPFs, telefones e emails salvos em modelos de teste"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sanitizar PII de Modelos</span>
                </button>
              </div>

              {/* Seção Crítica de Purga (Eliminação - Art. 18, VI) */}
              <div className="mt-3 p-3 rounded-[8px] border border-red-500/20 bg-red-500/[0.03] space-y-2">
                <div className="flex items-center gap-2 text-red-600 font-semibold text-xs">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Eliminação Definitiva de Dados (Art. 18, VI)</span>
                </div>
                <p className="text-[11px] text-foreground-muted leading-relaxed">
                  Apaga permanentemente todos os modelos customizados, calibrações e configurações salvas no dispositivo, restaurando a aplicação ao estado inicial de fábrica.
                </p>

                {confirmPurge ? (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleExecutePurge}
                      className="btn-tactile flex-1 py-1.5 px-3 rounded-[6px] bg-red-600 hover:bg-red-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirmar Exclusão Total</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmPurge(false)}
                      className="btn-tactile py-1.5 px-3 rounded-[6px] border border-border bg-surface-card hover:bg-surface-subtle text-foreground-secondary text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmPurge(true)}
                    className="btn-tactile py-1.5 px-3 rounded-[6px] border border-red-500/30 hover:bg-red-500/10 text-red-600 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Restaurar Padrões de Fábrica & Purgar Dados</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Aba de Declaração de Conformidade & Privacy by Design */
            <div className="space-y-3 leading-relaxed">
              <div className="p-3 rounded-[8px] bg-surface-subtle/60 border border-border/80 space-y-2">
                <div className="flex items-center gap-2 text-foreground-primary font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Princípios da LGPD no Folium Print</span>
                </div>
                <ul className="space-y-1.5 text-foreground-secondary text-[11px]">
                  <li>
                    <strong>Finalidade e Adequação (Art. 6º, I e II):</strong> As informações inseridas no formulário são utilizadas única e exclusivamente para a renderização material na impressora física.
                  </li>
                  <li>
                    <strong>Não Compartilhamento (Art. 6º, VI):</strong> Não existem servidores de nuvem, APIs de terceiros ou serviços de analytics que recebam dados processados pelo aplicativo.
                  </li>
                  <li>
                    <strong>Isolamento de Rede (CSP Estrito):</strong> Todas as fontes, vetores e scripts operam localmente (Zero External Requests).
                  </li>
                  <li>
                    <strong>Papel do Operador:</strong> O usuário/empresa que opera a máquina é classificado juridicamente como <em>Controlador</em> dos dados pessoais impressos nas etiquetas (Art. 5º, VI).
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-[8px] bg-surface-card border border-border flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium text-foreground-primary flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-foreground-muted" />
                    <span>Relatório Completo de Conformidade</span>
                  </div>
                  <p className="text-[11px] text-foreground-muted">
                    Consulte a análise jurídica e técnica detalhada em <code className="font-mono text-[10px]">docs/LGPD_CONFORMIDADE.md</code>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé da Janela */}
        <div className="p-3 border-t border-border bg-surface-subtle/50 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-foreground-muted font-mono">
            Folium Print · LGPD Compliance & Privacy by Design
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-tactile px-3 py-1 rounded-[6px] border border-border bg-surface-card hover:bg-surface-subtle text-foreground-primary text-xs font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
