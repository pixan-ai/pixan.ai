import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Activity, DollarSign, MessageSquare, Settings } from 'lucide-react';
import BalanceStatus from '../components/WA/BalanceStatus';
import LogsViewer from '../components/WA/LogsViewer';
import SystemPromptEditor from '../components/WA/SystemPromptEditor';

export default function WADashboard() {
  const [stats, setStats] = useState({
    totalMessages: 0,
    activeUsers: 0,
    modelsUsed: 11, // Número fijo de modelos disponibles
  });

  useEffect(() => {
    // Cargar estadísticas
    fetch('/api/wa/stats')
      .then(res => res.json())
      .then(data => setStats(prev => ({ ...prev, ...data })))
      .catch(err => console.error('Error loading stats:', err));
  }, []);

  return (
    <>
      <Head>
        <title>pixan WA - Admin Dashboard</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Logo pixan - placeholder temporal */}
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  P
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">pixan WA</h1>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      WhatsApp
                    </span>
                    <p className="text-sm text-gray-500">Panel de Administración</p>
                  </div>
                </div>
              </div>
              
              {/* Balance Status - Arriba a la derecha */}
              <BalanceStatus />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mensajes Totales</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalMessages}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeUsers}</p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Modelos Disponibles</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.modelsUsed}</p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid - System Prompt y Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* System Prompt Editor */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <SystemPromptEditor />
            </div>

            {/* Logs Viewer */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <LogsViewer />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
