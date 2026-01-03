import { useState, useEffect } from 'react';
import { FiTerminal, FiRefreshCw, FiDownload } from 'react-icons/fi';

export default function VercelLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showDetails, setShowDetails] = useState({});

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Obtener los logs conversacionales que tienen info técnica
      const res = await fetch('/api/wa/logs?limit=50');
      const data = await res.json();
      
      // Convertir a formato de debug logs
      const debugLogs = (data.logs || []).map(log => ({
        timestamp: log.timestamp,
        level: log.status === 'error' ? 'error' : 'info',
        message: `${log.from.slice(-4)} → ${log.model}`,
        details: {
          user: log.from,
          message: log.message,
          model: log.model,
          response: log.response,
          status: log.status
        }
      }));
      
      setLogs(debugLogs);
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
      const time = new Date(log.timestamp).toLocaleString();
      const details = JSON.stringify(log.details, null, 2);
      return `[${time}] [${log.level.toUpperCase()}] ${log.message}\n${details}\n`;
    }).join('\n---\n\n');
    
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
          logs.map((log, i) => (
            <div key={i} className="mb-2 border-b border-gray-800 pb-2">
              <div 
                className="hover:bg-gray-800 px-2 py-1 rounded cursor-pointer flex items-center justify-between"
                onClick={() => toggleDetails(i)}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-gray-500 text-xs">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`${getLogColor(log.level)} font-semibold text-xs`}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span className="text-gray-300">{log.message}</span>
                </div>
                <span className="text-gray-600 text-xs">
                  {showDetails[i] ? '▼' : '▶'}
                </span>
              </div>
              
              {showDetails[i] && log.details && (
                <div className="ml-4 mt-2 p-2 bg-gray-950 rounded border border-gray-800">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">User:</span>
                      <span className="ml-2 text-green-400">{log.details.user}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Model:</span>
                      <span className="ml-2 text-purple-400">{log.details.model}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Message:</span>
                      <div className="mt-1 p-2 bg-gray-900 rounded text-cyan-300">
                        {log.details.message}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Response:</span>
                      <div className="mt-1 p-2 bg-gray-900 rounded text-yellow-300 max-h-32 overflow-y-auto">
                        {log.details.response}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className={`ml-2 ${log.details.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {log.details.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
        <span>Showing last {logs.length} webhook executions</span>
        {autoRefresh && <span className="text-green-400">● Auto-refreshing every 5s</span>}
      </div>
    </div>
  );
}