import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Check, X, Eye, Calendar, Clock, AlertCircle } from 'lucide-react';

export default function DaftarVerifikasi({ currentAdminId }) {
  const [transaksis, setTransaksis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProofUrl, setSelectedProofUrl] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchPendingTransactions = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Ambil dari reservasi yang berstatus menunggu_verifikasi
      const { data: resData, error: resErr } = await supabase
        .from('reservasi')
        .select('*, pelanggan(*), lapangan(*), transaksi(*)')
        .eq('status', 'menunggu_verifikasi')
        .order('tanggal', { ascending: true });

      if (resErr && !resErr.message?.includes('403')) {
        console.error('Fetch reservasi menunggu error:', resErr);
      }

      // 2. Ambil dari transaksi yang berstatus menunggu
      const { data: txData, error: txErr } = await supabase
        .from('transaksi')
        .select('*, reservasi(*, pelanggan(*), lapangan(*))')
        .eq('status_verifikasi', 'menunggu');

      if (txErr && !txErr.message?.includes('403')) {
        console.error('Fetch transaksi menunggu error:', txErr);
      }

      const combined = [];
      const seenResIds = new Set();
      const seenTxIds = new Set();

      // Prioritas dari reservasi yang menunggu_verifikasi (agar detail pelanggan & lapangan selalu terjamin lengkap)
      if (resData) {
        resData.forEach(r => {
          seenResIds.add(r.id);
          let txObj = Array.isArray(r.transaksi)
            ? (r.transaksi.find(tx => tx.bukti_transfer_url) || r.transaksi[0])
            : r.transaksi;

          if (!txObj?.bukti_transfer_url && txData) {
            const matchTx = txData.find(t => t.reservasi_id === r.id || t.reservasi?.id === r.id);
            if (matchTx) txObj = matchTx;
          }

          if (txObj?.id) seenTxIds.add(txObj.id);

          combined.push({
            id: txObj?.id || `res-${r.id}`,
            reservasi_id: r.id,
            reservasi: r,
            jumlah_bayar: txObj?.jumlah_bayar || r.total_harga,
            bukti_transfer_url: txObj?.bukti_transfer_url || null,
            status_verifikasi: txObj?.status_verifikasi || 'menunggu'
          });
        });
      }

      // Gabungkan juga dari transaksi yang statusnya menunggu namun belum ada di resData
      if (txData) {
        txData.forEach(t => {
          const resId = t.reservasi_id || t.reservasi?.id;
          if (!seenTxIds.has(t.id) && (!resId || !seenResIds.has(resId))) {
            seenTxIds.add(t.id);
            if (resId) seenResIds.add(resId);

            combined.push({
              id: t.id,
              reservasi_id: resId,
              reservasi: t.reservasi || {},
              jumlah_bayar: t.jumlah_bayar,
              bukti_transfer_url: t.bukti_transfer_url,
              status_verifikasi: t.status_verifikasi
            });
          }
        });
      }

      setTransaksis(combined);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal memuat daftar verifikasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTransactions();
  }, []);

  const handleVerifikasi = async (txOrResId, isApprove) => {
    setActionLoading(prev => ({ ...prev, [txOrResId]: true }));
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const now = new Date().toISOString();
      const statusVerifikasi = isApprove ? 'disetujui' : 'ditolak';
      const statusReservasi = isApprove ? 'terkonfirmasi' : 'dibatalkan';

      const item = transaksis.find(t => t.id === txOrResId || t.reservasi_id === txOrResId);
      const resId = item?.reservasi_id || item?.reservasi?.id;
      const txId = (item?.id && !item.id.toString().startsWith('res-')) ? item.id : null;

      // 1. Update status reservasi & sinkronisasi slot_lock
      if (resId) {
        await supabase
          .from('reservasi')
          .update({ status: statusReservasi })
          .eq('id', resId);
        // Bersihkan kunci slot sementara (slot_lock) jika koordinat lapangan & waktu tersedia
        if (item?.reservasi?.lapangan_id && item?.reservasi?.tanggal && item?.reservasi?.jam_mulai) {
          await supabase
            .from('slot_lock')
            .delete()
            .match({
              lapangan_id: item.reservasi.lapangan_id,
              tanggal: item.reservasi.tanggal,
              jam_mulai: item.reservasi.jam_mulai
            });
        }
      }

      // 2. Update transaksi jika ada ID transaksi yang valid
      if (txId) {
        await supabase
          .from('transaksi')
          .update({
            status_verifikasi: statusVerifikasi,
            diverifikasi_oleh: currentAdminId,
            diverifikasi_pada: now
          })
          .eq('id', txId);
      } else if (resId) {
        await supabase
          .from('transaksi')
          .update({
            status_verifikasi: statusVerifikasi,
            diverifikasi_oleh: currentAdminId,
            diverifikasi_pada: now
          })
          .eq('reservasi_id', resId);
      }

      setSuccessMsg(
        isApprove
          ? 'Reservasi & pembayaran berhasil disetujui!'
          : 'Reservasi & pembayaran ditolak.'
      );

      fetchPendingTransactions();
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal memproses verifikasi transaksi.');
    } finally {
      setActionLoading(prev => ({ ...prev, [txOrResId]: false }));
    }
  };

  const getFullImageUri = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('bukti-transfer').getPublicUrl(path);
    return data?.publicUrl || '';
  };

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      <div className="flex flex-col gap-1">
        <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Verifikasi Admin</span>
        <h2 className="font-cal-sans text-heading font-semibold text-graphite">Persetujuan Transaksi</h2>
        <p className="text-body-sm text-slate font-medium">
          Daftar pembayaran transfer manual yang menunggu peninjauan Anda.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-inputs text-body-sm font-medium">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-action-blue px-4 py-3 rounded-inputs text-body-sm font-semibold shadow-sm">
          <Check className="w-5 h-5 text-action-blue flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-12 h-12 border-2 border-silver border-t-ink rounded-full animate-spin"></div>
        </div>
      ) : transaksis.length === 0 ? (
        <div className="bg-white border border-silver rounded-cards p-12 text-center text-slate font-semibold shadow-sm">
          Tidak ada transaksi yang memerlukan verifikasi saat ini.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-cards border border-silver shadow-sm">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-silver bg-paper text-slate text-body-sm font-bold">
                <th className="p-4 pl-6">Pelanggan</th>
                <th className="p-4">Reservasi Lapangan</th>
                <th className="p-4">Jadwal Sewa</th>
                <th className="p-4">Jumlah Bayar</th>
                <th className="p-4">Bukti Transfer</th>
                <th className="p-4 pr-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver text-body-sm font-medium text-graphite">
              {transaksis.map((tx) => {
                const res = tx.reservasi;
                if (!res) return null;

                return (
                  <tr key={tx.id} className="hover:bg-paper/40 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-graphite">{res.pelanggan?.nama || 'Pelanggan'}</span>
                        <span className="text-slate text-xs">{res.pelanggan?.email}</span>
                        <span className="text-slate text-xs">{res.pelanggan?.no_telepon}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-graphite">{res.lapangan?.nama}</span>
                        <span className="text-xs text-slate capitalize">Jenis: {res.lapangan?.jenis}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-graphite font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-slate" />
                          {res.tanggal}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate text-xs">
                          <Clock className="w-3.5 h-3.5 text-stone" />
                          {res.jam_mulai.substring(0, 5)} - {res.jam_selesai.substring(0, 5)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-ink">
                      Rp {Number(tx.jumlah_bayar).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">
                      {tx.bukti_transfer_url ? (
                        <button
                          type="button"
                          onClick={() => setSelectedProofUrl(getFullImageUri(tx.bukti_transfer_url))}
                          className="flex items-center gap-1.5 text-graphite hover:text-white transition-colors cursor-pointer text-xs font-semibold py-1.5 px-3 rounded-tags bg-white hover:bg-ink border border-silver hover:border-ink shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Lihat Bukti
                        </button>
                      ) : (
                        <span className="text-red-500 text-xs flex items-center gap-1 font-bold">
                          Belum Diupload
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          disabled={actionLoading[tx.id]}
                          onClick={() => handleVerifikasi(tx.id, false)}
                          className="p-2 border border-silver hover:border-red-500 hover:bg-red-50 text-slate hover:text-red-500 rounded-full transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                          title="Tolak Bukti"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          disabled={actionLoading[tx.id]}
                          onClick={() => handleVerifikasi(tx.id, true)}
                          className="p-2 bg-ink text-white hover:opacity-90 rounded-full transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                          title="Setujui Bukti"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Proof Image Viewer Modal: 12px radius, White background */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-xs">
          <div className="relative max-w-2xl w-full bg-white rounded-cards border border-silver p-6 flex flex-col items-center shadow-sm">
            <button
              onClick={() => setSelectedProofUrl(null)}
              className="absolute top-4 right-4 p-2 bg-white border border-silver text-slate hover:text-graphite hover:bg-paper rounded-full transition-colors cursor-pointer shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="font-cal-sans text-caption text-slate uppercase font-semibold mb-4 text-center">
              Bukti Pengiriman Transfer Pelanggan
            </div>
            <div className="w-full max-h-[60vh] overflow-auto rounded-inputs border border-silver flex items-center justify-center bg-paper">
              <img
                src={selectedProofUrl}
                alt="Bukti Transfer"
                className="max-h-[55vh] object-contain max-w-full"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=600&auto=format&fit=crop';
                }}
              />
            </div>
            <div className="mt-4 flex justify-center">
              <a
                href={selectedProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold px-4 py-2 bg-ink text-white rounded-tags hover:opacity-90 transition-all shadow-sm"
              >
                Buka Foto di Tab Baru
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
