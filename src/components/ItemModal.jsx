'use client';

import { useState, useEffect, useRef } from 'react';
import ImageCropper from './ImageCropper';

const ITEM_TYPES = [
  'Flight Controller',
  'Batería',
  'ESC',
  'Hélice',
  'Motor',
  'Cámara',
  'Telemetría',
  'RC',
  'Frame',
  'GPS',
  'Sensores',
  'Módulo de escaneo',
  'RFID',
  'Cargadores',
  'Cableado',
  'Tornillería',
  'Materia Prima',
  'Otros',
];

const EMPTY_FORM = {
  name: '',
  type: '',
  description: '',
  quantity: '',
  in_use: '',
  part_number: '',
  supplier: '',
  location: '',
  notes: '',
};

function InputField({ label, field, type = 'text', placeholder = '', required = false, value, error, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-base font-semibold text-ah-navy dark:text-[#d0daf0]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        min={type === 'number' ? '0' : undefined}
        className={`h-14 px-4 text-lg rounded-xl border-2 ${
          error ? 'border-red-400' : 'border-ah-gray dark:border-[#2a3650]'
        } bg-white dark:bg-[#162030] text-ah-charcoal dark:text-[#edf3ff] placeholder-gray-400 dark:placeholder-[#5a6e8a] transition-colors duration-300`}
      />
      {error && <span className="text-red-500 dark:text-red-400 text-sm">{error}</span>}
    </div>
  );
}

function SelectField({ label, field, options, required = false, value, error, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-base font-semibold text-ah-navy dark:text-[#d0daf0]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        className={`h-14 px-4 text-lg rounded-xl border-2 ${
          error ? 'border-red-400' : 'border-ah-gray dark:border-[#2a3650]'
        } bg-white dark:bg-[#162030] text-ah-charcoal dark:text-[#edf3ff] transition-colors duration-300`}
      >
        <option value="">— Seleccionar —</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {error && <span className="text-red-500 dark:text-red-400 text-sm">{error}</span>}
    </div>
  );
}

export default function ItemModal({ piece, onSave, onClose, saving }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [cropperSrc, setCropperSrc] = useState(null);
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);
  const modalRef = useRef(null);

  const isEditing = !!piece;

  useEffect(() => {
    if (piece) {
      const formData = { ...EMPTY_FORM };
      Object.keys(EMPTY_FORM).forEach((key) => {
        if (piece[key] !== null && piece[key] !== undefined) {
          formData[key] = String(piece[key]);
        }
      });
      setForm(formData);
      if (piece.photo_url) {
        setPhotoPreview(piece.photo_url);
      }
    }
  }, [piece]);

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropperSrc(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (blob) => {
    setCroppedBlob(blob);
    setPhotoPreview(URL.createObjectURL(blob));
    setCropperSrc(null);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'El nombre es obligatorio';
    if (!form.type) errs.type = 'Seleccione un tipo';
    const qty = Number(form.quantity) || 0;
    const use = Number(form.in_use) || 0;
    if (use > qty) errs.in_use = 'En uso no puede ser mayor que la cantidad';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const data = { ...form };
    data.quantity = data.quantity ? Number(data.quantity) : 0;
    data.in_use = data.in_use ? Number(data.in_use) : 0;

    Object.keys(data).forEach((key) => {
      if (data[key] === '') data[key] = null;
    });

    // Ensure numbers stay as numbers after null cleanup
    if (data.quantity === null) data.quantity = 0;
    if (data.in_use === null) data.in_use = 0;

    onSave(data, croppedBlob);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start sm:items-start justify-center modal-backdrop">
        <div className="absolute inset-0 bg-black/50 dark:bg-black/70 hidden sm:block" onClick={onClose} />

        <div
          ref={modalRef}
          className="relative z-10 w-full max-w-3xl mx-0 sm:mx-4 my-0 sm:my-8 bg-white dark:bg-[#121e32] rounded-none sm:rounded-3xl shadow-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto modal-content transition-colors duration-300"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-[#121e32] border-b border-ah-gray/50 dark:border-[#2a3650] sm:rounded-t-3xl px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between transition-colors duration-300">
            <h2 className="text-2xl sm:text-3xl font-bold text-ah-navy dark:text-[#edf3ff]">
              {isEditing ? 'Editar Artículo' : 'Agregar Nuevo Artículo'}
            </h2>
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#1a2236] hover:bg-gray-200 dark:hover:bg-[#243048] flex items-center justify-center text-2xl text-ah-charcoal dark:text-[#a0b4d0] transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="px-6 sm:px-8 py-6 space-y-8">
            {/* Foto */}
            <section>
              <h3 className="text-xl font-bold text-ah-navy dark:text-[#edf3ff] mb-4 pb-2 border-b border-ah-blue/20 dark:border-ah-blue/30">
                Fotografía
              </h3>
              <div className="flex flex-col items-center gap-4">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Vista previa"
                      className="w-64 h-48 object-cover rounded-2xl border-2 border-ah-gray dark:border-[#2a3650] shadow-md"
                    />
                    <button
                      onClick={() => {
                        setPhotoPreview(null);
                        setCroppedBlob(null);
                      }}
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-64 h-48 rounded-2xl border-2 border-dashed border-ah-gray dark:border-[#3a4e6a] flex flex-col items-center justify-center text-ah-charcoal/40 dark:text-[#5a6e8a]">
                    <span className="text-5xl mb-2">📦</span>
                    <span className="text-base">Sin foto</span>
                  </div>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="px-6 py-3 text-lg font-semibold rounded-full border-2 border-ah-blue text-ah-blue dark:text-[#7db0ff] dark:border-[#7db0ff] hover:bg-ah-blue/5 dark:hover:bg-ah-blue/10 transition-colors"
                >
                  {photoPreview ? 'Cambiar Foto' : 'Subir Foto'}
                </button>
              </div>
            </section>

            {/* Información Básica */}
            <section>
              <h3 className="text-xl font-bold text-ah-navy dark:text-[#edf3ff] mb-4 pb-2 border-b border-ah-blue/20 dark:border-ah-blue/30">
                Información Básica
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <InputField label="Nombre del Artículo" field="name" placeholder="Ej: Módulo Bluetooth HC-05" required value={form.name} error={errors.name} onChange={handleChange} />
                </div>
                <SelectField label="Tipo" field="type" options={ITEM_TYPES} required value={form.type} error={errors.type} onChange={handleChange} />
                <InputField label="Número de Parte / Modelo" field="part_number" placeholder="Ej: PIXHAWK-V6X" value={form.part_number} error={errors.part_number} onChange={handleChange} />
                <div className="sm:col-span-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-base font-semibold text-ah-navy dark:text-[#d0daf0]">Descripción</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Descripción del artículo..."
                      rows={3}
                      className="px-4 py-3 text-lg rounded-xl border-2 border-ah-gray dark:border-[#2a3650] bg-white dark:bg-[#162030] text-ah-charcoal dark:text-[#edf3ff] placeholder-gray-400 dark:placeholder-[#5a6e8a] resize-y transition-colors duration-300"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Inventario */}
            <section>
              <h3 className="text-xl font-bold text-ah-navy dark:text-[#edf3ff] mb-4 pb-2 border-b border-ah-blue/20 dark:border-ah-blue/30">
                Inventario
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Cantidad Total" field="quantity" type="number" placeholder="Ej: 10" value={form.quantity} error={errors.quantity} onChange={handleChange} />
                <InputField label="En Uso" field="in_use" type="number" placeholder="Ej: 3" value={form.in_use} error={errors.in_use} onChange={handleChange} />
              </div>
              {form.quantity && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/15 rounded-xl border border-blue-200 dark:border-blue-800/30">
                  <p className="text-base text-ah-navy dark:text-[#d0daf0]">
                    Disponibles: <span className="font-bold text-green-600 dark:text-green-400">{Math.max(0, (Number(form.quantity) || 0) - (Number(form.in_use) || 0))}</span> de {Number(form.quantity) || 0}
                  </p>
                </div>
              )}
            </section>

            {/* Detalles */}
            <section>
              <h3 className="text-xl font-bold text-ah-navy dark:text-[#edf3ff] mb-4 pb-2 border-b border-ah-blue/20 dark:border-ah-blue/30">
                Detalles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Proveedor" field="supplier" placeholder="Ej: DJI, Holybro, Amazon" value={form.supplier} error={errors.supplier} onChange={handleChange} />
                <InputField label="Ubicación" field="location" placeholder="Ej: Estante A3, Oficina" value={form.location} error={errors.location} onChange={handleChange} />
              </div>
            </section>

            {/* Notas */}
            <section>
              <h3 className="text-xl font-bold text-ah-navy dark:text-[#edf3ff] mb-4 pb-2 border-b border-ah-blue/20 dark:border-ah-blue/30">
                Notas Adicionales
              </h3>
              <textarea
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Cualquier información adicional..."
                rows={4}
                className="w-full px-4 py-3 text-lg rounded-xl border-2 border-ah-gray dark:border-[#2a3650] bg-white dark:bg-[#162030] text-ah-charcoal dark:text-[#edf3ff] placeholder-gray-400 dark:placeholder-[#5a6e8a] resize-y transition-colors duration-300"
              />
            </section>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-[#121e32] border-t border-ah-gray/50 dark:border-[#2a3650] sm:rounded-b-3xl px-4 sm:px-8 py-4 sm:py-5 flex gap-3 sm:gap-4 justify-end transition-colors duration-300">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-8 py-4 text-lg font-semibold rounded-full border-2 border-ah-gray dark:border-[#3a4e6a] text-ah-charcoal dark:text-[#a0b4d0] hover:bg-gray-50 dark:hover:bg-[#1a2236] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary px-10 py-4 text-lg font-semibold rounded-full text-white disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                isEditing ? 'Guardar Cambios' : 'Agregar Artículo'
              )}
            </button>
          </div>
        </div>
      </div>

      {cropperSrc && (
        <ImageCropper
          imageSrc={cropperSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropperSrc(null)}
        />
      )}
    </>
  );
}
