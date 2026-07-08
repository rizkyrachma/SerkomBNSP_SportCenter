import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isConfigured, getLocalData } from '../../lib/supabase';
import ReceiptModal from '../../components/ReceiptModal';
import { CreditCard, Search, CheckCircle2, Calendar, Clock, FileText, ArrowUpRight } from 'lucide-react';

export default function RiwayatTransaksi() {
  const { user, profile } = useAuth();
  const [transaksiList, setTransaksiList] = useState([]);
  const [reservasiMap, setReservasiMap] = useState({});
  const [lapanganMap, setLapanganMap] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // State untuk Struk Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTransaksi();
    }
  }, [user]);

  const fetchTransaksi = async () => {
    setLoading(true);
    if (isConfigured && supabase) {
      const { data: trxData } = await supabase
        .from('transaksi')
        .select('*')
        .eq('id_pelanggan', user.id)
        .order('waktu_bayar', { ascending: false });

      const { data: resData } = await supabase.from('reservasi').select('*');
      const rMap = {};
      (resData || []).forEach(r => { rMap[r.id_reservasi] = r; });
      setReservasiMap(rMap);

      const { data: lapData } = await supabase.from('lapangan').select('*');
      const lMap = {};
      (lapData || []).forEach(l => { lMap[l.id] = l; });
      setLapanganMap(lMap);

      setTransaksiList(trxData || []);
    } else {
      const allTrx = getLocalData('transaksi', []);
      const myTrx = allTrx.filter(t => t.id_pelanggan === user?.id);
      setTransaksiList(myTrx);

      const allRes = getLocalData('reservasi', []);
      const rMap = {};
      allRes.forEach(r => { rMap[r.id_reservasi] = r; });
      setReservasiMap(rMap);

      const allLap = getLocalData('lapangan', []);
      const lMap = {};
      allLap.forEach(l => { lMap[l.id] = l; });
      setLapanganMap(lMap);
    }
    setLoading(false);
  };

  const handleLihatStruk = (trx) => {
    const res = reservasiMap[trx.id_reservasi];
    if (res) {
      const lap = lapanganMap[res.id_lapangan];
      setSelectedReceipt({
        ...res,
        lapangan: lap || { nama_lapangan: `Lapangan #${res.id_lapangan}`, jenis: 'olahraga' }
      });
      setIsReceiptOpen(true);
    }
  };

  const filtered = transaksiList.filter(t => {
    return t.kode_transaksi?.toLowerCase().includes(search.toLowerCase()) ||
           t.metode_bayar?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-semibold text-[#145aff] tracking-wider uppercase">
            PEMBAYARAN & AUDIT
          </span>
          <h1 className="text-3xl font-semibold text-[#020520] tracking-tight mt-1">
            Riwayat Transaksi Pembayaran
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Daftar lengkap seluruh transaksi pembayaran yang pernah Anda lakukan untuk pesanan lapangan
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode transaksi..."
            className="pl-9 pr-4 py-2 rounded-xl bg-white border border-[#e2e8f0] text-xs w-64 focus:outline-none focus:border-[#145aff]"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-[#6b7280]">Memuat log riwayat transaksi...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-[#e2e8f0] p-12 text-center">
          <CreditCard className="w-12 h-12 text-[#9ca3af] mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-[#020520]">Belum Ada Transaksi Pembayaran</h3>
          <p className="text-xs text-[#6b7280] mt-1">
            Anda belum melakukan pembayaran transaksi apa pun saat ini.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[28px] border border-[#e2e8f0] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-xs font-semibold text-[#6b7280] uppercase tracking-wider bg-[#fcfcfc]">
                  <th className="py-3.5 px-5">Kode Transaksi</th>
                  <th className="py-3.5 px-5">Waktu Pembayaran</th>
                  <th className="py-3.5 px-5">Metode Pembayaran</th>
                  <th className="py-3.5 px-5">Nominal Bayar</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Struk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] text-sm">
                {filtered.map((trx) => {
                  const dateStr = new Date(trx.waktu_bayar).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={trx.id_transaksi} className="hover:bg-[#f0f4fe]/30 transition-colors">
                      <td className="py-4 px-5 font-mono text-xs font-bold text-[#145aff]">
                        {trx.kode_transaksi}
                      </td>

                      <td className="py-4 px-5 text-xs text-[#374151]">
                        {dateStr}
                      </td>

                      <td className="py-4 px-5 text-xs font-medium text-[#14141e]">
                        {trx.metode_bayar}
                      </td>

                      <td className="py-4 px-5 font-mono font-bold text-[#020520]">
                        Rp {trx.jumlah_bayar.toLocaleString('id-ID')}
                      </td>

                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f0fdf4] text-[#15803d] border border-[#16ca2e]/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>BERHASIL</span>
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        {reservasiMap[trx.id_reservasi] && (
                          <button
                            onClick={() => handleLihatStruk(trx)}
                            className="px-3.5 py-1.5 rounded-full bg-[#f0f4fe] border border-[#145aff]/30 text-[#145aff] text-xs font-medium hover:bg-[#145aff] hover:text-white transition-all inline-flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Lihat Struk</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Struk */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        reservasi={selectedReceipt}
        profile={profile}
      />
    </div>
  );
}
