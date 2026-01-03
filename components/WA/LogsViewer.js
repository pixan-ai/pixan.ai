import { useState, useEffect, useRef } from 'react';
import { ScrollText, RefreshCw, Download, Trash2 } from 'lucide-react';

export default function LogsViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const logsEndRef = useRef(null);

  useEffect(() => {
    loadLogs();
    
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 5000); // Actualizar cada 5 segundos
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  useEffect(() => {
    // Auto-scroll al final cuando hay nuevos logs
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const loadLogs = async () => {
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
  };

  const clearLogs = async () => {
    if (!confirm('¿Seguro que quieres borrar todos los logs?')) return;
    
    try {
      await fetch('/api/wa/logs', { method: 'DELETE' });
      setLogs([]);
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
    link.download = `pixan-wa-logs-${new Date().toISOString()}.json`;
    link.click();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ScrollText className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Logs en Tiempo Real</h2>
          </div>
          
          <div className="flex items-center space-x-2">
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
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
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

      {/* Logs Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ScrollText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay logs todavía</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`bg-white rounded-lg p-3 border-l-4 ${
                log.status === 'error' ? 'border-red-500' : 'border-green-500'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                    <span>•</span>
                    <span className="font-mono">{log.from}</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                      {log.model}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-gray-600">Usuario:</p>
                  <p className="text-sm text-gray-800">{log.message}</p>
                </div>
                
                <div>
                  <p className="text-xs font-semibold text-gray-600">Respuesta:</p>
                  <p className="text-sm text-gray-800">{log.response}</p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
