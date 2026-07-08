import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, ShieldCheck, CheckCircle2, ArrowRight, Sparkles, Trophy, Users, Clock } from 'lucide-react';

export default function Home() {
  const { user, role, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const handleQuickEnter = (selectedRole) => {
    loginAsDemo(selectedRole);
    if (selectedRole === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/pelanggan/jadwal');
    }
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      {/* Hero Section - Relate Style */}
      <section className="pt-16 pb-24 px-4 bg-gradient-to-b from-[#f0f4fe]/60 via-[#fcfcfc] to-[#fcfcfc]">
        <div className="max-w-[1000px] mx-auto text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#145aff]/30 shadow-xs mb-6">
            <Sparkles className="w-4 h-4 text-[#145aff]" />
            <span className="text-xs font-semibold text-[#020520]">
              Sistem Reservasi Olahraga Generasi Baru
            </span>
          </div>

          {/* Headline (Inter tight tracking -1.51px) */}
          <h1 className="text-4xl sm:text-6xl font-semibold text-[#020520] tracking-[-0.035em] leading-[1.08] mb-6">
            Reservasi Lapangan Olahraga <br />
            Tanpa <span className="text-[#145aff]">Jadwal Bentrok</span>.
          </h1>

          <p className="text-base sm:text-lg text-[#374151] max-w-[640px] mx-auto leading-relaxed mb-10">
            SM Sport Center menyediakan 2 Lapangan Futsal standar turnamen dan 3 Lapangan Badminton berkarpet pro. Pesan secara real-time dari jam 08:00 hingga 23:00 dengan kepastian anti-double booking.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <Link
                to={role === 'admin' ? '/admin/dashboard' : '/pelanggan/jadwal'}
                className="px-8 py-4 rounded-full bg-[#145aff] text-white font-medium text-sm hover:bg-[#0042e6] transition-all shadow-sm flex items-center gap-2"
              >
                <span>Masuk ke {role === 'admin' ? 'Portal Admin' : 'Jadwal Booking'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <button
                  onClick={() => handleQuickEnter('pelanggan')}
                  className="px-8 py-4 rounded-full bg-[#145aff] text-white font-medium text-sm hover:bg-[#0042e6] transition-all shadow-sm flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Coba Booking Sekarang (Demo Pelanggan)</span>
                </button>
                <button
                  onClick={() => handleQuickEnter('admin')}
                  className="px-8 py-4 rounded-full bg-white border border-[#145aff] text-[#145aff] font-medium text-sm hover:bg-[#f0f4fe] transition-all flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Masuk sebagai Admin Demo</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Feature Section Cards (Relate SaaS Layout) */}
      <section className="max-w-[1200px] mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="bg-white rounded-[28px] border border-[#e2e8f0] p-8 shadow-xs hover:shadow-sm transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#f0f4fe] text-[#145aff] flex items-center justify-center mb-6">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-[#020520] mb-2">
              Grid Operasional 08:00–23:00
            </h3>
            <p className="text-sm text-[#6b7280] leading-relaxed">
              Jadwal tersinkronisasi real-time. Slot jam yang sudah dipesan otomatis terkunci sehingga tidak ada jadwal tumpang tindih.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-[28px] border border-[#e2e8f0] p-8 shadow-xs hover:shadow-sm transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#f0f4fe] text-[#145aff] flex items-center justify-center mb-6">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-[#020520] mb-2">
              5 Fasilitas Lapangan Unggulan
            </h3>
            <p className="text-sm text-[#6b7280] leading-relaxed">
              2 Lapangan Futsal Vinyl & Sintetis Pro serta 3 Lapangan Badminton Karpet Yonex & Parquet Kayu dengan harga transparan.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-[28px] border border-[#e2e8f0] p-8 shadow-xs hover:shadow-sm transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#f0f4fe] text-[#145aff] flex items-center justify-center mb-6">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-[#020520] mb-2">
              Simulasi Pembayaran Instan
            </h3>
            <p className="text-sm text-[#6b7280] leading-relaxed">
              Klik tombol "Bayar Sekarang" pada daftar pemesanan Anda untuk konfirmasi otomatis tanpa perlu verifikasi manual yang lambat.
            </p>
          </div>

        </div>
      </section>

      {/* Showcase Visual Fasilitas Lapangan */}
      <section className="max-w-[1200px] mx-auto px-4 pb-28">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold text-[#145aff] tracking-wider uppercase">
            ETALASE FASILITAS PRO
          </span>
          <h2 className="text-3xl font-semibold text-[#020520] tracking-tight mt-1">
            Fasilitas Futsal & Badminton Berstandar Turnamen
          </h2>
          <p className="text-sm text-[#6b7280] mt-2">
            Pilih lapangan favorit Anda dengan harga sewa transparan per jam dan spesifikasi lantai profesional
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Futsal Arena A */}
          <div className="bg-white rounded-[28px] border border-[#e2e8f0] overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col justify-between">
            <div>
              <div className="h-52 w-full relative overflow-hidden bg-[#f1f5f9]">
                <img
                  src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80"
                  alt="Futsal Arena A Vinyl"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-[#145aff] text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
                    ⚽ FUTSAL
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-[#020520] mb-1">
                  Futsal Arena A (Vinyl Standard Pro)
                </h3>
                <p className="text-xs text-[#6b7280] line-clamp-2">
                  Lantai vinyl standar FIFA dengan lampu LED 800 lux anti silau serta tribun penonton.
                </p>
              </div>
            </div>
            <div className="p-6 pt-0 flex items-center justify-between border-t border-[#f1f5f9] mt-2">
              <div>
                <span className="text-[10px] text-[#6b7280] block">Tarif Sewa</span>
                <span className="text-base font-mono font-bold text-[#145aff]">Rp 150.000 / jam</span>
              </div>
              <button
                onClick={() => handleQuickEnter('pelanggan')}
                className="px-4 py-2 rounded-full bg-[#f0f4fe] text-[#145aff] text-xs font-semibold hover:bg-[#145aff] hover:text-white transition-all"
              >
                Booking
              </button>
            </div>
          </div>

          {/* Badminton Court 1 */}
          <div className="bg-white rounded-[28px] border border-[#e2e8f0] overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col justify-between">
            <div>
              <div className="h-52 w-full relative overflow-hidden bg-[#f1f5f9]">
                <img
                  src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80"
                  alt="Badminton Court 1 Karpet Yonex"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-[#15803d] text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
                    🏸 BADMINTON
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-[#020520] mb-1">
                  Badminton Court 1 (Karpet Yonex Pro)
                </h3>
                <p className="text-xs text-[#6b7280] line-clamp-2">
                  Karpet badminton antislip profesional empuk untuk pendaratan kaki & pencahayaan merata.
                </p>
              </div>
            </div>
            <div className="p-6 pt-0 flex items-center justify-between border-t border-[#f1f5f9] mt-2">
              <div>
                <span className="text-[10px] text-[#6b7280] block">Tarif Sewa</span>
                <span className="text-base font-mono font-bold text-[#15803d]">Rp 65.000 / jam</span>
              </div>
              <button
                onClick={() => handleQuickEnter('pelanggan')}
                className="px-4 py-2 rounded-full bg-[#f0fdf4] text-[#15803d] text-xs font-semibold hover:bg-[#15803d] hover:text-white transition-all"
              >
                Booking
              </button>
            </div>
          </div>

          {/* Badminton Court 3 Kayu Parquet */}
          <div className="bg-white rounded-[28px] border border-[#e2e8f0] overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col justify-between">
            <div>
              <div className="h-52 w-full relative overflow-hidden bg-[#f1f5f9]">
                <img
                  src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80"
                  alt="Badminton Court 3 Parquet"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-[#15803d] text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
                    🏸 BADMINTON
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-[#020520] mb-1">
                  Badminton Court 3 (Lantai Kayu Parquet)
                </h3>
                <p className="text-xs text-[#6b7280] line-clamp-2">
                  Lantai kayu parquet klasik bertaraf internasional dengan sirkulasi udara indoor optimal.
                </p>
              </div>
            </div>
            <div className="p-6 pt-0 flex items-center justify-between border-t border-[#f1f5f9] mt-2">
              <div>
                <span className="text-[10px] text-[#6b7280] block">Tarif Sewa</span>
                <span className="text-base font-mono font-bold text-[#15803d]">Rp 60.000 / jam</span>
              </div>
              <button
                onClick={() => handleQuickEnter('pelanggan')}
                className="px-4 py-2 rounded-full bg-[#f0fdf4] text-[#15803d] text-xs font-semibold hover:bg-[#15803d] hover:text-white transition-all"
              >
                Booking
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
