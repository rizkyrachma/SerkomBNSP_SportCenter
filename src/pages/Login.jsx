import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Shield, Mail, Lock, User, Phone, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [noTelepon, setNoTelepon] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    };
    checkUser();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!nama || !noTelepon) {
          throw new Error('Harap lengkapi semua kolom.');
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nama,
              no_telepon: noTelepon
            }
          }
        });

        if (error) throw error;
        
        setSuccessMsg('Pendaftaran berhasil! Akun Anda telah dibuat.');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        const sessionUser = data.session.user;
        const userRole = sessionUser.app_metadata?.role;
        
        if (userRole === 'admin' || userRole === 'superadmin') {
          navigate('/admin');
        } else {
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      {/* Container: Cal.com 12px radius, White background, subtle shadow */}
      <div className="w-full max-w-md bg-white rounded-cards border border-silver shadow-sm overflow-hidden flex flex-col">
        {/* Top Branding Section */}
        <div className="px-6 pt-8 pb-4 text-center flex flex-col items-center gap-3">
          <div className="p-3 bg-paper rounded-full border border-silver">
            <Shield className="w-8 h-8 text-ink" />
          </div>
          <h1 className="font-cal-sans text-heading font-semibold text-graphite tracking-tight mt-1">
            SM Sport Center
          </h1>
          <p className="text-body-sm text-slate tracking-tight -mt-1 font-medium">
            Sistem Reservasi Lapangan Terpadu
          </p>
        </div>

        {/* Tab Switcher: Pill-shape 9999px radius */}
        <div className="px-6 md:px-8">
          <div className="flex bg-paper p-1 rounded-tags border border-silver">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 text-body-sm font-semibold transition-all rounded-tags cursor-pointer ${
                !isRegister 
                  ? 'bg-ink text-white shadow-sm' 
                  : 'text-slate hover:text-graphite'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 text-body-sm font-semibold transition-all rounded-tags cursor-pointer ${
                isRegister 
                  ? 'bg-ink text-white shadow-sm' 
                  : 'text-slate hover:text-graphite'
              }`}
            >
              Daftar Akun
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-body-sm text-graphite font-medium">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Budi Santoso"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="bg-white border border-silver rounded-inputs px-4 py-2.5 text-graphite focus:outline-none focus:border-ink text-body-sm placeholder:text-stone font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-body-sm text-graphite font-medium">Nomor Telepon / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={noTelepon}
                    onChange={(e) => setNoTelepon(e.target.value)}
                    className="bg-white border border-silver rounded-inputs px-4 py-2.5 text-graphite focus:outline-none focus:border-ink text-body-sm placeholder:text-stone font-medium"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-body-sm text-graphite font-medium">Alamat Email</label>
              <input
                type="email"
                required
                placeholder="nama@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border border-silver rounded-inputs px-4 py-2.5 text-graphite focus:outline-none focus:border-ink text-body-sm placeholder:text-stone font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-body-sm text-graphite font-medium">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white border border-silver rounded-inputs px-4 py-2.5 text-graphite focus:outline-none focus:border-ink text-body-sm placeholder:text-stone font-medium"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-inputs text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-action-blue p-3.5 rounded-inputs text-xs font-medium">
                <CheckCircle className="w-4 h-4 text-action-blue flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 bg-ink text-white rounded-buttons text-body-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isRegister ? 'Buat Akun' : 'Masuk ke Sistem'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick seeded login notice */}
          <div className="mt-4 pt-4 border-t border-silver text-[11px] text-slate leading-relaxed">
            <span className="font-semibold text-graphite block mb-1">MOCK LOGIN TEST CREDENTIALS:</span>
            <ul className="list-disc pl-4 space-y-1">
              <li>Pelanggan: <span className="font-mono text-ink">pelanggan@gmail.com</span> / password: <span className="font-mono text-ink">password</span></li>
              <li>Admin: <span className="font-mono text-ink">admin@smsportcenter.com</span> / password: <span className="font-mono text-ink">password</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
