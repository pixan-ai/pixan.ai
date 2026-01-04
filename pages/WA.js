/**
 * WhatsApp Dashboard - Admin Panel
 * Clean, responsive dashboard using custom hook
 */

import Head from 'next/head';
import { Activity, MessageSquare, Cpu } from 'lucide-react';
import { useWADashboard } from '../hooks/useWADashboard';
import BalanceStatus from '../components/WA/BalanceStatus';
import LogsViewer from '../components/WA/LogsViewer';
import SystemPromptEditor from '../components/WA/SystemPromptEditor';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

export default function WADashboard() {
  const {
    balances,
    logs,
    stats,
    loading,
    errors,
    autoRefresh,
    setAutoRefresh,
    fetchLogs,
    clearLogs
  } = useWADashboard();

  return (
    <>
      <Head>
        <title>pixan WA - Dashboard</title>
        <meta name="description" content="WhatsApp Bot Admin Dashboard" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                  P
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">pixan WA</h1>
                  <p className="text-xs text-gray-500">Panel de Administración</p>
                </div>
              </div>
              
              <BalanceStatus
                balances={balances}
                loading={loading.balances}
                error={errors.balances}
              />
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              icon={MessageSquare}
              label="Mensajes Totales"
              value={stats.totalMessages}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard
              icon={Activity}
              label="Usuarios Activos"
              value={stats.activeUsers}
              color="bg-green-100 text-green-600"
            />
            <StatCard
              icon={Cpu}
              label="Modelos Disponibles"
              value={11}
              color="bg-purple-100 text-purple-600"
            />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Prompt */}
            <div className="bg-white rounded-lg shadow-sm border">
              <SystemPromptEditor />
            </div>

            {/* Logs */}
            <div className="bg-white rounded-lg shadow-sm border">
              <LogsViewer
                logs={logs}
                loading={loading.logs}
                autoRefresh={autoRefresh}
                onRefresh={fetchLogs}
                onClear={clearLogs}
                onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
              />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center py-4 text-xs text-gray-400">
          pixan.ai • WhatsApp Bot Dashboard
        </footer>
      </div>
    </>
  );
}
