'use client';

import { useState } from 'react';

export default function InventoryTable({ pieces, loading, onPieceClick, onUpdateUsage }) {
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDir('asc');
    }
  };

  const sorted = [...pieces].sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];

    if (sortColumn === 'quantity' || sortColumn === 'available') {
      if (sortColumn === 'available') {
        aVal = (a.quantity || 0) - (a.in_use || 0);
        bVal = (b.quantity || 0) - (b.in_use || 0);
      } else {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }

    aVal = String(aVal || '').toLowerCase();
    bVal = String(bVal || '').toLowerCase();
    const cmp = aVal.localeCompare(bVal, 'es');
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortIcon = ({ column }) => {
    if (sortColumn !== column) {
      return <span className="text-ah-gray dark:text-[#3a4e6a] ml-1">↕</span>;
    }
    return <span className="text-ah-blue dark:text-[#7db0ff] ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-ah-blue/30 border-t-ah-blue rounded-full animate-spin" />
          <p className="text-xl text-ah-charcoal/60 dark:text-[#a0b4d0]">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  if (pieces.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-2xl font-semibold text-ah-navy dark:text-[#edf3ff] mb-2">No hay artículos registrados</p>
          <p className="text-lg text-ah-charcoal/50 dark:text-[#a0b4d0]">
            Presione &quot;Agregar Artículo&quot; para comenzar
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: Card Layout */}
      <div className="sm:hidden space-y-3">
        {/* Mobile sort controls */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { col: 'name', label: 'Nombre' },
            { col: 'type', label: 'Tipo' },
            { col: 'quantity', label: 'Cantidad' },
            { col: 'available', label: 'Disponible' },
          ].map(({ col, label }) => (
            <button
              key={col}
              onClick={() => handleSort(col)}
              className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${
                sortColumn === col
                  ? 'bg-ah-blue/10 dark:bg-ah-blue/20 border-ah-blue/30 dark:border-ah-blue/40 text-ah-blue dark:text-[#7db0ff]'
                  : 'bg-white dark:bg-[#1a2236] border-ah-gray/50 dark:border-[#2a3650] text-ah-charcoal/60 dark:text-[#a0b4d0]'
              }`}
            >
              {label}
              <SortIcon column={col} />
            </button>
          ))}
        </div>

        {/* Cards */}
        {sorted.map((piece) => {
          const avail = Math.max(0, (piece.quantity || 0) - (piece.in_use || 0));
          const total = piece.quantity || 0;
          return (
            <div
              key={piece.id}
              onClick={() => onPieceClick(piece)}
              className="bg-white dark:bg-[#1a2236] rounded-2xl border border-ah-gray/50 dark:border-[#2a3650] shadow-sm p-4 active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="flex gap-4">
                {/* Photo */}
                {piece.photo_url ? (
                  <img
                    src={piece.photo_url}
                    alt={piece.name}
                    className="w-20 h-20 object-cover rounded-xl border border-ah-gray/50 dark:border-[#2a3650] flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-[#0f1a2e] border border-ah-gray/50 dark:border-[#2a3650] flex items-center justify-center text-3xl flex-shrink-0">
                    📦
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-ah-navy dark:text-[#edf3ff] truncate">{piece.name}</p>
                      <p className="text-sm text-ah-charcoal/60 dark:text-[#a0b4d0]">{piece.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`text-sm font-semibold ${avail > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                      {avail}/{total} disponibles
                    </span>
                    {piece.supplier && (
                      <span className="text-sm text-ah-charcoal/50 dark:text-[#7a8eaa]">{piece.supplier}</span>
                    )}
                    {piece.location && (
                      <span className="text-sm text-ah-charcoal/50 dark:text-[#7a8eaa]">{piece.location}</span>
                    )}
                  </div>
                  {/* Quick usage buttons */}
                  <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onUpdateUsage(piece, -1)}
                      disabled={piece.in_use <= 0}
                      className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold text-base flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Liberar uno"
                    >
                      −
                    </button>
                    <span className="text-sm font-medium text-ah-charcoal dark:text-[#d0daf0] min-w-[60px] text-center">
                      {piece.in_use || 0} en uso
                    </span>
                    <button
                      onClick={() => onUpdateUsage(piece, 1)}
                      disabled={piece.in_use >= piece.quantity}
                      className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-bold text-base flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Marcar en uso"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: Table Layout */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl border border-ah-gray/50 dark:border-[#2a3650] shadow-sm transition-colors duration-300">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-ah-navy dark:bg-[#0f1a2e] text-white">
              <th className="px-4 py-4 text-base font-semibold rounded-tl-2xl whitespace-nowrap">
                Foto
              </th>
              <th className="px-4 py-4 text-base font-semibold whitespace-nowrap">
                <button onClick={() => handleSort('name')} className="flex items-center hover:text-ah-gray transition-colors">
                  Nombre <SortIcon column="name" />
                </button>
              </th>
              <th className="px-4 py-4 text-base font-semibold whitespace-nowrap hidden md:table-cell">
                <button onClick={() => handleSort('type')} className="flex items-center hover:text-ah-gray transition-colors">
                  Tipo <SortIcon column="type" />
                </button>
              </th>
              <th className="px-4 py-4 text-base font-semibold whitespace-nowrap">
                <button onClick={() => handleSort('quantity')} className="flex items-center hover:text-ah-gray transition-colors">
                  Cantidad <SortIcon column="quantity" />
                </button>
              </th>
              <th className="px-4 py-4 text-base font-semibold whitespace-nowrap">
                <button onClick={() => handleSort('available')} className="flex items-center hover:text-ah-gray transition-colors">
                  Disponible <SortIcon column="available" />
                </button>
              </th>
              <th className="px-4 py-4 text-base font-semibold whitespace-nowrap hidden lg:table-cell">
                <button onClick={() => handleSort('supplier')} className="flex items-center hover:text-ah-gray transition-colors">
                  Proveedor <SortIcon column="supplier" />
                </button>
              </th>
              <th className="px-4 py-4 text-base font-semibold whitespace-nowrap hidden xl:table-cell">
                Ubicación
              </th>
              <th className="px-4 py-4 text-base font-semibold rounded-tr-2xl whitespace-nowrap text-center">
                Uso
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((piece, idx) => {
              const avail = Math.max(0, (piece.quantity || 0) - (piece.in_use || 0));
              const total = piece.quantity || 0;
              return (
                <tr
                  key={piece.id}
                  onClick={() => onPieceClick(piece)}
                  className={`table-row-hover cursor-pointer border-b border-ah-gray/30 dark:border-[#2a3650]/60 ${
                    idx % 2 === 0
                      ? 'bg-white dark:bg-[#1a2236]'
                      : 'bg-gray-50/50 dark:bg-[#162030]'
                  }`}
                >
                  <td className="px-4 py-3">
                    {piece.photo_url ? (
                      <img
                        src={piece.photo_url}
                        alt={piece.name}
                        className="w-14 h-14 object-cover rounded-lg border border-ah-gray/50 dark:border-[#2a3650]"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-[#0f1a2e] border border-ah-gray/50 dark:border-[#2a3650] flex items-center justify-center text-2xl">
                        📦
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-lg font-semibold text-ah-navy dark:text-[#edf3ff]">{piece.name}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-base text-ah-charcoal/70 dark:text-[#a0b4d0]">{piece.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-lg font-medium text-ah-navy dark:text-[#edf3ff]">{total}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-lg font-semibold ${avail > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                      {avail}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-base text-ah-charcoal/70 dark:text-[#a0b4d0]">{piece.supplier || '—'}</span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-base text-ah-charcoal/70 dark:text-[#a0b4d0]">{piece.location || '—'}</span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onUpdateUsage(piece, -1)}
                        disabled={piece.in_use <= 0}
                        className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold text-base flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Liberar uno"
                      >
                        −
                      </button>
                      <span className="text-sm font-medium text-ah-charcoal dark:text-[#d0daf0] min-w-[24px] text-center">
                        {piece.in_use || 0}
                      </span>
                      <button
                        onClick={() => onUpdateUsage(piece, 1)}
                        disabled={piece.in_use >= piece.quantity}
                        className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-bold text-base flex items-center justify-center hover:bg-orange-200 dark:hover:bg-orange-900/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Marcar en uso"
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
