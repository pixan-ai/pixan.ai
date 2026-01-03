import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function WADashboard() {
  return (
    <>
      <Head>
        <title>pixan WA - Admin Dashboard</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">pixan WA</h1>
            <p className="text-sm text-gray-500">Panel de Administración - WhatsApp Bot</p>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-gray-700">Dashboard funcionando en pixan.ai/WA 🎉</p>
            <p className="text-sm text-gray-500 mt-2">Próximamente: Stats, Logs, Balances</p>
          </div>
        </main>
      </div>
    </>
  );
}
