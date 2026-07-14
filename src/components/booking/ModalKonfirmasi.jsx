import React from 'react';
import { X, Check, ArrowRight } from 'lucide-react';

export default function ModalKonfirmasi({ isOpen, onConfirm, onCancel, bookingDetails = [] }) {
  if (!isOpen) return null;

  const totalHarga = bookingDetails.reduce((sum, item) => sum + item.harga, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
      {/* Container: 12px radius, White background, subtle shadow */}
      <div className="relative w-full max-w-lg bg-white rounded-cards border border-silver shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-silver">
          <span className="font-cal-sans text-caption tracking-tight uppercase text-slate font-semibold">Konfirmasi Pemesanan</span>
          <button
            onClick={onCancel}
            className="text-slate hover:text-graphite transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4 text-left">
          <h3 className="font-cal-sans text-heading-sm font-semibold text-graphite mb-2 leading-tight">
            Harap periksa rincian reservasi Anda sebelum melanjutkan
          </h3>

          <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
            {bookingDetails.map((slot, index) => (
              <div
                key={index}
                className="bg-paper p-4 rounded-inputs border border-silver flex justify-between items-center"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-cal-sans-ui-variable-light text-body-sm font-bold text-graphite">{slot.lapanganNama}</span>
                  <span className="text-xs text-slate font-semibold capitalize">
                    {slot.tanggal} ({slot.jenis})
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-body-sm text-ink font-bold">{slot.jamMulai} - {slot.jamSelesai}</span>
                  <span className="text-xs text-slate font-medium">Rp {slot.harga.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-silver mt-2 pt-4 flex justify-between items-center">
            <span className="text-body-sm text-slate font-semibold">Total Bayar</span>
            <span className="text-heading font-bold text-ink">Rp {totalHarga.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Footer Actions: pill shape tags, Ink style primary */}
        <div className="p-6 border-t border-silver bg-paper flex flex-col sm:flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-2.5 bg-white border border-silver text-graphite rounded-tags text-body-sm font-semibold hover:bg-paper transition-all cursor-pointer text-center shadow-sm"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto px-6 py-2.5 bg-ink text-white rounded-tags text-body-sm font-semibold hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2 text-center shadow-sm"
          >
            Konfirmasi Reservasi
            <ArrowRight className="w-4 h-4 text-action-blue" />
          </button>
        </div>
      </div>
    </div>
  );
}
