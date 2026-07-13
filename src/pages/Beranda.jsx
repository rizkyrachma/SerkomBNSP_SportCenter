import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Shield, Sparkles, LogOut, User, ArrowRight, CalendarDays, CheckCircle2 } from 'lucide-react';

export default function Beranda() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [userName, setUserName] = useState('');
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session: curSession } } = await supabase.auth.getSession();
      setSession(curSession);
      if (curSession?.user) {
        setUserName(curSession.user.user_metadata?.nama || 'Pelanggan');
      }
    };
    fetchSession();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-paper text-graphite flex flex-col font-cal-sans-ui-variable-light">
      {/* Informational Banner: Info Banner BG (#eff6fe) & Action Blue (#0099ff) text */}
      {showBanner && (
        <div className="bg-info-banner-bg border-b border-silver/50 px-6 py-2.5 flex items-center justify-between text-body-sm font-semibold transition-all">
          <span className="mx-auto flex items-center gap-2 text-action-blue">
            <Sparkles className="w-4 h-4" />
            Promo Spesial: Sewa Lapangan Futsal Diskon 20% khusus hari Minggu!
          </span>
          <button 
            onClick={() => setShowBanner(false)}
            className="text-slate hover:text-graphite font-bold text-lg cursor-pointer leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* Navigation Header: Paper Background, Silver Divider */}
      <nav className="w-full bg-paper border-b border-silver/50 py-4 px-6 md:px-12 flex justify-between items-center max-w-[1200px] mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-ink" />
          <span className="font-cal-sans text-subheading font-semibold tracking-tight text-graphite">
            SM SPORT CENTER
          </span>
        </Link>

        {/* Navigation Links: Cal Sans UI at 14px, no underline */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-ink font-semibold text-body-sm">Beranda</Link>
          <Link to="/reservasi" className="text-slate hover:text-graphite font-semibold transition-colors text-body-sm">Sewa Lapangan</Link>
          <Link to="/riwayat" className="text-slate hover:text-graphite font-semibold transition-colors text-body-sm">Riwayat Booking</Link>
        </div>

        {/* Profile Cluster */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white border border-silver px-3.5 py-1.5 rounded-tags text-body-sm shadow-sm">
            <User className="w-4 h-4 text-slate" />
            <span className="text-graphite font-semibold max-w-[100px] truncate">{userName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 border border-silver hover:border-ink hover:bg-white text-slate hover:text-graphite rounded-full transition-all cursor-pointer shadow-sm"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 md:px-12 py-16 flex flex-col gap-20">
        
        {/* Hero Section: Centered Stack or grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="flex flex-col gap-6 items-start">
            <span className="font-cal-sans-ui-variable-light text-caption tracking-tight text-slate uppercase bg-white border border-silver px-3 py-1 rounded-tags shadow-sm font-semibold">
              SISTEM RESERVASI LSP ANALIS PROGRAM
            </span>
            <h1 className="font-cal-sans text-4xl md:text-5xl lg:text-[56px] font-semibold leading-[1.15] text-graphite tracking-tight">
              Sewa Lapangan Tanpa Bentrok Jadwal.
            </h1>
            <p className="text-body text-slate leading-relaxed max-w-lg font-medium">
              SM Sport Center menyediakan platform pemesanan lapangan olahraga terpadu secara real-time. Periksa ketersediaan jadwal, amankan slot main Anda, dan selesaikan transaksi dengan instan.
            </p>
            {/* Pill-shaped Buttons: 9999px radius */}
            <div className="flex flex-wrap gap-4 mt-2">
              <Link
                to="/reservasi"
                className="px-8 py-4 bg-ink text-white rounded-tags text-body-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                Mulai Sewa Lapangan
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/riwayat"
                className="px-8 py-4 bg-white border border-silver text-graphite rounded-tags text-body-sm font-semibold hover:bg-paper transition-all cursor-pointer shadow-sm"
              >
                Lihat Riwayat Sewa
              </Link>
            </div>
          </div>

          {/* Hero Right Content: Product Mockup Card */}
          <div className="w-full relative aspect-square max-w-[450px] mx-auto lg:max-w-none flex items-center justify-center">
            {/* Background blur decoration */}
            <div className="absolute inset-0 bg-silver/20 rounded-full blur-3xl"></div>
            
            {/* White Cards: 12px radius, subtle shadow */}
            <div className="relative w-full flex flex-col gap-4">
              <div className="bg-white border border-silver p-5 rounded-cards shadow-sm transform rotate-[-3deg] hover:rotate-0 transition-transform duration-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-cal-sans text-caption font-semibold text-slate">Lapangan Futsal A</span>
                  <span className="text-[10px] text-stone font-semibold">Tersedia</span>
                </div>
                <h3 className="font-cal-sans text-subheading font-semibold text-graphite">Lapangan Futsal 1</h3>
                <div className="flex gap-2 mt-4">
                  <span className="text-[11px] bg-paper border border-silver px-2 py-1 rounded text-slate">08:00 WIB</span>
                  <span className="text-[11px] bg-ink text-white px-2 py-1 rounded">09:00 WIB</span>
                  <span className="text-[11px] bg-paper border border-silver px-2 py-1 rounded text-slate">10:00 WIB</span>
                </div>
              </div>

              <div className="bg-white border border-silver p-5 rounded-cards shadow-sm transform rotate-[3deg] hover:rotate-0 transition-transform duration-300 z-10">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-cal-sans text-caption font-semibold text-slate">Lapangan Badminton A</span>
                  <span className="text-[10px] text-action-blue font-semibold">Aktif</span>
                </div>
                <h3 className="font-cal-sans text-subheading font-semibold text-graphite">Lapangan Badminton 1</h3>
                <div className="flex gap-2 mt-4">
                  <span className="text-[11px] bg-ink text-white px-2 py-1 rounded">08:00 WIB</span>
                  <span className="text-[11px] bg-ink text-white px-2 py-1 rounded">09:00 WIB</span>
                  <span className="text-[11px] bg-ink text-white px-2 py-1 rounded">10:00 WIB</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section: floating metrics in Poppins */}
        <section className="py-10 border-y border-silver grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="flex flex-col gap-1">
            <span className="font-cal-sans text-subheading md:text-subheading font-semibold text-graphite">5 Lapangan</span>
            <span className="text-caption text-slate uppercase font-medium tracking-tight">Kapasitas Maksimal</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-cal-sans text-subheading md:text-subheading font-semibold text-graphite">10 Menit</span>
            <span className="text-caption text-slate uppercase font-medium tracking-tight">Kunci Ketersediaan</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-cal-sans text-subheading md:text-subheading font-semibold text-graphite">1 Jam</span>
            <span className="text-caption text-slate uppercase font-medium tracking-tight">Batas Bayar</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-cal-sans text-subheading md:text-subheading font-semibold text-graphite">Real Time</span>
            <span className="text-caption text-slate uppercase font-medium tracking-tight">Update Status</span>
          </div>
        </section>

        {/* Call to Action banner card */}
        <section className="bg-white border border-silver rounded-cards p-8 md:p-12 text-graphite flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm">
          <div className="flex flex-col gap-2 max-w-lg text-left">
            <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Tersedia Sekarang</span>
            <h2 className="font-cal-sans text-heading font-semibold text-graphite leading-tight">
              Ingin langsung bermain hari ini?
            </h2>
            <p className="text-body text-slate font-medium">
              Silakan periksa jadwal kosong lapangan futsal dan badminton kami sekarang. Proses pemesanan hanya butuh waktu kurang dari 2 menit.
            </p>
          </div>
          <Link
            to="/reservasi"
            className="w-full md:w-auto px-8 py-4 bg-ink text-white rounded-tags text-body-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            Pesan Lapangan Sekarang
            <ArrowRight className="w-4 h-4 text-action-blue" />
          </Link>
        </section>
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
