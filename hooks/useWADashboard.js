/**
 * Custom Hook - WhatsApp Dashboard State
 * Centralized state management for all dashboard data
 */

import { useState, useEffect, useCallback } from 'react';

const REFRESH_INTERVALS = {
  balances: 60000,  // 1 min
  logs: 5000,       // 5 sec
  stats: 30000      // 30 sec
};

export function useWADashboard() {
  const [balances, setBalances] = useState(null);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ totalMessages: 0, activeUsers: 0 });
  const [loading, setLoading] = useState({ balances: true, logs: true, stats: true });
  const [errors, setErrors] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchBalances = useCallback(async () => {
    try {
      const res = await fetch('/api/wa/balances');
      if (!res.ok) throw new Error('Failed to fetch');
      setBalances(await res.json());
      setErrors(e => ({ ...e, balances: null }));
    } catch (err) {
      setErrors(e => ({ ...e, balances: err.message }));
    } finally {
      setLoading(l => ({ ...l, balances: false }));
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/wa/logs?limit=50');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setLogs(data.logs || []);
      setErrors(e => ({ ...e, logs: null }));
    } catch (err) {
      setErrors(e => ({ ...e, logs: err.message }));
    } finally {
      setLoading(l => ({ ...l, logs: false }));
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/wa/stats');
      if (!res.ok) throw new Error('Failed to fetch');
      setStats(await res.json());
      setErrors(e => ({ ...e, stats: null }));
    } catch (err) {
      setErrors(e => ({ ...e, stats: err.message }));
    } finally {
      setLoading(l => ({ ...l, stats: false }));
    }
  }, []);

  const clearLogs = useCallback(async () => {
    try {
      await fetch('/api/wa/logs', { method: 'DELETE' });
      setLogs([]);
    } catch (err) {
      console.error('Error clearing logs:', err);
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchBalances();
    fetchLogs();
    fetchStats();
  }, [fetchBalances, fetchLogs, fetchStats]);

  // Initial fetch
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Auto-refresh intervals
  useEffect(() => {
    if (!autoRefresh) return;

    const intervals = [
      setInterval(fetchBalances, REFRESH_INTERVALS.balances),
      setInterval(fetchLogs, REFRESH_INTERVALS.logs),
      setInterval(fetchStats, REFRESH_INTERVALS.stats)
    ];

    return () => intervals.forEach(clearInterval);
  }, [autoRefresh, fetchBalances, fetchLogs, fetchStats]);

  return {
    balances,
    logs,
    stats,
    loading,
    errors,
    autoRefresh,
    setAutoRefresh,
    refreshAll,
    fetchLogs,
    clearLogs
  };
}
