import { useState, useEffect } from 'react';
import { FileText, Save, RotateCcw, Check, ChevronDown, ChevronRight, Edit3 } from 'lucide-react';

export default function SystemPromptEditor() {
  const [prompt, setPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadPrompt();
  }, []);

  const loadPrompt = async () => {
    try {
      const res = await fetch('/api/wa/system-prompt');
      const data = await res.json();
      setPrompt(data.prompt || '');
      setOriginalPrompt(data.prompt || '');
    } catch (err) {
      console.error('Error loading prompt:', err);
    }
  };

  const savePrompt = async () => {
    setSaving(true);
    setSaved(false);
    
    try {
      await fetch('/api/wa/system-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      setOriginalPrompt(prompt);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving prompt:', err);
      alert('Error al guardar el system prompt');
    } finally {
      setSaving(false);
    }
  };

  const resetPrompt = () => {
    if (confirm('¿Seguro que quieres resetear los cambios?')) {
      setPrompt(originalPrompt);
    }
  };

  const hasChanges = prompt !== originalPrompt;

  // Versión comprimida (preview)
  const getPreviewText = () => {
    if (!prompt) return 'Sin instrucciones configuradas';
    const lines = prompt.split('\n').filter(l => l.trim());
    if (lines.length === 0) return 'Sin instrucciones configuradas';
    const firstLine = lines[0].substring(0, 80);
    return firstLine + (firstLine.length >= 80 || lines.length > 1 ? '...' : '');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Clickeable para expandir/colapsar */}
      <div 
        className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
            <FileText className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">System Prompt</h2>
          </div>
          
          {!isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center space-x-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
          )}
        </div>
        
        {/* Preview cuando está colapsado */}
        {!isExpanded && (
          <div className="mt-2 ml-7">
            <p className="text-sm text-gray-500 italic truncate">
              {getPreviewText()}
            </p>
          </div>
        )}
      </div>

      {/* Editor - Solo visible cuando está expandido */}
      {isExpanded && (
        <>
          {/* Botones de acción */}
          <div className="px-4 pt-3 flex justify-end space-x-2">
            {hasChanges && (
              <button
                onClick={resetPrompt}
                className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resetear</span>
              </button>
            )}
            
            <button
              onClick={savePrompt}
              disabled={saving || !hasChanges}
              className={`px-3 py-1.5 text-sm text-white rounded-md flex items-center space-x-1 ${
                saved 
                  ? 'bg-green-600' 
                  : hasChanges 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardado</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Guardando...' : 'Guardar'}</span>
                </>
              )}
            </button>
          </div>

          {/* Editor de texto */}
          <div className="flex-1 p-4 pt-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Escribe aquí las instrucciones para el bot sobre cómo responder en WhatsApp...

Ejemplo:
Eres un asistente útil y amigable de pixan. Respondes de forma concisa y profesional. Siempre saludas con entusiasmo y ayudas a los usuarios con sus preguntas."
              className="w-full h-64 p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {/* Footer Info */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              💡 <strong>Tip:</strong> Este prompt se usa como instrucción base para todos los modelos de IA en cada conversación de WhatsApp. 
              Los cambios aplican inmediatamente a nuevos mensajes.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
