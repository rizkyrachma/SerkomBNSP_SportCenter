import React from 'react';
import { X, Printer, CheckCircle2, Calendar, Clock, MapPin, ShieldCheck, Sparkles } from 'lucide-react';

export default function ReceiptModal({ isOpen, onClose, reservasi, profile }) {
  if (!isOpen || !reservasi) return null;

  const handlePrint = () => {
    window.print();
  };

  // Hitung durasi jam
  const startH = parseInt((reservasi.jam_mulai || '00:00').split(':')[0], 10);
  const endH = parseInt((reservasi.jam_selesai || '00:00').split(':')[0], 10);
  const durasi = Math.max(1, endH - startH);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      {/* Modal / Struk Card */}
      <div className="bg-white rounded-[28px] border border-[#e2e8f0] max-w-md w-full shadow-2xl overflow-hidden print:shadow-none print:border-0 print:max-w-none">
        
        {/* Header Struk */}
        <div className="bg-gradient-to-b from-[#f0f4fe] to-white p-6 pb-4 border-b border-[#e2e8f0] relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-[#6b7280] hover:bg-[#e2e8f0] transition-colors print:hidden"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#145aff] text-white flex items-center justify-center font-bold text-lg">
              S
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#020520]">SM Sport Center</h3>
              <p className="text-xs text-[#6b7280]">Struk Bukti Pembayaran & Reservasi</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#e2e8f0]">
            <div>
              <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block">ID TRANSAKSI</span>
              <span className="font-mono text-xs font-bold text-[#145aff]">{reservasi.id_transaksi}</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f0fdf4] border border-[#16ca2e]/30 text-[#15803d] text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>LUNAS</span>
            </div>
          </div>
        </div>

        {/* Body Struk */}
        <div className="p-6 space-y-5 text-sm">
          {/* Pelanggan */}
          <div className="bg-[#fcfcfc] rounded-2xl p-4 border border-[#e2e8f0]">
            <div className="text-[11px] text-[#6b7280] uppercase tracking-wider mb-1">DATA PEMESAN</div>
            <div className="font-semibold text-[#020520]">{profile?.nama || 'Pelanggan SM Sport'}</div>
            <div className="text-xs text-[#6b7280]">{profile?.email || ''}</div>
          </div>

          {/* Rincian Pemesanan */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
              RINCIAN FASILITAS & JADWAL
            </div>

            <div className="flex justify-between items-start pb-3 border-b border-[#e2e8f0]">
              <div>
                <span className="font-semibold text-[#020520] block">
                  {reservasi.lapangan?.nama_lapangan || `Lapangan #${reservasi.id_lapangan}`}
                </span>
                <span className="text-xs uppercase px-2 py-0.5 rounded-md bg-[#f0f4fe] text-[#145aff] font-bold">
                  {reservasi.lapangan?.jenis || 'Olahraga'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#fcfcfc] p-3 rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center gap-1.5 text-[#6b7280] mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#145aff]" />
                  <span>Tanggal Main</span>
                </div>
                <div className="font-semibold text-[#14141e]">{reservasi.tanggal}</div>
              </div>

              <div className="bg-[#fcfcfc] p-3 rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center gap-1.5 text-[#6b7280] mb-1">
                  <Clock className="w-3.5 h-3.5 text-[#145aff]" />
                  <span>Jam Operasional</span>
                </div>
                <div className="font-mono font-semibold text-[#14141e]">
                  {reservasi.jam_mulai} – {reservasi.jam_selesai} WIB
                </div>
              </div>
            </div>

            {reservasi.catatan && (
              <div className="text-xs italic text-[#6b7280] bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]">
                Catatan: "{reservasi.catatan}"
              </div>
            )}
          </div>

          {/* Perhitungan Biaya */}
          <div className="pt-3 border-t border-dashed border-[#cbd5e1] space-y-2">
            <div className="flex justify-between text-xs text-[#6b7280]">
              <span>Durasi Sewa ({durasi} Jam)</span>
              <span className="font-mono">
                Rp {(reservasi.total_bayar).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-xs text-[#6b7280]">
              <span>Status Pembayaran</span>
              <span className="text-[#16ca2e] font-semibold">Simulasi Lunas (Sistem)</span>
            </div>

            <div className="pt-3 border-t border-[#e2e8f0] flex justify-between items-center">
              <span className="font-semibold text-[#020520] text-sm">TOTAL DIBAYAR</span>
              <span className="font-mono font-bold text-lg text-[#145aff]">
                Rp {reservasi.total_bayar.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Struk & Action Buttons */}
        <div className="bg-[#f8fafc] p-5 border-t border-[#e2e8f0] print:hidden">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 px-4 rounded-full bg-white border border-[#145aff] text-[#145aff] font-medium text-xs hover:bg-[#f0f4fe] transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk</span>
            </button>

            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-full bg-[#145aff] text-white font-medium text-xs hover:bg-[#0042e6] transition-all shadow-sm"
            >
              Selesai & Tutup
            </button>
          </div>

          <div className="mt-3 text-center text-[11px] text-[#6b7280]">
            Simpan bukti struk ini saat datang ke lokasi SM Sport Center
          </div>
        </div>
      </div>
    </div>
  );
}
