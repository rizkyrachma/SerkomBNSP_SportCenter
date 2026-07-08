import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, ShieldCheck, UserCheck, Sparkles, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('rizky@gmail.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loginAsDemo, isConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const { profile } = await login(email, password);
      if (profile?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/pelanggan/jadwal');
      }
    } catch (err) {
      setError(err.message || 'Gagal login. Periksa email dan password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = (role) => {
    loginAsDemo(role);
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/pelanggan/jadwal');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f0f4fe] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Floating Relate Card */}
        <div className="bg-white rounded-[28px] border border-[#e2e8f0] p-8 shadow-[rgba(20,90,255,0.08)_0px_20px_50px_-12px,rgba(0,0,0,0.05)_0px_4px_12px_-2px]">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#145aff] text-white flex items-center justify-center font-bold text-2xl mx-auto mb-4 shadow-sm">
              S
            </div>
            <h1 className="text-3xl font-semibold text-[#020520] tracking-tight">
              Masuk ke <span className="text-[#145aff]">SM Sport</span>
            </h1>
            <p className="text-sm text-[#6b7280] mt-2">
              Sistem Reservasi Lapangan Futsal & Badminton Tanpa Jadwal Bentrok
            </p>
          </div>

          {/* Quick Demo Access Bar (Sangat Membantu Evaluator Penguji) */}
          {!isConfigured && (
            <div className="mb-6 p-4 rounded-2xl bg-[#f0f4fe] border border-[#145aff]/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#145aff] mb-2.5">
                <Sparkles className="w-4 h-4" />
                <span>Uji Coba Cepat Prototipe (Pilih Role):</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin')}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-[#145aff] text-white text-xs font-medium hover:bg-[#0042e6] transition-all shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Masuk sbg Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('pelanggan')}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-white border border-[#145aff] text-[#145aff] text-xs font-medium hover:bg-[#f0f4fe] transition-all"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Masuk sbg Pelanggan
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-[#fef2f2] border border-[#f87171] flex items-center gap-2.5 text-xs text-[#b91c1c]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">
                Email Pengguna
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="w-full px-4 py-3 rounded-xl bg-[#fcfcfc] border border-[#e2e8f0] text-sm text-[#14141e] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#145aff] focus:ring-2 focus:ring-[#0099ff]/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-[#fcfcfc] border border-[#e2e8f0] text-sm text-[#14141e] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#145aff] focus:ring-2 focus:ring-[#0099ff]/30 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-full bg-[#145aff] text-white font-medium text-sm hover:bg-[#0042e6] disabled:opacity-60 transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Memeriksa Akun...' : 'Masuk Sekarang'}</span>
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-6 pt-6 border-t border-[#e2e8f0] text-center text-xs text-[#6b7280]">
            Belum punya akun pelanggan?{' '}
            <Link to="/register" className="font-semibold text-[#145aff] hover:underline">
              Daftar Akun Baru
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
