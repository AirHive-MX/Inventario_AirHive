'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import InventoryTable from '@/components/InventoryTable';
import ItemModal from '@/components/ItemModal';
import ItemDetailModal from '@/components/ItemDetailModal';
import Popup from '@/components/Popup';

export default function Home() {
  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Popup states
  const [popup, setPopup] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showPopup = (message, type = 'success') => {
    setPopup({ message, type });
  };

  // Log activity
  const logActivity = async (itemId, itemName, action, details) => {
    await supabase.from('inventario_airhive_activity_log').insert([{
      item_id: itemId,
      item_name: itemName,
      action,
      details,
    }]);
  };

  // Fetch all items
  const fetchPieces = useCallback(async () => {
    const { data, error } = await supabase
      .from('inventario_airhive_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showPopup('Error al cargar el inventario', 'error');
      console.error(error);
    } else {
      setPieces(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPieces();
  }, [fetchPieces]);

  // Upload photo to Supabase Storage
  const uploadPhoto = async (blob, name) => {
    const fileName = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from('inventario-airhive-photos')
      .upload(fileName, blob, { contentType: 'image/jpeg' });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('inventario-airhive-photos')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  // Add or update item
  const handleSave = async (formData, photoBlob) => {
    setSaving(true);

    try {
      let photoUrl = selectedPiece?.photo_url || null;

      if (photoBlob) {
        const url = await uploadPhoto(photoBlob, formData.name);
        if (url) photoUrl = url;
      }

      const itemData = {
        ...formData,
        photo_url: photoUrl,
      };

      if (selectedPiece) {
        const { error } = await supabase
          .from('inventario_airhive_items')
          .update(itemData)
          .eq('id', selectedPiece.id);

        if (error) throw error;

        // Build change details
        const changes = [];
        if (selectedPiece.name !== itemData.name) changes.push(`Nombre: "${selectedPiece.name}" → "${itemData.name}"`);
        if (selectedPiece.type !== itemData.type) changes.push(`Tipo: "${selectedPiece.type}" → "${itemData.type}"`);
        if (selectedPiece.quantity !== itemData.quantity) changes.push(`Cantidad: ${selectedPiece.quantity} → ${itemData.quantity}`);
        if (selectedPiece.in_use !== itemData.in_use) changes.push(`En uso: ${selectedPiece.in_use} → ${itemData.in_use}`);
        if (selectedPiece.location !== itemData.location) changes.push(`Ubicación: "${selectedPiece.location || ''}" → "${itemData.location || ''}"`);
        if (selectedPiece.supplier !== itemData.supplier) changes.push(`Proveedor: "${selectedPiece.supplier || ''}" → "${itemData.supplier || ''}"`);
        if (selectedPiece.part_number !== itemData.part_number) changes.push(`Número de parte: "${selectedPiece.part_number || ''}" → "${itemData.part_number || ''}"`);
        if (photoBlob) changes.push('Foto actualizada');

        await logActivity(
          selectedPiece.id,
          itemData.name || selectedPiece.name,
          'editado',
          changes.length > 0 ? changes.join('; ') : 'Artículo editado'
        );

        showPopup('Artículo actualizado correctamente', 'success');
      } else {
        const { data: inserted, error } = await supabase
          .from('inventario_airhive_items')
          .insert([itemData])
          .select();

        if (error) throw error;

        if (inserted && inserted[0]) {
          await logActivity(
            inserted[0].id,
            itemData.name,
            'creado',
            `Artículo creado: ${itemData.name} (${itemData.type}) — Cantidad: ${itemData.quantity || 0}`
          );
        }

        showPopup('Artículo agregado correctamente', 'success');
      }

      setShowForm(false);
      setSelectedPiece(null);
      await fetchPieces();
    } catch (error) {
      console.error('Save error:', error);
      showPopup('Error al guardar el artículo', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Update usage (+/- buttons)
  const handleUpdateUsage = async (piece, delta) => {
    const newInUse = Math.max(0, Math.min(piece.quantity, (piece.in_use || 0) + delta));
    if (newInUse === piece.in_use) return;

    const { error } = await supabase
      .from('inventario_airhive_items')
      .update({ in_use: newInUse })
      .eq('id', piece.id);

    if (error) {
      showPopup('Error al actualizar uso', 'error');
      return;
    }

    const action = delta > 0 ? 'en uso' : 'liberado';
    await logActivity(
      piece.id,
      piece.name,
      'uso_actualizado',
      `${piece.name}: ${piece.in_use || 0} → ${newInUse} en uso (${delta > 0 ? '+1 marcado en uso' : '1 liberado'})`
    );

    await fetchPieces();

    // Refresh selectedPiece if detail modal is open
    if (showDetail && selectedPiece?.id === piece.id) {
      setSelectedPiece((prev) => prev ? { ...prev, in_use: newInUse } : prev);
    }
  };

  // Request delete confirmation via popup
  const handleDelete = (piece) => {
    setConfirmDelete(piece);
  };

  // Actually delete after confirmation
  const executeDelete = async () => {
    const piece = confirmDelete;
    setConfirmDelete(null);
    setDeleting(true);

    try {
      if (piece.photo_url) {
        const path = piece.photo_url.split('/inventario-airhive-photos/')[1];
        if (path) {
          await supabase.storage.from('inventario-airhive-photos').remove([path]);
        }
      }

      await logActivity(
        piece.id,
        piece.name,
        'eliminado',
        `Artículo eliminado: ${piece.name} (${piece.type}) — Tenía ${piece.quantity || 0} unidades`
      );

      const { error } = await supabase
        .from('inventario_airhive_items')
        .delete()
        .eq('id', piece.id);

      if (error) throw error;

      showPopup('Artículo eliminado correctamente', 'success');
      setShowDetail(false);
      setSelectedPiece(null);
      await fetchPieces();
    } catch (error) {
      console.error('Delete error:', error);
      showPopup('Error al eliminar el artículo', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handlePieceClick = (piece) => {
    setSelectedPiece(piece);
    setShowDetail(true);
  };

  const handleEditFromDetail = (piece) => {
    setShowDetail(false);
    setSelectedPiece(piece);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setSelectedPiece(null);
    setShowForm(true);
  };

  const filteredPieces = pieces.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.type && p.type.toLowerCase().includes(search.toLowerCase())) ||
      (p.location && p.location.toLowerCase().includes(search.toLowerCase())) ||
      (p.part_number && p.part_number.toLowerCase().includes(search.toLowerCase())) ||
      (p.supplier && p.supplier.toLowerCase().includes(search.toLowerCase()));

    const matchesType = !filterType || p.type === filterType;

    return matchesSearch && matchesType;
  });

  const uniqueTypes = [...new Set(pieces.map((p) => p.type).filter(Boolean))].sort();

  const totalUnits = pieces.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const totalInUse = pieces.reduce((sum, p) => sum + (p.in_use || 0), 0);
  const totalAvailable = totalUnits - totalInUse;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50/80 dark:from-[#0d1424] dark:to-[#0b1020] transition-colors duration-300">
      <Header />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="bg-white dark:bg-[#1a2236] rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-ah-gray/50 dark:border-[#2a3650] shadow-sm transition-colors duration-300">
            <p className="text-xs sm:text-sm font-medium text-ah-charcoal/50 dark:text-[#a0b4d0] uppercase tracking-wide">Artículos</p>
            <p className="text-2xl sm:text-4xl font-bold text-ah-navy dark:text-[#edf3ff] mt-1">{pieces.length}</p>
          </div>
          <div className="bg-white dark:bg-[#1a2236] rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-ah-gray/50 dark:border-[#2a3650] shadow-sm transition-colors duration-300">
            <p className="text-xs sm:text-sm font-medium text-ah-charcoal/50 dark:text-[#a0b4d0] uppercase tracking-wide">Unidades</p>
            <p className="text-2xl sm:text-4xl font-bold text-ah-navy dark:text-[#edf3ff] mt-1">{totalUnits}</p>
          </div>
          <div className="bg-white dark:bg-[#1a2236] rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-green-100 dark:border-green-900/40 shadow-sm transition-colors duration-300">
            <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Disponibles</p>
            <p className="text-2xl sm:text-4xl font-bold text-green-700 dark:text-green-300 mt-1">{totalAvailable}</p>
          </div>
          <div className="bg-white dark:bg-[#1a2236] rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-orange-100 dark:border-orange-900/40 shadow-sm transition-colors duration-300">
            <p className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">En Uso</p>
            <p className="text-2xl sm:text-4xl font-bold text-orange-700 dark:text-orange-300 mt-1">{totalInUse}</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button
            onClick={handleAddNew}
            className="btn-primary w-full sm:w-auto px-8 py-4 text-xl font-semibold rounded-full text-white flex items-center justify-center gap-3"
          >
            <span className="text-2xl">+</span>
            Agregar Artículo
          </button>

          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-ah-charcoal/40 dark:text-[#a0b4d0]/60">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, tipo, ubicación..."
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
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-14 px-4 text-base rounded-full border-2 border-ah-gray dark:border-[#2a3650] bg-white dark:bg-[#1a2236] text-ah-charcoal dark:text-[#edf3ff] sm:min-w-[200px] transition-colors duration-300"
            >
              <option value="">Todos los tipos</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {search || filterType ? (
          <p className="text-base text-ah-charcoal/50 dark:text-[#a0b4d0] mb-4">
            Mostrando {filteredPieces.length} de {pieces.length} artículos
            {search && <span> — búsqueda: &quot;{search}&quot;</span>}
          </p>
        ) : null}

        <InventoryTable
          pieces={filteredPieces}
          loading={loading}
          onPieceClick={handlePieceClick}
          onUpdateUsage={handleUpdateUsage}
        />
      </main>

      {showForm && (
        <ItemModal
          piece={selectedPiece}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setSelectedPiece(null);
          }}
          saving={saving}
        />
      )}

      {showDetail && selectedPiece && (
        <ItemDetailModal
          piece={selectedPiece}
          onEdit={handleEditFromDetail}
          onDelete={handleDelete}
          onUpdateUsage={handleUpdateUsage}
          onClose={() => {
            setShowDetail(false);
            setSelectedPiece(null);
          }}
          deleting={deleting}
        />
      )}

      {/* Delete confirmation popup */}
      {confirmDelete && (
        <Popup
          type="confirm"
          title="Eliminar artículo"
          message={`¿Está seguro de que desea eliminar "${confirmDelete.name}"? Esta acción no se puede deshacer.`}
          onConfirm={executeDelete}
          onClose={() => setConfirmDelete(null)}
        />
      )}

      {/* Notification popup */}
      {popup && (
        <Popup
          type={popup.type}
          message={popup.message}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}
