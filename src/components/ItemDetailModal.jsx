'use client';

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-medium text-ah-charcoal/50 dark:text-[#7a8eaa] uppercase tracking-wide">{label}</span>
      <span className="text-lg text-ah-charcoal dark:text-[#d0daf0]">{value}</span>
    </div>
  );
}

export default function ItemDetailModal({ piece, onEdit, onDelete, onClose, onUpdateUsage, deleting }) {
  if (!piece) return null;

  const available = Math.max(0, (piece.quantity || 0) - (piece.in_use || 0));
  const total = piece.quantity || 0;
  const usagePercent = total > 0 ? ((piece.in_use || 0) / total) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center modal-backdrop">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 hidden sm:block" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl mx-0 sm:mx-4 my-0 sm:my-8 bg-white dark:bg-[#121e32] rounded-none sm:rounded-3xl shadow-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto modal-content transition-colors duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-[#121e32] border-b border-ah-gray/50 dark:border-[#2a3650] sm:rounded-t-3xl px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-full text-base font-semibold bg-ah-blue/10 dark:bg-ah-blue/20 text-ah-blue dark:text-[#7db0ff] border border-ah-blue/20 dark:border-ah-blue/30">
              {piece.type}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#1a2236] hover:bg-gray-200 dark:hover:bg-[#243048] flex items-center justify-center text-2xl text-ah-charcoal dark:text-[#a0b4d0] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-6 sm:px-8 py-6 space-y-6">
          {/* Photo + Title */}
          <div className="flex flex-col sm:flex-row gap-6">
            {piece.photo_url ? (
              <img
                src={piece.photo_url}
                alt={piece.name}
                className="w-full sm:w-72 h-56 object-cover rounded-2xl border border-ah-gray dark:border-[#2a3650] shadow-md"
              />
            ) : (
              <div className="w-full sm:w-72 h-56 rounded-2xl bg-gray-50 dark:bg-[#0f1a2e] border border-ah-gray dark:border-[#2a3650] flex items-center justify-center text-6xl">
                📦
              </div>
            )}

            <div className="flex-1 flex flex-col justify-center gap-2">
              <h2 className="text-3xl font-bold text-ah-navy dark:text-[#edf3ff] leading-tight">{piece.name}</h2>
              {piece.part_number && (
                <p className="text-xl text-ah-blue dark:text-[#7db0ff] font-semibold">{piece.part_number}</p>
              )}
            </div>
          </div>

          {/* Disponibilidad - Sección prominente */}
          <section className="bg-gray-50 dark:bg-[#1a2236] rounded-xl p-5 border border-ah-gray/50 dark:border-[#2a3650]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-ah-navy dark:text-[#edf3ff]">Disponibilidad</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateUsage(piece, -1)}
                  disabled={piece.in_use <= 0}
                  className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold text-xl flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Liberar uno (reducir en uso)"
                >
                  −
                </button>
                <button
                  onClick={() => onUpdateUsage(piece, 1)}
                  disabled={piece.in_use >= piece.quantity}
                  className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-bold text-xl flex items-center justify-center hover:bg-orange-200 dark:hover:bg-orange-900/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Marcar uno en uso"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-end gap-4 mb-3">
              <div>
                <p className="text-sm font-medium text-ah-charcoal/50 dark:text-[#7a8eaa] uppercase tracking-wide">Disponibles</p>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">{available}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-ah-charcoal/50 dark:text-[#7a8eaa] uppercase tracking-wide">En Uso</p>
                <p className="text-4xl font-bold text-orange-500 dark:text-orange-400">{piece.in_use || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-ah-charcoal/50 dark:text-[#7a8eaa] uppercase tracking-wide">Total</p>
                <p className="text-4xl font-bold text-ah-navy dark:text-[#edf3ff]">{total}</p>
              </div>
            </div>
            {/* Barra visual */}
            <div className="w-full h-3 bg-gray-200 dark:bg-[#0f1a2e] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${usagePercent}%`,
                  background: usagePercent > 80 ? '#ef4444' : usagePercent > 50 ? '#f59e0b' : '#22c55e',
                }}
              />
            </div>
            <p className="text-sm text-ah-charcoal/50 dark:text-[#7a8eaa] mt-1">
              {usagePercent.toFixed(0)}% en uso
            </p>
          </section>

          {/* Description */}
          {piece.description && (
            <div className="bg-gray-50 dark:bg-[#1a2236] rounded-xl p-5 border border-ah-gray/50 dark:border-[#2a3650]">
              <p className="text-lg text-ah-charcoal dark:text-[#d0daf0] leading-relaxed">{piece.description}</p>
            </div>
          )}

          {/* Detalles */}
          {(piece.supplier || piece.location || piece.part_number) && (
            <section>
              <h3 className="text-lg font-bold text-ah-navy dark:text-[#edf3ff] mb-3 pb-2 border-b border-ah-blue/20 dark:border-ah-blue/30">
                Detalles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label="Número de Parte / Modelo" value={piece.part_number} />
                <InfoRow label="Proveedor" value={piece.supplier} />
                <InfoRow label="Ubicación" value={piece.location} />
              </div>
            </section>
          )}

          {/* Notas */}
          {piece.notes && (
            <section>
              <h3 className="text-lg font-bold text-ah-navy dark:text-[#edf3ff] mb-3 pb-2 border-b border-ah-blue/20 dark:border-ah-blue/30">
                Notas
              </h3>
              <p className="text-lg text-ah-charcoal dark:text-[#d0daf0] leading-relaxed whitespace-pre-wrap">{piece.notes}</p>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-[#121e32] border-t border-ah-gray/50 dark:border-[#2a3650] sm:rounded-b-3xl px-4 sm:px-8 py-4 sm:py-5 transition-colors duration-300">
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:justify-between">
            <button
              onClick={() => onDelete(piece)}
              disabled={deleting}
              className="px-6 py-4 text-lg font-semibold rounded-full border-2 border-red-300 dark:border-red-700/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>

            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-6 sm:px-8 py-4 text-lg font-semibold rounded-full border-2 border-ah-gray dark:border-[#3a4e6a] text-ah-charcoal dark:text-[#a0b4d0] hover:bg-gray-50 dark:hover:bg-[#1a2236] transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => onEdit(piece)}
                className="flex-1 sm:flex-none btn-primary px-6 sm:px-10 py-4 text-lg font-semibold rounded-full text-white"
              >
                Editar Artículo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
