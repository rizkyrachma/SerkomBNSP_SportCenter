import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import DaftarVerifikasi from '../components/admin/DaftarVerifikasi';
import FormLapangan from '../components/admin/FormLapangan';
import LaporanTransaksi from '../components/admin/LaporanTransaksi';
import KelolaPelanggan from '../components/admin/KelolaPelanggan';
import KelolaReservasi from '../components/admin/KelolaReservasi';
import { Shield, CheckSquare, Settings, FileText, LogOut, User, Users, CalendarCheck } from 'lucide-react';
import ModalCardAlert from '../components/common/ModalCardAlert';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('verifikasi');
  const [modalCard, setModalCard] = useState(null);

  useEffect(() => {
    const fetchAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/login');
        return;
      }

      const userRole = session.user.app_metadata?.role;
      const userEmail = session.user.email;

      if (userRole === 'admin' || userRole === 'superadmin' || userEmail?.toLowerCase() === 'admin@smsportcenter.com') {
        setCurrentAdmin(session.user);
      } else {
        const { data: adminRow } = await supabase
          .from('admin')
          .select('*')
          .ilike('email', userEmail)
          .maybeSingle();

        if (adminRow) {
          setCurrentAdmin(session.user);
        } else {
          setModalCard({
            type: 'alert',
            title: 'Akses Ditolak',
            message: 'Akses ditolak. Halaman ini hanya untuk Administrator.',
            variant: 'danger',
            onConfirm: () => navigate('/'),
            onCancel: () => navigate('/')
          });
        }
      }
    };
    fetchAdmin();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-paper text-graphite flex flex-col font-cal-sans-ui-variable-light">
      {/* Navigation Header */}
      <nav className="w-full bg-white border-b border-silver/50 py-4 px-6 md:px-12 flex justify-between items-center max-w-[1200px] mx-auto">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-ink" />
          <span className="font-cal-sans text-subheading font-semibold tracking-tight text-graphite">ADMIN CONSOLE</span>
          <span className="text-[10px] bg-paper text-slate border border-silver px-2 py-0.5 rounded uppercase font-bold tracking-wider shadow-sm">
            Control Panel
          </span>
        </div>

        <div className="flex items-center gap-4">
          {currentAdmin && (
            <div className="flex items-center gap-2 bg-white border border-silver px-3.5 py-1.5 rounded-tags text-body-sm shadow-sm">
              <User className="w-4 h-4 text-slate" />
              <span className="text-graphite font-semibold max-w-[1200px] truncate">
                {currentAdmin.user_metadata?.nama || currentAdmin.email}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-2 border border-silver hover:border-ink hover:bg-white text-slate hover:text-graphite rounded-full transition-all cursor-pointer shadow-sm"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Panel */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 md:px-12 py-10 flex flex-col gap-10">
        {/* Tab Pill Navigation: 9999px tags */}
        <div className="flex flex-wrap gap-2 justify-center border-b border-silver pb-6">
          <button
            onClick={() => setActiveTab('verifikasi')}
            className={`px-6 py-2.5 font-semibold text-body-sm transition-all cursor-pointer flex items-center gap-2 rounded-tags ${activeTab === 'verifikasi'
              ? 'bg-ink text-white shadow-sm'
              : 'bg-white text-slate border border-silver hover:text-graphite hover:border-slate'
              }`}
          >
            <CheckSquare className="w-4 h-4 text-action-blue" />
            Verifikasi Pembayaran
          </button>

          <button
            onClick={() => setActiveTab('lapangan')}
            className={`px-6 py-2.5 font-semibold text-body-sm transition-all cursor-pointer flex items-center gap-2 rounded-tags ${activeTab === 'lapangan'
              ? 'bg-ink text-white shadow-sm'
              : 'bg-white text-slate border border-silver hover:text-graphite hover:border-slate'
              }`}
          >
            <Settings className="w-4 h-4 text-action-blue" />
            Kelola Lapangan
          </button>

          <button
            onClick={() => setActiveTab('laporan')}
            className={`px-6 py-2.5 font-semibold text-body-sm transition-all cursor-pointer flex items-center gap-2 rounded-tags ${activeTab === 'laporan'
              ? 'bg-ink text-white shadow-sm'
              : 'bg-white text-slate border border-silver hover:text-graphite hover:border-slate'
              }`}
          >
            <FileText className="w-4 h-4 text-action-blue" />
            Laporan Pendapatan
          </button>

          <button
            onClick={() => setActiveTab('pelanggan')}
            className={`px-6 py-2.5 font-semibold text-body-sm transition-all cursor-pointer flex items-center gap-2 rounded-tags ${activeTab === 'pelanggan'
              ? 'bg-ink text-white shadow-sm'
              : 'bg-white text-slate border border-silver hover:text-graphite hover:border-slate'
              }`}
          >
            <Users className="w-4 h-4 text-action-blue" />
            Kelola Pelanggan
          </button>

          <button
            onClick={() => setActiveTab('reservasi')}
            className={`px-6 py-2.5 font-semibold text-body-sm transition-all cursor-pointer flex items-center gap-2 rounded-tags ${activeTab === 'reservasi'
              ? 'bg-ink text-white shadow-sm'
              : 'bg-white text-slate border border-silver hover:text-graphite hover:border-slate'
              }`}
          >
            <CalendarCheck className="w-4 h-4 text-action-blue" />
            Riwayat Transaksi
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="w-full">
          {activeTab === 'verifikasi' && currentAdmin && (
            <DaftarVerifikasi currentAdminId={currentAdmin.id} />
          )}
          {activeTab === 'lapangan' && (
            <FormLapangan />
          )}
          {activeTab === 'laporan' && (
            <LaporanTransaksi />
          )}
          {activeTab === 'pelanggan' && (
            <KelolaPelanggan />
          )}
          {activeTab === 'reservasi' && (
            <KelolaReservasi />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-silver py-8 px-6 text-center text-xs text-slate">
        <p>&copy; 2026 SM Sport Center. LSP Sertifikasi. Admin Control Console.</p>
      </footer>
      <ModalCardAlert card={modalCard} onClose={() => setModalCard(null)} />
    </div>
  );
}
