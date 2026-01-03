import { useState, useEffect } from 'react';
import { FiTerminal, FiRefreshCw, FiDownload } from 'react-icons/fi';

export default function VercelLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wa/vercel-logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching Vercel logs:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const downloadLogs = () => {
    const text = logs.map(log => 
      `[${new Date(log.timestamp).toLocaleString()}] ${log.message}`
    ).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vercel-logs-${Date.now()}.txt`;
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

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiTerminal className="text-green-400" size={20} />
          <h3 className="text-white font-semibold">Vercel Function Logs</h3>
          <span className="text-xs text-gray-400">Real-time debugging</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded text-sm ${
              autoRefresh 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={downloadLogs}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
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
            <div key={i} className="mb-1 hover:bg-gray-800 px-2 py-1 rounded">
              <span className="text-gray-500">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={`ml-2 ${getLogColor(log.level)}`}>
                [{log.level?.toUpperCase() || 'LOG'}]
              </span>
              <span className="ml-2 text-gray-300">{log.message}</span>
              {log.details && (
                <pre className="ml-8 mt-1 text-gray-400 text-xs">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Showing last {logs.length} function invocations
      </div>
    </div>
  );
}