import React from 'react';
import { X, CreditCard, Calendar, Clock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PaymentConfirmModal({ isOpen, onClose, onConfirm, reservasi, profile, isProcessing }) {
  if (!isOpen || !reservasi) return null;

  const startH = parseInt((reservasi.jam_mulai || '00:00').split(':')[0], 10);
  const endH = parseInt((reservasi.jam_selesai || '00:00').split(':')[0], 10);
  const durasi = Math.max(1, endH - startH);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[28px] border border-[#e2e8f0] max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="bg-[#f0f4fe] p-6 pb-5 border-b border-[#e2e8f0] relative">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="absolute top-4 right-4 p-2 rounded-full text-[#6b7280] hover:bg-[#e2e8f0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#145aff] text-white flex items-center justify-center shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[#145aff] uppercase tracking-wider block">
                KONFIRMASI PEMBAYARAN
              </span>
              <h3 className="font-semibold text-lg text-[#020520]">
                Rincian Pesanan Lapangan
              </h3>
            </div>
          </div>
        </div>

        {/* Isi Rincian Pesanan */}
        <div className="p-6 space-y-4 text-sm">
          <p className="text-xs text-[#6b7280]">
            Periksa kembali rincian pemesanan Anda sebelum melakukan konfirmasi pembayaran:
          </p>

          {/* Info Lapangan */}
          <div className="bg-[#fcfcfc] rounded-2xl p-4 border border-[#e2e8f0] space-y-3">
            <div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#f0f4fe] text-[#145aff]">
                {reservasi.lapangan?.jenis || 'Olahraga'}
              </span>
              <h4 className="font-semibold text-base text-[#020520] mt-1.5">
                {reservasi.lapangan?.nama_lapangan || `Lapangan #${reservasi.id_lapangan}`}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e2e8f0] text-xs">
              <div>
                <span className="text-[#6b7280] block text-[11px]">Tanggal Main</span>
                <span className="font-medium text-[#14141e] flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-[#145aff]" />
                  {reservasi.tanggal}
                </span>
              </div>
              <div>
                <span className="text-[#6b7280] block text-[11px]">Waktu</span>
                <span className="font-mono font-medium text-[#14141e] flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-[#145aff]" />
                  {reservasi.jam_mulai} – {reservasi.jam_selesai} WIB
                </span>
              </div>
            </div>
          </div>

          {/* Rincian Biaya */}
          <div className="bg-[#f8fafc] rounded-2xl p-4 border border-[#e2e8f0] space-y-2 text-xs">
            <div className="flex justify-between text-[#6b7280]">
              <span>Durasi Sewa:</span>
              <span className="font-medium text-[#14141e]">{durasi} Jam</span>
            </div>
            <div className="flex justify-between text-[#6b7280]">
              <span>Atas Nama:</span>
              <span className="font-medium text-[#14141e]">{profile?.nama || 'Pelanggan'}</span>
            </div>
            <div className="pt-2 border-t border-[#e2e8f0] flex justify-between items-center">
              <span className="font-semibold text-sm text-[#020520]">Total Tagihan:</span>
              <span className="font-mono font-bold text-lg text-[#145aff]">
                Rp {reservasi.total_bayar.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Info Simulasi Prototipe */}
          <div className="p-3 rounded-xl bg-[#f0f4fe]/60 border border-[#145aff]/20 flex items-start gap-2.5 text-[11px] text-[#374151]">
            <ShieldCheck className="w-4 h-4 text-[#145aff] shrink-0 mt-0.5" />
            <span>
              <strong>Simulasi Pembayaran:</strong> Dengan mengklik tombol bayar di bawah, pembayaran langsung terverifikasi secara instan dan struk lunas akan otomatis diterbitkan.
            </span>
          </div>
        </div>

        {/* Footer Tombol Aksi */}
        <div className="bg-[#f8fafc] px-6 py-4 border-t border-[#e2e8f0] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-full border border-[#e2e8f0] text-xs font-medium text-[#374151] hover:bg-white transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reservasi)}
            disabled={isProcessing}
            className="px-6 py-2.5 rounded-full bg-[#145aff] text-white font-medium text-xs hover:bg-[#0042e6] transition-all shadow-sm flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isProcessing ? 'Memproses Bayar...' : `Bayar Rp ${reservasi.total_bayar.toLocaleString('id-ID')}`}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
