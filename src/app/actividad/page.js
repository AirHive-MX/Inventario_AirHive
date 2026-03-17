'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';

const ACTION_CONFIG = {
  creado: { icon: '➕', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Creado' },
  editado: { icon: '✏️', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Editado' },
  eliminado: { icon: '🗑️', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Eliminado' },
  uso_actualizado: { icon: '🔄', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', label: 'Uso actualizado' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Hace un momento';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHrs < 24) return `Hace ${diffHrs}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return formatDate(dateStr);
}

export default function ActividadPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const fetchLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from('inventario_airhive_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('Error fetching logs:', error);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !search ||
      (log.item_name && log.item_name.toLowerCase().includes(search.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase()));

    const matchesAction = !filterAction || log.action === filterAction;

    return matchesSearch && matchesAction;
  });

  // Group logs by date
  const groupedLogs = {};
  filteredLogs.forEach((log) => {
    const dateKey = new Date(log.created_at).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groupedLogs[dateKey]) groupedLogs[dateKey] = [];
    groupedLogs[dateKey].push(log);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50/80 dark:from-[#0d1424] dark:to-[#0b1020] transition-colors duration-300">
      <Header />

      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Title */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-4xl font-bold text-ah-navy dark:text-[#edf3ff]">
            Historial de Actividad
          </h2>
          <p className="text-base text-ah-charcoal/50 dark:text-[#a0b4d0] mt-1">
            Registro de todos los movimientos del inventario
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-ah-charcoal/40 dark:text-[#a0b4d0]/60">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en actividad..."
              className="w-full h-14 pl-12 pr-4 text-lg rounded-full border-2 border-ah-gray dark:border-[#2a3650] bg-white dark:bg-[#1a2236] text-ah-charcoal dark:text-[#edf3ff] placeholder-gray-400 dark:placeholder-[#5a6e8a] transition-colors duration-300"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-ah-charcoal/40 dark:text-[#a0b4d0] hover:text-ah-charcoal dark:hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="h-14 px-4 text-base rounded-full border-2 border-ah-gray dark:border-[#2a3650] bg-white dark:bg-[#1a2236] text-ah-charcoal dark:text-[#edf3ff] sm:min-w-[200px] transition-colors duration-300"
          >
            <option value="">Todas las acciones</option>
            <option value="creado">Creados</option>
            <option value="editado">Editados</option>
            <option value="eliminado">Eliminados</option>
            <option value="uso_actualizado">Uso actualizado</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
          {Object.entries(ACTION_CONFIG).map(([key, config]) => {
            const count = logs.filter((l) => l.action === key).length;
            return (
              <button
                key={key}
                onClick={() => setFilterAction(filterAction === key ? '' : key)}
                className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 border shadow-sm transition-all cursor-pointer ${
                  filterAction === key
                    ? 'border-ah-blue dark:border-ah-blue/50 ring-2 ring-ah-blue/20'
                    : 'border-ah-gray/50 dark:border-[#2a3650]'
                } bg-white dark:bg-[#1a2236]`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-xs sm:text-sm font-medium text-ah-charcoal/50 dark:text-[#a0b4d0] uppercase tracking-wide">{config.label}</span>
                </div>
                <p className={`text-2xl sm:text-3xl font-bold ${config.color}`}>{count}</p>
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-ah-blue/30 border-t-ah-blue rounded-full animate-spin" />
              <p className="text-xl text-ah-charcoal/60 dark:text-[#a0b4d0]">Cargando actividad...</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredLogs.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-2xl font-semibold text-ah-navy dark:text-[#edf3ff] mb-2">No hay actividad registrada</p>
              <p className="text-lg text-ah-charcoal/50 dark:text-[#a0b4d0]">
                Los movimientos del inventario aparecerán aquí
              </p>
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        {!loading && Object.entries(groupedLogs).map(([dateKey, dayLogs]) => (
          <div key={dateKey} className="mb-8">
            <h3 className="text-lg font-bold text-ah-navy dark:text-[#edf3ff] mb-3 pb-2 border-b border-ah-gray/30 dark:border-[#2a3650]">
              {dateKey}
            </h3>
            <div className="space-y-3">
              {dayLogs.map((log) => {
                const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.editado;
                return (
                  <div
                    key={log.id}
                    className="bg-white dark:bg-[#1a2236] rounded-xl border border-ah-gray/50 dark:border-[#2a3650] p-4 shadow-sm transition-colors duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center text-lg flex-shrink-0 mt-0.5`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-semibold ${config.color} uppercase tracking-wide`}>
                            {config.label}
                          </span>
                          <span className="text-sm text-ah-charcoal/40 dark:text-[#5a6e8a]">
                            {formatRelativeTime(log.created_at)}
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-ah-navy dark:text-[#edf3ff] mt-0.5">
                          {log.item_name}
                        </p>
                        {log.details && (
                          <p className="text-base text-ah-charcoal/70 dark:text-[#a0b4d0] mt-1 leading-relaxed">
                            {log.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
