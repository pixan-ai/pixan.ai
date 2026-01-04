/**
 * Logs Viewer Component
 * Real-time conversation logs with expandable cards
 */

import { useState } from 'react';
import { MessageSquare, RefreshCw, Download, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

const LogCard = ({ log, isExpanded, onToggle }) => {
  if (!log?.id) return null;
  
  const time = new Date(log.timestamp).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  return (
    <div className={`bg-white rounded-lg border-l-4 ${log.status === 'error' ? 'border-red-500' : 'border-green-500'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left"
      >
        <div className="flex items-center gap-2">
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
        </div>
        
        <span className="text-xs text-gray-400">
          {isExpanded ? 'Ocultar' : 'Ver'}
        </span>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          <div className="pt-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Usuario:</p>
            <p className="text-sm bg-blue-50 p-2 rounded">{log.message || 'N/A'}</p>
          </div>
          
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Bot:</p>
            <p className="text-sm bg-green-50 p-2 rounded max-h-32 overflow-y-auto">
              {log.response || 'N/A'}
            </p>
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
        <span>💡 Click para ver detalles</span>
        {autoRefresh && <span className="text-green-600">● Actualizando cada 5s</span>}
      </div>
    </div>
  );
}
