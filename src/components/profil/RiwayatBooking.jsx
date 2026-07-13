import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import BuktiPembayaranUnduh from '../booking/BuktiPembayaranUnduh';
import { Calendar, Clock, CreditCard, ChevronRight, RefreshCw, Info, Trash2 } from 'lucide-react';

export default function RiwayatBooking({ currentUserId, currentUserEmail, onSelectForPayment }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pelangganId, setPelangganId] = useState(null);
  
  const [stats, setStats] = useState({
    total: 0,
    terkonfirmasi: 0,
    pending: 0,
    menungguVerifikasi: 0,
    dibatalkanOrExpired: 0
  });

  // Look up pelanggan_id by email
  useEffect(() => {
    const fetchPelangganId = async () => {
      if (!currentUserEmail) return;
      const { data } = await supabase
        .from('pelanggan')
        .select('id')
        .eq('email', currentUserEmail)
        .maybeSingle();
      if (data) setPelangganId(data.id);
    };
    fetchPelangganId();
  }, [currentUserEmail]);

  const fetchRiwayat = async () => {
    if (!pelangganId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservasi')
        .select('*, lapangan(*), transaksi(*)')
        .eq('pelanggan_id', pelangganId)
        .order('tanggal', { ascending: false });

      if (error) throw error;
      
      const list = data || [];
      setBookings(list);

      const calculatedStats = {
        total: list.length,
        terkonfirmasi: list.filter(b => b.status === 'terkonfirmasi').length,
        pending: list.filter(b => b.status === 'pending_bayar').length,
        menungguVerifikasi: list.filter(b => b.status === 'menunggu_verifikasi').length,
        dibatalkanOrExpired: list.filter(b => b.status === 'dibatalkan' || b.status === 'kedaluwarsa').length
      };
      setStats(calculatedStats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, [pelangganId]);

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan reservasi ini?')) return;

    try {
      const { error: resError } = await supabase
        .from('reservasi')
        .update({ status: 'dibatalkan' })
        .match({ id: bookingId, pelanggan_id: currentUserId });

      if (resError) throw resError;

      await supabase
        .from('transaksi')
        .update({ status_verifikasi: 'ditolak' })
        .eq('reservasi_id', bookingId);

      const target = bookings.find(b => b.id === bookingId);
      if (target) {
        await supabase
          .from('slot_lock')
          .delete()
          .match({
            lapangan_id: target.lapangan_id,
            tanggal: target.tanggal,
            jam_mulai: target.jam_mulai,
            pelanggan_id: currentUserId
          });
      }

      alert('Reservasi berhasil dibatalkan.');
      fetchRiwayat();
    } catch (err) {
      console.error(err);
      alert('Gagal membatalkan reservasi.');
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Panel Pelanggan</span>
          <h2 className="font-cal-sans text-heading font-semibold text-graphite">Daftar Transaksi</h2>
        </div>
        <button
          onClick={fetchRiwayat}
          className="p-3 bg-white border border-silver text-slate hover:text-graphite rounded-full transition-all cursor-pointer shadow-sm"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Aggregate Stats Tiles: 12px radius, White, Silver borders */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-cards p-4 border border-silver flex flex-col justify-between shadow-sm">
          <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Total Sewa</span>
          <span className="font-cal-sans text-subheading font-semibold text-graphite mt-2">{stats.total}</span>
        </div>
        <div className="bg-white rounded-cards p-4 border border-silver flex flex-col justify-between shadow-sm">
          <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Lunas</span>
          <span className="font-cal-sans text-subheading font-semibold text-action-blue mt-2">{stats.terkonfirmasi}</span>
        </div>
        <div className="bg-white rounded-cards p-4 border border-silver flex flex-col justify-between shadow-sm">
          <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Belum Bayar</span>
          <span className="font-cal-sans text-subheading font-semibold text-amber-600 mt-2">{stats.pending}</span>
        </div>
        <div className="bg-white rounded-cards p-4 border border-silver flex flex-col justify-between shadow-sm">
          <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Verifikasi</span>
          <span className="font-cal-sans text-subheading font-semibold text-slate mt-2">{stats.menungguVerifikasi}</span>
        </div>
        <div className="bg-white rounded-cards p-4 border border-silver col-span-2 md:col-span-1 flex flex-col justify-between shadow-sm">
          <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Batal / Expired</span>
          <span className="font-cal-sans text-subheading font-semibold text-red-500 mt-2">{stats.dibatalkanOrExpired}</span>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-12 h-12 border-2 border-silver border-t-ink rounded-full animate-spin"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-silver rounded-cards p-12 text-center text-slate flex flex-col items-center gap-3 shadow-sm font-semibold">
          <Info className="w-8 h-8 text-stone" />
          <span>Anda belum memiliki riwayat reservasi lapangan.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((booking) => {
            const hasTx = booking.transaksi;
            
            let badgeClass = '';
            let statusText = '';
            
            if (booking.status === 'pending_bayar') {
              badgeClass = 'bg-amber-100 text-amber-800 border border-amber-200';
              statusText = 'Belum Dibayar';
            } else if (booking.status === 'menunggu_verifikasi') {
              badgeClass = 'bg-blue-100 text-blue-800 border border-blue-200';
              statusText = 'Menunggu Verifikasi';
            } else if (booking.status === 'terkonfirmasi') {
              badgeClass = 'bg-info-banner-bg text-action-blue border border-blue-200';
              statusText = 'Terkonfirmasi';
            } else if (booking.status === 'dibatalkan') {
              badgeClass = 'bg-red-100 text-red-800 border border-red-200';
              statusText = 'Dibatalkan';
            } else if (booking.status === 'kedaluwarsa') {
              badgeClass = 'bg-red-100 text-red-800 border border-red-200';
              statusText = 'Kedaluwarsa';
            }

            return (
              <div
                key={booking.id}
                className="bg-white rounded-cards border border-silver overflow-hidden flex flex-col md:flex-row justify-between items-stretch transition-all hover:border-slate shadow-sm"
              >
                {/* Court & Date Info */}
                <div className="p-6 flex flex-col md:flex-row gap-4 items-start md:items-center flex-1">
                  <div className="w-full md:w-24 aspect-video rounded-cards overflow-hidden bg-paper border border-silver">
                    <img
                      src={booking.lapangan?.foto_url || 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=600&auto=format&fit=crop'}
                      alt={booking.lapangan?.nama}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-1.5 text-left">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-cal-sans text-body font-semibold text-graphite">
                        {booking.lapangan?.nama || 'Lapangan'}
                      </h3>
                      <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-tags tracking-wider ${badgeClass}`}>
                        {statusText}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate text-xs font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate" />
                        {booking.tanggal}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate" />
                        {booking.jam_mulai.substring(0, 5)} - {booking.jam_selesai.substring(0, 5)} WIB
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing & Actions */}
                <div className="p-6 md:border-l border-silver flex flex-col justify-center items-start md:items-end gap-3 min-w-[200px] bg-paper/20">
                  <div className="flex flex-col md:items-end text-left md:text-right">
                    <span className="text-[10px] text-slate uppercase font-semibold">Total Tagihan</span>
                    <span className="font-mono font-bold text-body text-ink">
                      Rp {Number(hasTx?.jumlah_bayar || booking.total_harga).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="w-full flex md:justify-end gap-2">
                    {booking.status === 'pending_bayar' && (
                      <>
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="p-2.5 border border-silver hover:border-red-500 hover:bg-red-50 text-slate hover:text-red-500 rounded-full transition-all cursor-pointer shadow-sm"
                          title="Batalkan Booking"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => onSelectForPayment(booking, hasTx)}
                          className="flex-1 md:flex-none px-4 py-2 bg-ink text-white rounded-tags text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Bayar
                        </button>
                      </>
                    )}

                    {booking.status === 'menunggu_verifikasi' && (
                      <button
                        onClick={() => onSelectForPayment(booking, hasTx)}
                        className="w-full px-4 py-2 bg-white border border-silver hover:bg-paper text-graphite rounded-tags text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                      >
                        Detail Pembayaran
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {booking.status === 'terkonfirmasi' && hasTx && (
                      <BuktiPembayaranUnduh
                        reservasi={booking}
                        transaksi={hasTx}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
