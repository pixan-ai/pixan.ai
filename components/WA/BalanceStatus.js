/**
 * Balance Status Component
 * Shows all service balances in header
 */

import { DollarSign, CheckCircle, AlertCircle, Database, Loader2 } from 'lucide-react';

const StatusIcon = ({ status }) => {
  const icons = {
    ok: <CheckCircle className="w-4 h-4 text-green-500" />,
    warning: <AlertCircle className="w-4 h-4 text-yellow-500" />,
    error: <AlertCircle className="w-4 h-4 text-red-500" />
  };
  return icons[status] || icons.error;
};

const BalanceItem = ({ label, value, status, icon: Icon }) => (
  <div className="flex items-center gap-2 px-3 first:pl-0">
    <StatusIcon status={status} />
    <div className="text-center">
      <p className="text-xs text-gray-500 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

const Skeleton = () => (
  <div className="bg-gray-100 rounded-lg px-4 py-3 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-5 h-5 bg-gray-300 rounded" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center gap-2 px-3">
          <div className="w-4 h-4 bg-gray-300 rounded-full" />
          <div>
            <div className="w-12 h-3 bg-gray-300 rounded mb-1" />
            <div className="w-16 h-4 bg-gray-300 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function BalanceStatus({ balances, loading, error }) {
  if (loading) return <Skeleton />;
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-600">Error al cargar balances</span>
      </div>
    );
  }

  if (!balances) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3">
      <div className="flex items-center gap-2 divide-x divide-gray-200">
        <DollarSign className="w-5 h-5 text-green-500" />
        
        {balances.aiGateway && (
          <BalanceItem
            label="AI Gateway"
            value={`$${(balances.aiGateway.balance || 0).toFixed(2)}`}
            status={balances.aiGateway.status}
          />
        )}
        
        {balances.twilio && (
          <BalanceItem
            label="Twilio"
            value={`$${(balances.twilio.balance || 0).toFixed(2)}`}
            status={balances.twilio.status}
          />
        )}
        
        {balances.gemini && (
          <BalanceItem
            label="Gemini"
            value={`${balances.gemini.quotaUsed || 0}/${balances.gemini.quotaLimit || 1500}`}
            status={balances.gemini.status}
          />
        )}
        
        {balances.upstash && (
          <BalanceItem
            label="Upstash"
            value={balances.upstash.message || 'Connected'}
            status={balances.upstash.status}
            icon={Database}
          />
        )}
      </div>
    </div>
  );
}
