import { useState, useEffect } from 'react';
import { FiTerminal, FiRefreshCw, FiDownload, FiChevronDown, FiChevronRight } from 'react-icons/fi';

export default function VercelLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showDetails, setShowDetails] = useState({});

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wa/logs?limit=50');
      const data = await res.json();
      
      // Convertir a formato de logs técnicos estilo Vercel
      const technicalLogs = [];
      
      (data.logs || []).forEach(log => {
        const timestamp = new Date(log.timestamp);
        const timeStr = timestamp.toLocaleTimeString('es-MX', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3
        });
        
        // Log de recepción
        technicalLogs.push({
          timestamp: log.timestamp,
          time: timeStr,
          level: 'info',
          icon: '📥',
          message: 'Webhook received: POST'
        });
        
        // Log de usuario
        technicalLogs.push({
          timestamp: log.timestamp,
          time: timeStr,
          level: 'info',
          icon: '📱',
          message: `From: ${log.from}`
        });
        
        // Log de mensaje
        technicalLogs.push({
          timestamp: log.timestamp,
          time: timeStr,
          level: 'info',
          icon: '💬',
          message: `Message: ${log.message}`,
          details: {
            fullMessage: log.message,
            user: log.from
          }
        });
        
        // Log de modelo
        technicalLogs.push({
          timestamp: log.timestamp,
          time: timeStr,
          level: 'info',
          icon: '🎯',
          message: `Model: ${log.model}`
        });
        
        // Log de historial (simulado - podríamos obtenerlo del Redis)
        technicalLogs.push({
          timestamp: log.timestamp,
          time: timeStr,
          level: 'info',
          icon: '📚',
          message: 'History: 20 messages' // Esto podría ser dinámico
        });
        
        // Log de llamada a AI
        technicalLogs.push({
          timestamp: log.timestamp,
          time: timeStr,
          level: 'info',
          icon: '🤖',
          message: 'Calling AI...',
          details: {
            model: log.model,
            provider: log.model.includes('gemini') ? 'google-direct' : 'ai-gateway'
          }
        });
        
        technicalLogs.push({
          timestamp: log.timestamp,
          time: timeStr,
          level: 'info',
          icon: '🤖',
          message: `Using model: ${log.model} (${log.model.includes('gemini') ? 'google-direct' : 'ai-gateway'})`
        });
        
        // Log de respuesta
        const responsePreview = log.response.substring(0, 50) + (log.response.length > 50 ? '...' : '');
        technicalLogs.push({
          timestamp: log.timestamp,
          time: timeStr,
          level: log.status === 'error' ? 'error' : 'info',
          icon: log.status === 'error' ? '❌' : '✅',
          message: `Response received: ${responsePreview}`,
          details: {
            fullResponse: log.response,
            status: log.status,
            model: log.model,
            user: log.from,
            message: log.message
          }
        });
        
        // Log de guardado
        technicalLogs.push({
          timestamp: log.timestamp,
          time: timeStr,
          level: 'info',
          icon: '📊',
          message: 'Log saved'
        });
        
        // Log final
        technicalLogs.push({
          timestamp: log.timestamp,
          time: timeStr,
          level: log.status === 'error' ? 'error' : 'info',
          icon: log.status === 'error' ? '❌' : '✅',
          message: log.status === 'error' ? `Error: ${log.response}` : 'Done!'
        });
        
        // Separador entre conversaciones
        technicalLogs.push({
          timestamp: log.timestamp,
          time: timeStr,
          level: 'separator',
          message: '---'
        });
      });
      
      setLogs(technicalLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const downloadLogs = () => {
    const text = logs.map(log => {
      if (log.level === 'separator') return '\n---\n';
      const dateStr = new Date(log.timestamp).toISOString();
      const detailsStr = log.details ? '\n' + JSON.stringify(log.details, null, 2) : '';
      return `${dateStr.split('T')[0]} ${log.time} [${log.level}] ${log.icon} ${log.message}${detailsStr}`;
    }).join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webhook-logs-${Date.now()}.txt`;
    a.click();
  };

  const getLogColor = (level) => {
    switch(level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      case 'separator': return 'text-gray-600';
      default: return 'text-gray-300';
    }
  };

  const toggleDetails = (index) => {
    setShowDetails(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiTerminal className="text-green-400" size={20} />
          <h3 className="text-white font-semibold">Technical Debug Logs</h3>
          <span className="text-xs text-gray-400">Webhook execution details</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              autoRefresh 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white disabled:opacity-50 transition-colors"
            title="Refresh logs"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={downloadLogs}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
            title="Download logs"
          >
            <FiDownload />
          </button>
        </div>
      </div>

      <div className="bg-black rounded p-4 h-96 overflow-y-auto font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No logs available. Send a WhatsApp message to generate logs.
          </div>
        ) : (
          logs.map((log, i) => {
            if (log.level === 'separator') {
              return <div key={i} className="my-3 border-t border-gray-800"></div>;
            }
            
            const hasDetails = log.details && Object.keys(log.details).length > 0;
            
            return (
              <div key={i} className="mb-1">
                <div 
                  className={`hover:bg-gray-800 px-2 py-1 rounded flex items-center gap-2 ${
                    hasDetails ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => hasDetails && toggleDetails(i)}
                >
                  <span className="text-gray-500 text-xs" style={{ minWidth: '80px' }}>
                    {log.time}
                  </span>
                  <span className={`${getLogColor(log.level)} font-semibold text-xs`} style={{ minWidth: '50px' }}>
                    [{log.level}]
                  </span>
                  <span className="text-xs">{log.icon}</span>
                  <span className="text-gray-300 flex-1">{log.message}</span>
                  {hasDetails && (
                    <span className="text-gray-600 text-xs">
                      {showDetails[i] ? <FiChevronDown /> : <FiChevronRight />}
                    </span>
                  )}
                </div>
                
                {hasDetails && showDetails[i] && (
                  <div className="ml-24 mt-1 p-2 bg-gray-950 rounded border border-gray-800">
                    <div className="text-xs space-y-1">
                      {Object.entries(log.details).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-gray-500">{key}:</span>
                          <div className="mt-0.5 p-1 bg-gray-900 rounded text-cyan-300 whitespace-pre-wrap break-words">
                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
        <span>Showing {logs.filter(l => l.level !== 'separator').length} log entries</span>
        {autoRefresh && <span className="text-green-400">● Auto-refreshing every 5s</span>}
      </div>
    </div>
  );
}