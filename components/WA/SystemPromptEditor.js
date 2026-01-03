import { useState, useEffect } from 'react';
import { FileText, Save, RotateCcw, Check } from 'lucide-react';

export default function SystemPromptEditor() {
  const [prompt, setPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">System Prompt</h2>
          </div>
          
          <div className="flex items-center space-x-2">
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
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Escribe aquí las instrucciones para Claude sobre cómo responder en WhatsApp...

Ejemplo:
Eres un asistente útil y amigable de pixan. Respondes de forma concisa y profesional. Siempre saludas con entusiasmo y ayudas a los usuarios con sus preguntas."
          className="w-full h-full p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
        />
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          💡 <strong>Tip:</strong> Este prompt se usará como instrucción base para todos los modelos de IA. 
          Sé específico sobre el tono, estilo y comportamiento que deseas.
        </p>
      </div>
    </div>
  );
}
