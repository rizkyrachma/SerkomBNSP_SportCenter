import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, ClipboardList, LayoutDashboard, Settings, LogOut, ShieldAlert, UserCheck, Sparkles, CreditCard, DollarSign } from 'lucide-react';

export default function Navbar() {
  const { user, profile, role, logout, isConfigured, loginAsDemo } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClass = (path) => {
    const active = location.pathname === path;
    return `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
      active
        ? 'bg-[#145aff] text-white shadow-sm'
        : 'text-[#374151] hover:text-[#145aff] hover:bg-[#f0f4fe]'
    }`;
  };

  return (
    <header className="sticky top-0 z-50 bg-[#fcfcfc]/90 backdrop-blur-md border-b border-[#e2e8f0]">
      <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo - Relate Style */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-[#145aff] flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
            S
          </div>
          <div>
            <span className="font-semibold text-[#020520] tracking-tight text-base block leading-none">
              SM Sport Center
            </span>
            <span className="text-[11px] text-[#6b7280] font-mono tracking-wide">
              {role === 'admin' ? 'ADMIN PORTAL' : 'RESERVASI LAPANGAN'}
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-2">
          {user ? (
            role === 'admin' ? (
              <>
                <Link to="/admin/dashboard" className={navItemClass('/admin/dashboard')}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link to="/admin/reservasi" className={navItemClass('/admin/reservasi')}>
                  <ClipboardList className="w-4 h-4" />
                  Kelola Reservasi
                </Link>
                <Link to="/admin/lapangan" className={navItemClass('/admin/lapangan')}>
                  <Settings className="w-4 h-4" />
                  Kelola Lapangan
                </Link>
                <Link to="/admin/keuangan" className={navItemClass('/admin/keuangan')}>
                  <DollarSign className="w-4 h-4" />
                  Laporan Keuangan
                </Link>
              </>
            ) : (
              <>
                <Link to="/pelanggan/jadwal" className={navItemClass('/pelanggan/jadwal')}>
                  <Calendar className="w-4 h-4" />
                  Jadwal & Ketersediaan
                </Link>
                <Link to="/pelanggan/riwayat" className={navItemClass('/pelanggan/riwayat')}>
                  <ClipboardList className="w-4 h-4" />
                  Booking Saya
                </Link>
                <Link to="/pelanggan/transaksi" className={navItemClass('/pelanggan/transaksi')}>
                  <CreditCard className="w-4 h-4" />
                  Riwayat Transaksi
                </Link>
              </>
            )
          ) : (
            <>
              <Link to="/login" className={navItemClass('/login')}>Masuk</Link>
              <Link to="/register" className="px-5 py-2 rounded-full bg-[#145aff] text-white text-sm font-medium hover:bg-[#0042e6] transition-all shadow-sm">
                Daftar Pelanggan
              </Link>
            </>
          )}
        </nav>

        {/* User Status & Quick Role Switcher for Demo */}
        <div className="flex items-center gap-3">
          {!isConfigured && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0f4fe] border border-[#145aff]/20 text-[11px] text-[#145aff] font-mono">
              <Sparkles className="w-3 h-3" />
              <span>Demo Storage Aktif</span>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-[#020520] leading-tight">
                  {profile?.nama || user.email}
                </span>
                <span className="text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#f0f4fe] text-[#145aff] border border-[#145aff]/30">
                  {role === 'admin' ? 'Administrator' : 'Pelanggan'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Keluar / Ganti Akun"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-[#e2e8f0] text-xs font-medium text-[#374151] hover:bg-[#f1f5f9] hover:text-[#f26052] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
