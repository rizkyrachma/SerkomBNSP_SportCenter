import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import RiwayatBooking from '../components/profil/RiwayatBooking';
import CardPembayaran from '../components/booking/CardPembayaran';
import { Shield, ArrowLeft, User } from 'lucide-react';

export default function RiwayatReservasi() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  
  // Dynamic display state
  const [activePaymentBooking, setActivePaymentBooking] = useState(null);
  const [activePaymentTransaksi, setActivePaymentTransaksi] = useState(null);

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

  const handleSelectForPayment = (booking, transaksi) => {
    const bookingWithDetails = {
      ...booking,
      lapangan: booking.lapangan || { nama: 'Lapangan Olahraga', jenis: 'futsal' }
    };
    setActivePaymentBooking(bookingWithDetails);
    setActivePaymentTransaksi(transaksi);
  };

  const handleBackToList = () => {
    setActivePaymentBooking(null);
    setActivePaymentTransaksi(null);
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
          <Link to="/reservasi" className="text-slate hover:text-graphite font-semibold transition-colors text-body-sm">Sewa Lapangan</Link>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 md:px-12 py-12 flex flex-col gap-8">
        {activePaymentBooking ? (
          /* Payment details view */
          <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToList}
                className="p-2 bg-white border border-silver text-slate hover:text-graphite rounded-full transition-colors cursor-pointer shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex flex-col">
                <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Pembayaran</span>
                <h1 className="font-cal-sans text-heading font-semibold text-graphite">Penyelesaian Transaksi</h1>
              </div>
            </div>

            <CardPembayaran
              reservasi={activePaymentBooking}
              transaksi={activePaymentTransaksi}
              onUploadSuccess={() => {
                setActivePaymentBooking(prev => ({ ...prev, status: 'menunggu_verifikasi' }));
              }}
            />
          </div>
        ) : (
          /* General History list view */
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Link to="/" className="p-2 bg-white border border-silver text-slate hover:text-graphite rounded-full transition-colors cursor-pointer shadow-sm">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="flex flex-col">
                <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Profil Pelanggan</span>
                <h1 className="font-cal-sans text-heading font-semibold text-graphite">Riwayat Booking</h1>
              </div>
            </div>

            {currentUser && (
              <RiwayatBooking
                currentUserId={currentUser.id}
                onSelectForPayment={handleSelectForPayment}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-silver py-10 px-6 text-center text-xs text-slate mt-12">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-ink" />
            <span className="font-bold text-graphite font-cal-sans text-caption">SM Sport Center</span>
          </div>
          <p>&copy; 2026 SM Sport Center. LSP Sertifikasi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
