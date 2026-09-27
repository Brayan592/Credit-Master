import React, { useState } from 'react';
import { X, Download, Upload, RotateCcw, Copy, Check, AlertCircle, Trash2, Sparkles } from 'lucide-react';
import { exportAllDataJSON, importAllDataJSON, resetToDemoData, resetToCleanState } from '../../utils/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const ImportExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [confirmClean, setConfirmClean] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    const data = exportAllDataJSON();
    setJsonText(data);
    navigator.clipboard.writeText(data).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const data = exportAllDataJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credimaster-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!jsonText.trim()) return;
    const success = importAllDataJSON(jsonText);
    if (success) {
      setImportStatus('success');
      setTimeout(() => {
        onDataChanged();
        onClose();
      }, 1000);
    } else {
      setImportStatus('error');
    }
  };

  const executeResetDemo = () => {
    resetToDemoData();
    onDataChanged();
    setConfirmDemo(false);
    onClose();
  };

  const executeResetClean = () => {
    resetToCleanState();
    onDataChanged();
    setConfirmClean(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl overflow-y-auto">
      <div className="relative w-full max-w-lg liquid-glass rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/20 my-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-semibold text-emerald-300 mb-1 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Respaldo Seguro</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight drop-shadow-sm">Copia de Seguridad & Datos</h2>
            <p className="text-xs text-slate-300">Tus datos se guardan en tu navegador. Puedes respaldarlos o restaurarlos en formato JSON.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 backdrop-blur-md transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/12 backdrop-blur-md transition-all shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar JSON'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/12 backdrop-blur-md transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Archivo</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Pega aquí tu copia JSON para importar o respaldar:
            </label>
            <textarea
              rows={5}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setImportStatus(null);
              }}
              placeholder='{"version": "2.0", "cards": [...]}'
              className="w-full liquid-glass-input rounded-xl p-3 font-mono text-xs text-slate-300 focus:outline-none placeholder-slate-500"
            />
          </div>

          {importStatus === 'success' && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 backdrop-blur-md">
              <Check className="w-4 h-4" />
              <span>¡Datos importados con éxito! Actualizando aplicación...</span>
            </div>
          )}

          {importStatus === 'error' && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 backdrop-blur-md">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>El formato JSON es inválido. Verifica los datos e intenta de nuevo.</span>
            </div>
          )}

          {/* Inline safe confirmation for clean / demo */}
          {confirmClean && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-2">
              <span className="text-rose-200 font-semibold block">¿Seguro que deseas borrar todos los datos y reiniciar en ceros?</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={executeResetClean}
                  className="px-3 py-1 bg-rose-500 text-white font-bold rounded-lg hover:bg-rose-400"
                >
                  Sí, reiniciar en ceros
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClean(false)}
                  className="px-3 py-1 bg-white/[0.05] text-slate-300 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {confirmDemo && (
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs space-y-2">
              <span className="text-blue-200 font-semibold block">¿Cargar datos de ejemplo para probar la aplicación?</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={executeResetDemo}
                  className="px-3 py-1 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-400"
                >
                  Sí, cargar demo
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDemo(false)}
                  className="px-3 py-1 bg-white/[0.05] text-slate-300 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-white/10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmClean(true)}
                title="Borrar todo y dejar en ceros"
                className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar todo (ceros)</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmDemo(true)}
                title="Cargar datos de ejemplo"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Datos demo</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleImport}
              disabled={!jsonText.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 hover:from-emerald-300 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Importar Datos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
