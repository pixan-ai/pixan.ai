import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, RefreshCw, Download, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

export default function LogsViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState({});
  const logsContainerRef = useRef(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wa/logs?limit=50');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Error loading logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, loadLogs]);

  const clearLogs = async () => {
    if (!confirm('¿Seguro que quieres borrar todas las conversaciones?')) return;
    
    try {
      await fetch('/api/wa/logs', { method: 'DELETE' });
      setLogs([]);
      setExpandedLogs({});
    } catch (err) {
      console.error('Error clearing logs:', err);
    }
  };

  const downloadLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pixan-wa-conversations-${new Date().toISOString()}.json`;
    link.click();
  };

  const toggleLog = (logId) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const toggleAll = () => {
    const allExpanded = Object.keys(expandedLogs).length === logs.length && 
                       Object.values(expandedLogs).every(v => v);
    
    if (allExpanded) {
      setExpandedLogs({});
    } else {
      const newExpanded = {};
      logs.forEach(log => {
        newExpanded[log.id] = true;
      });
      setExpandedLogs(newExpanded);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Conversaciones en Tiempo Real</h2>
            <span className="text-xs text-gray-500">({logs.length})</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleAll}
              className="px-3 py-1 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {Object.values(expandedLogs).some(v => v) ? 'Colapsar todas' : 'Expandir todas'}
            </button>
            
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 text-sm rounded-md ${
                autoRefresh 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
            
            <button
              onClick={loadLogs}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={downloadLogs}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={clearLogs}
              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Logs Content - Con scroll y altura fija */}
      <div 
        ref={logsContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50"
        style={{ maxHeight: '500px' }}
      >
        {logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay conversaciones todavía</p>
          </div>
        ) : (
          logs.map((log) => {
            if (!log || !log.id) return null;
            
            const isExpanded = expandedLogs[log.id];
            
            return (
              <div
                key={log.id}
                className={`bg-white rounded-lg border-l-4 ${
                  log.status === 'error' ? 'border-red-500' : 'border-green-500'
                } transition-all duration-200`}
              >
                {/* Header Colapsable */}
                <div 
                  onClick={() => toggleLog(log.id)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-2 flex-1">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{new Date(log.timestamp).toLocaleString('es-MX', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      })}</span>
                      <span>•</span>
                      <span className="font-mono text-gray-600">{log.from ? log.from.slice(-4) : 'N/A'}</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                        {log.model || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    {isExpanded ? 'Ocultar' : 'Ver detalles'}
                  </div>
                </div>
                
                {/* Contenido Expandible */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2 border-t border-gray-100">
                    <div className="pt-2">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Usuario:</p>
                      <p className="text-sm text-gray-800 bg-blue-50 p-2 rounded">{log.message || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Respuesta del Bot:</p>
                      <div className="text-sm text-gray-800 bg-green-50 p-2 rounded max-h-40 overflow-y-auto">
                        {log.response || 'N/A'}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 text-xs text-gray-500">
                      <span>ID: {log.id}</span>
                      <span className={log.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                        {log.status || 'unknown'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Footer con info */}
      <div className="p-3 border-t border-gray-200 bg-white text-xs text-gray-500 flex justify-between items-center">
        <span>💡 Click en cada conversación para ver detalles completos</span>
        {autoRefresh && <span className="text-green-600">● Actualizando cada 5s</span>}
      </div>
    </div>
  );
}