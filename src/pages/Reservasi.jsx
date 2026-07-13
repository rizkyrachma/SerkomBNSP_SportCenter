import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import JadwalLapangan from '../components/booking/JadwalLapangan';
import ModalKonfirmasi from '../components/booking/ModalKonfirmasi';
import CardPembayaran from '../components/booking/CardPembayaran';
import { Shield, ArrowLeft, CheckCircle, Info } from 'lucide-react';

export default function Reservasi() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Checkout state
  const [activeReservasi, setActiveReservasi] = useState(null);
  const [activeTransaksi, setActiveTransaksi] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      } else {
        setCurrentUser(user);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleSlotSelect = (slots) => {
    setSelectedSlots(slots);
  };

  const handleCheckoutClick = () => {
    if (selectedSlots.length === 0) {
      setErrorMsg('Silakan pilih minimal 1 slot jam lapangan.');
      return;
    }
    setErrorMsg('');
    setShowConfirm(true);
  };

  const handleConfirmBooking = async () => {
    setShowConfirm(false);
    setLoading(true);
    setErrorMsg('');

    try {
      if (selectedSlots.length === 0) return;

      // Sort slots by jamMulai to get the full time range
      const sortedSlots = [...selectedSlots].sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
      const firstSlot = sortedSlots[0];
      const lastSlot = sortedSlots[sortedSlots.length - 1];
      const totalHarga = sortedSlots.reduce((sum, s) => sum + Number(s.harga), 0);

      // Look up pelanggan_id by email (since pelanggan.id is TEXT like PLG0001, not auth UUID)
      const { data: plgData, error: plgErr } = await supabase
        .from('pelanggan')
        .select('id')
        .eq('email', currentUser.email)
        .maybeSingle();

      if (plgErr) throw plgErr;
      if (!plgData) throw new Error('Akun pelanggan Anda belum terdaftar. Silakan hubungi admin.');

      const pelangganId = plgData.id;

      // Double-check if the slot was taken
      const { data: activeLocks } = await supabase
        .from('slot_lock')
        .select('*')
        .match({
          lapangan_id: firstSlot.lapanganId,
          tanggal: firstSlot.tanggal,
          jam_mulai: firstSlot.jamMulai + ':00'
        });

      const isLockedByOthers = (activeLocks || []).some(
        lock => lock.pelanggan_id !== pelangganId && new Date(lock.kedaluwarsa_pada) > new Date()
      );

      if (isLockedByOthers) {
        throw new Error('Slot ini sudah dikunci oleh pelanggan lain. Silakan pilih jam lain.');
      }

      // Create reservasi
      const { data: createdRes, error: resErr } = await supabase
        .from('reservasi')
        .insert({
          pelanggan_id: pelangganId,
          lapangan_id: firstSlot.lapanganId,
          tanggal: firstSlot.tanggal,
          jam_mulai: firstSlot.jamMulai + ':00',
          jam_selesai: lastSlot.jamSelesai + ':00',
          status: 'pending_bayar',
          total_harga: totalHarga
        })
        .select()
        .single();

      if (resErr) throw resErr;

      // Fetch the transaction details
      const { data: txData, error: txErr } = await supabase
        .from('transaksi')
        .select('*')
        .eq('reservasi_id', createdRes.id)
        .single();

      if (txErr) throw txErr;

      createdRes.lapangan = { nama: firstSlot.lapanganNama, jenis: firstSlot.jenis };

      setActiveReservasi(createdRes);
      setActiveTransaksi(txData);
      setSelectedSlots([]); // Clear cart
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal memproses pembuatan reservasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-graphite flex flex-col font-cal-sans-ui-variable-light">
      {/* Navigation Header */}
      <nav className="w-full bg-paper border-b border-silver/50 py-4 px-6 md:px-12 flex justify-between items-center max-w-[1200px] mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-ink" />
          <span className="font-cal-sans text-subheading font-semibold tracking-tight text-graphite">
            SM SPORT CENTER
          </span>
        </Link>
        <div className="flex gap-4">
          <Link to="/" className="text-slate hover:text-graphite font-semibold transition-colors text-body-sm">Beranda</Link>
          <Link to="/riwayat" className="text-slate hover:text-graphite font-semibold transition-colors text-body-sm">Riwayat Booking</Link>
        </div>
      </nav>

      {/* Content wrapper */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 md:px-12 py-12 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 bg-white border border-silver text-slate hover:text-graphite rounded-full transition-colors cursor-pointer shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Alur Reservasi</span>
            <h1 className="font-cal-sans text-heading font-semibold text-graphite">Sewa Lapangan Olahraga</h1>
          </div>
        </div>

        {/* Dynamic checkout views */}
        {!activeReservasi ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Scheduling section */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {currentUser && (
                <JadwalLapangan
                  currentUserId={currentUser.id}
                  currentUserEmail={currentUser.email}
                  selectedSlots={selectedSlots}
                  onSlotSelect={handleSlotSelect}
                />
              )}
            </div>

            {/* Right Summary Basket */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-cards p-6 border border-silver sticky top-6 shadow-sm">
                <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Rincian Sewa</span>
                <h3 className="font-cal-sans text-subheading font-semibold text-graphite mt-1 mb-6">Pilihan Lapangan</h3>

                {selectedSlots.length === 0 ? (
                  <div className="py-8 text-center text-slate text-body-sm border border-dashed border-silver rounded-cards flex flex-col items-center gap-2">
                    <Info className="w-5 h-5 text-stone" />
                    <span className="font-medium">Belum ada slot terpilih. Klik jam operasional lapangan.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {selectedSlots.map((slot, index) => (
                      <div key={index} className="bg-paper p-4 rounded-inputs border border-silver flex flex-col gap-1">
                        <div className="flex justify-between items-start">
                          <span className="text-body-sm font-bold text-graphite">{slot.lapanganNama}</span>
                          <span className="text-xs text-ink font-semibold">{slot.jamMulai} - {slot.jamSelesai}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate font-medium capitalize">
                          <span>{slot.tanggal} ({slot.jenis})</span>
                          <span>Rp {slot.harga.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    ))}

                    <div className="border-t border-silver pt-4 mt-2 flex justify-between items-center">
                      <span className="text-body-sm text-slate font-semibold">Total Tarif Sewa</span>
                      <span className="text-body font-bold text-ink">
                        Rp {selectedSlots.reduce((sum, s) => sum + s.harga, 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {errorMsg && (
                      <div className="text-xs text-red-700 bg-red-50 p-3 rounded-inputs border border-red-200 font-medium">
                        {errorMsg}
                      </div>
                    )}

                    <button
                      onClick={handleCheckoutClick}
                      disabled={loading}
                      className="w-full mt-4 py-3 bg-ink text-white rounded-tags text-body-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {loading ? 'Memproses...' : 'Proses Booking'}
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Payment Processing view */
          <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-cards text-action-blue text-body-sm flex items-center gap-3 font-semibold shadow-sm">
              <CheckCircle className="w-5 h-5 text-action-blue flex-shrink-0" />
              <div>
                <span className="font-bold block">Reservasi Berhasil Dibuat!</span>
                Lakukan transfer nominal sesuai instruksi di bawah ini untuk memverifikasi pesanan.
              </div>
            </div>

            <CardPembayaran
              reservasi={activeReservasi}
              transaksi={activeTransaksi}
              onUploadSuccess={() => {
                setActiveReservasi(prev => ({ ...prev, status: 'menunggu_verifikasi' }));
              }}
            />

            <div className="flex justify-center mt-2">
              <Link
                to="/riwayat"
                className="px-6 py-3 bg-white border border-silver hover:bg-paper text-graphite rounded-tags text-body-sm font-semibold transition-all cursor-pointer shadow-sm"
              >
                Lihat Semua Riwayat Booking
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation popup */}
      <ModalKonfirmasi
        isOpen={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirmBooking}
        bookingDetails={selectedSlots}
      />
    </div>
  );
}
