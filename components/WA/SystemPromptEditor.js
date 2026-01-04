/**
 * System Prompt Editor Component
 * Collapsible editor for bot instructions
 */

import { useState, useEffect } from 'react';
import { FileText, Save, RotateCcw, Check, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

export default function SystemPromptEditor() {
  const [prompt, setPrompt] = useState('');
  const [original, setOriginal] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/wa/system-prompt')
      .then(res => res.json())
      .then(data => {
        setPrompt(data.prompt || '');
        setOriginal(data.prompt || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/wa/system-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      setOriginal(prompt);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    if (confirm('¿Descartar cambios?')) setPrompt(original);
  };

  const hasChanges = prompt !== original;
  const preview = prompt?.split('\n')[0]?.substring(0, 60) || 'Sin configurar';

  if (loading) {
    return (
      <div className="p-4 flex items-center gap-2 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Cargando...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          <FileText className="w-5 h-5 text-gray-700" />
          <span className="font-semibold text-gray-900">System Prompt</span>
          {hasChanges && <span className="text-xs text-orange-500">*</span>}
        </div>
        
        {!expanded && (
          <span className="text-sm text-gray-500 truncate max-w-xs">{preview}...</span>
        )}
      </button>

      {/* Editor */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Instrucciones para el bot..."
            className="w-full h-48 p-3 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              💡 Cambios aplican inmediatamente a nuevos mensajes
            </p>
            
            <div className="flex gap-2">
              {hasChanges && (
                <button onClick={reset} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Descartar
                </button>
              )}
              
              <button
                onClick={save}
                disabled={!hasChanges || saving}
                className={`px-3 py-1.5 text-sm text-white rounded flex items-center gap-1 ${
                  saved ? 'bg-green-600' : hasChanges ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300'
                }`}
              >
                {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
