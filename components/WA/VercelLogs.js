/**
 * Vercel Technical Logs Component
 * Shows detailed webhook execution logs
 */

import { useState, useEffect, useCallback } from 'react';
import { Terminal, RefreshCw, ChevronDown, ChevronRight, Clock } from 'lucide-react';

export default function VercelLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wa/vercel-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching Vercel logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchLogs]);

  const toggleLog = (index) => {
    setExpanded(e => ({ ...e, [index]: !e[index] }));
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const getStatusColor = (message) => {
    if (message?.includes('✅') || message?.includes('success')) return 'text-green-600';
    if (message?.includes('❌') || message?.includes('error')) return 'text-red-600';
    if (message?.includes('⚠️') || message?.includes('warning')) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Logs Técnicos</h2>
            <span className="text-xs text-gray-500">({logs.length})</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2 py-1 text-xs rounded ${autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
            >
              Auto {autoRefresh ? 'ON' : 'OFF'}
            </button>
            
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-1.5 hover:bg-gray-100 rounded"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Terminal className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No hay logs disponibles</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log, index) => (
              <div key={index} className="hover:bg-gray-50">
                <button
                  onClick={() => toggleLog(index)}
                  className="w-full px-4 py-2 flex items-center gap-3 text-left"
                >
                  {expanded[index] ? (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                  
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500 font-mono w-20">
                    {formatTime(log.timestamp)}
                  </span>
                  
                  <span className={`text-sm truncate flex-1 ${getStatusColor(log.message)}`}>
                    {log.message}
                  </span>
                </button>
                
                {expanded[index] && log.details && (
                  <div className="px-4 pb-3 pl-12">
                    <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 flex justify-between">
        <span>🛠️ Ejecución del webhook en tiempo real</span>
        {autoRefresh && <span className="text-green-600">● Actualizando cada 10s</span>}
      </div>
    </div>
  );
}
