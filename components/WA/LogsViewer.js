/**
 * Logs Viewer Component
 * Real-time conversation logs with expandable cards
 * Updated: Better display for long responses
 */

import { useState } from 'react';
import { MessageSquare, RefreshCw, Download, Trash2, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

const LogCard = ({ log, isExpanded, onToggle }) => {
  const [copied, setCopied] = useState(false);
  
  if (!log?.id) return null;
  
  const time = new Date(log.timestamp).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const copyResponse = async () => {
    await navigator.clipboard.writeText(log.response || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Calculate response length for indicator
  const responseLength = log.response?.length || 0;
  const isLongResponse = responseLength > 500;
  
  return (
    <div className={`bg-white rounded-lg border-l-4 ${log.status === 'error' ? 'border-red-500' : 'border-green-500'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left"
      >
        <div className="flex items-center gap-2 flex-wrap">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          
          <span className="text-xs text-gray-500">{time}</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs font-mono text-gray-600">{log.from?.slice(-4) || 'N/A'}</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
            {log.model || 'N/A'}
          </span>
          {isLongResponse && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
              {Math.ceil(responseLength / 1000)}k chars
            </span>
          )}
          {log.usedKnowledge && (
            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
              📚 KB
            </span>
          )}
        </div>
        
        <span className="text-xs text-gray-400">
          {isExpanded ? 'Ocultar' : 'Ver'}
        </span>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          <div className="pt-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Usuario:</p>
            <p className="text-sm bg-blue-50 p-3 rounded whitespace-pre-wrap">{log.message || 'N/A'}</p>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-gray-500">
                Bot: <span className="text-gray-400">({responseLength} caracteres)</span>
              </p>
              <button
                onClick={copyResponse}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-green-500">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <div className="text-sm bg-green-50 p-3 rounded max-h-96 overflow-y-auto whitespace-pre-wrap">
              {log.response || 'N/A'}
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-400 pt-1">
            <span>ID: {log.id}</span>
            <span className={log.status === 'success' ? 'text-green-600' : 'text-red-600'}>
              {log.status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyState = () => (
  <div className="text-center py-12 text-gray-500">
    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
    <p>No hay conversaciones todavía</p>
  </div>
);

export default function LogsViewer({ logs, loading, autoRefresh, onRefresh, onClear, onToggleAutoRefresh }) {
  const [expanded, setExpanded] = useState({});
  
  const toggleLog = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  
  const toggleAll = () => {
    const allExpanded = logs.length > 0 && logs.every(l => expanded[l.id]);
    setExpanded(allExpanded ? {} : Object.fromEntries(logs.map(l => [l.id, true])));
  };
  
  const downloadLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixan-wa-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Conversaciones</h2>
            <span className="text-xs text-gray-500">({logs.length})</span>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={toggleAll}
              className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              {Object.keys(expanded).length > 0 ? 'Colapsar' : 'Expandir'}
            </button>
            
            <button
              onClick={onToggleAutoRefresh}
              className={`px-2 py-1 text-xs rounded ${autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
            >
              Auto {autoRefresh ? 'ON' : 'OFF'}
            </button>
            
            <button onClick={onRefresh} disabled={loading} className="p-1.5 hover:bg-gray-100 rounded">
              <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button onClick={downloadLogs} className="p-1.5 hover:bg-gray-100 rounded">
              <Download className="w-4 h-4 text-gray-600" />
            </button>
            
            <button onClick={() => confirm('¿Borrar todas las conversaciones?') && onClear()} className="p-1.5 hover:bg-red-50 rounded">
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50" style={{ maxHeight: '450px' }}>
        {logs.length === 0 ? (
          <EmptyState />
        ) : (
          logs.map(log => (
            <LogCard
              key={log.id}
              log={log}
              isExpanded={expanded[log.id]}
              onToggle={() => toggleLog(log.id)}
            />
          ))
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t bg-white text-xs text-gray-500 flex justify-between">
        <span>💡 Click para ver detalles completos</span>
        {autoRefresh && <span className="text-green-600">● Actualizando cada 5s</span>}
      </div>
    </div>
  );
}
