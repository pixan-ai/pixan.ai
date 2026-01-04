import { useState, useEffect } from 'react';
import { DollarSign, Loader2, CheckCircle, AlertCircle, Database } from 'lucide-react';

export default function BalanceStatus() {
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBalances();
    const interval = setInterval(loadBalances, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, []);

  const loadBalances = async () => {
    try {
      const res = await fetch('/api/wa/balances');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setBalances(data);
      setError(null);
    } catch (err) {
      console.error('Error loading balances:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = ({ status }) => {
    if (status === 'ok') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'warning') return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center space-x-2">
        <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
        <span className="text-sm text-gray-600">Cargando balances...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center space-x-2">
        <AlertCircle className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-600">Error al cargar balances</span>
      </div>
    );
  }

  if (!balances) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3">
      <div className="flex items-center space-x-4">
        <DollarSign className="w-5 h-5 text-green-500" />
        
        <div className="flex items-center space-x-4 divide-x divide-gray-200">
          {/* AI Gateway */}
          {balances.aiGateway && (
            <div className="flex items-center space-x-2">
              <StatusIcon status={balances.aiGateway.status || 'error'} />
              <div>
                <p className="text-xs text-gray-500">AI Gateway</p>
                <p className="text-sm font-semibold text-gray-900">
                  ${typeof balances.aiGateway.balance === 'number' 
                    ? balances.aiGateway.balance.toFixed(2) 
                    : '0.00'}
                </p>
              </div>
            </div>
          )}

          {/* Twilio */}
          {balances.twilio && (
            <div className="flex items-center space-x-2 pl-4">
              <StatusIcon status={balances.twilio.status || 'error'} />
              <div>
                <p className="text-xs text-gray-500">Twilio</p>
                <p className="text-sm font-semibold text-gray-900">
                  ${typeof balances.twilio.balance === 'number' 
                    ? balances.twilio.balance.toFixed(2) 
                    : '0.00'}
                </p>
              </div>
            </div>
          )}

          {/* Gemini */}
          {balances.gemini && (
            <div className="flex items-center space-x-2 pl-4">
              <StatusIcon status={balances.gemini.status || 'ok'} />
              <div>
                <p className="text-xs text-gray-500">Gemini</p>
                <p className="text-sm font-semibold text-gray-900">
                  {balances.gemini.quotaUsed || 0}/{balances.gemini.quotaLimit || 1500}
                </p>
              </div>
            </div>
          )}

          {/* Upstash */}
          {balances.upstash && (
            <div className="flex items-center space-x-2 pl-4">
              <StatusIcon status={balances.upstash.status || 'ok'} />
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  Upstash
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {(balances.upstash.commandsUsed || 0).toLocaleString()}/{(balances.upstash.dailyLimit || 10000).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">
                  {balances.upstash.percentUsed || 0}% usado
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
