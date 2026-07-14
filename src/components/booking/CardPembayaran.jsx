import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Clock, Upload, CheckCircle, AlertTriangle, CreditCard, QrCode } from 'lucide-react';

export default function CardPembayaran({ reservasi: rawReservasi, transaksi: rawTransaksi, onUploadSuccess }) {
  const reservasi = rawReservasi || {};
  const txObj = Array.isArray(rawTransaksi) ? rawTransaksi[0] : rawTransaksi;
  const transaksi = txObj || {
    id: reservasi?.id || 'tx-fallback',
    reservasi_id: reservasi?.id,
    kode_unik: 100,
    jumlah_bayar: Number(reservasi?.total_harga || 0),
    metode_pembayaran: 'transfer_bank',
    status_verifikasi: 'menunggu',
    batas_waktu_bayar: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  };

  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transfer_bank');

  useEffect(() => {
    if (!transaksi?.batas_waktu_bayar || isExpired) return;

    const calculateTimeLeft = () => {
      const difference = new Date(transaksi.batas_waktu_bayar) - new Date();
      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft('Waktu Pembayaran Habis');
        return;
      }

      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      setTimeLeft(
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [transaksi?.batas_waktu_bayar, isExpired]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Format file tidak valid. Harap unggah gambar JPG, JPEG, atau PNG.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `bukti_${Date.now()}.${fileExt}`;
      const sessionUser = (await supabase.auth.getUser()).data.user;
      
      if (!sessionUser) throw new Error('User tidak terautentikasi.');

      const storagePath = `${sessionUser.id}/${reservasi.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('bukti-transfer')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // Cek apakah baris transaksi sudah ada di database
      let { data: existingTx } = (transaksi.id && !transaksi.id.toString().startsWith('res-') && !transaksi.id.toString().startsWith('tx-'))
        ? await supabase.from('transaksi').select('id').eq('id', transaksi.id).maybeSingle()
        : await supabase.from('transaksi').select('id').eq('reservasi_id', reservasi.id).maybeSingle();

      if (!existingTx && reservasi.id) {
        const { data: byResId } = await supabase.from('transaksi').select('id').eq('reservasi_id', reservasi.id).maybeSingle();
        existingTx = byResId;
      }

      let updateError = null;
      if (existingTx?.id) {
        const res = await supabase.from('transaksi').update({
          bukti_transfer_url: storagePath,
          status_verifikasi: 'menunggu'
        }).eq('id', existingTx.id);
        updateError = res.error;
      } else {
        const res = await supabase.from('transaksi').upsert({
          id: (transaksi.id && !transaksi.id.toString().startsWith('res-') && !transaksi.id.toString().startsWith('tx-fallback')) ? transaksi.id : undefined,
          reservasi_id: reservasi.id,
          kode_unik: Number(transaksi.kode_unik) || 100,
          jumlah_bayar: Number(transaksi.jumlah_bayar || reservasi.total_harga || 0),
          metode_pembayaran: transaksi.metode_pembayaran || 'transfer_bank',
          bukti_transfer_url: storagePath,
          status_verifikasi: 'menunggu',
          batas_waktu_bayar: transaksi.batas_waktu_bayar || new Date(Date.now() + 60 * 60 * 1000).toISOString()
        }, { onConflict: 'reservasi_id' });
        updateError = res.error;
      }

      if (updateError) throw updateError;

      await supabase
        .from('reservasi')
        .update({ status: 'menunggu_verifikasi' })
        .eq('id', reservasi.id);

      setSuccessMsg('Bukti transfer berhasil diunggah! Status reservasi Anda sekarang menunggu verifikasi admin.');
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error('Upload bukti error:', err);
      let msg = err?.message || 'Gagal mengunggah bukti pembayaran.';
      if (msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('violates row-level') || msg.includes('403')) {
        msg = 'Gagal mengunggah karena izin (Row-Level Security) Supabase Storage / Tabel belum diatur. Harap jalankan skrip SQL di file supabase/migrations/fix_storage_and_rls.sql pada dashboard Supabase Anda.';
      }
      setErrorMsg(msg);
    } finally {
      setUploading(false);
    }
  };

  const hargaNominal = Number(reservasi.total_harga);
  const totalBayar = Number(transaksi.jumlah_bayar);

  const isPendingVerification = reservasi.status === 'menunggu_verifikasi';
  const isConfirmed = reservasi.status === 'terkonfirmasi';

  if (isConfirmed) {
    return (
      <div className="bg-white border border-silver p-8 rounded-cards shadow-sm flex flex-col items-center gap-4 text-center">
        <CheckCircle className="w-16 h-16 text-action-blue bg-info-banner-bg rounded-full p-2" />
        <span className="font-cal-sans text-caption tracking-tight uppercase text-slate font-semibold">Transaksi Selesai</span>
        <h3 className="font-cal-sans text-subheading font-semibold text-graphite">Pembayaran Terverifikasi</h3>
        <p className="text-body-sm text-slate max-w-sm font-medium">
          Reservasi Anda untuk {reservasi.lapangan?.nama} pada tanggal {reservasi.tanggal} sudah terkonfirmasi. Silakan unduh bukti pembayaran.
        </p>
      </div>
    );
  }

  if (isPendingVerification) {
    return (
      <div className="bg-white border border-silver p-8 rounded-cards shadow-sm flex flex-col items-center gap-4 text-center">
        <Clock className="w-16 h-16 text-action-blue animate-pulse" />
        <span className="font-cal-sans text-caption tracking-tight uppercase text-action-blue font-semibold">Proses Verifikasi</span>
        <h3 className="font-cal-sans text-subheading font-semibold text-graphite">Menunggu Verifikasi Admin</h3>
        <p className="text-body-sm text-slate max-w-sm font-medium">
          Bukti transfer Anda telah diterima dan sedang dicocokkan dengan mutasi rekening kami. Mohon tunggu beberapa saat.
        </p>
      </div>
    );
  }

  if (isExpired || reservasi.status === 'kedaluwarsa') {
    return (
      <div className="bg-white border border-silver p-8 rounded-cards shadow-sm flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500" />
        <span className="font-cal-sans text-caption tracking-tight uppercase text-red-500 font-semibold">Kedaluwarsa</span>
        <h3 className="font-cal-sans text-subheading font-semibold text-graphite">Waktu Pembayaran Habis</h3>
        <p className="text-body-sm text-slate max-w-sm font-medium">
          Reservasi Anda otomatis dibatalkan karena tidak ada bukti pembayaran yang diterima hingga batas waktu yang ditentukan.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-cards border border-silver shadow-sm overflow-hidden flex flex-col">
      {/* Top Banner with Countdown */}
      <div className="bg-paper px-6 py-4 border-b border-silver flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Clock className="text-ink w-5 h-5" />
          <span className="text-body-sm font-bold text-graphite">Selesaikan Pembayaran Dalam:</span>
        </div>
        <span className="font-cal-sans text-body font-bold text-action-blue tracking-wider bg-white px-4 py-2 rounded-inputs border border-silver shadow-sm">
          {timeLeft}
        </span>
      </div>

      <div className="p-6 md:p-8 flex flex-col gap-6 text-left">
        {/* Price Invoice style card */}
        <div className="bg-paper p-6 rounded-cards border border-silver flex flex-col gap-4">
          <div className="flex justify-between items-center text-body-sm text-slate font-semibold border-b border-silver pb-4">
            <span>Biaya Sewa Lapangan</span>
            <span>Rp {hargaNominal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-body-sm font-bold text-graphite">Total Transfer Pas</span>
            <span className="text-heading font-mono font-bold text-ink">
              Rp {totalBayar.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Payment Method Switcher */}
        <div className="flex bg-paper p-1 rounded-tags border border-silver">
          <button
            type="button"
            onClick={() => setPaymentMethod('transfer_bank')}
            className={`flex-1 py-2 text-body-sm font-semibold flex items-center justify-center gap-2 rounded-tags cursor-pointer transition-all ${
              paymentMethod === 'transfer_bank'
                ? 'bg-ink text-white shadow-sm'
                : 'text-slate hover:text-graphite'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Transfer Bank
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('qris')}
            className={`flex-1 py-2 text-body-sm font-semibold flex items-center justify-center gap-2 rounded-tags cursor-pointer transition-all ${
              paymentMethod === 'qris'
                ? 'bg-ink text-white shadow-sm'
                : 'text-slate hover:text-graphite'
            }`}
          >
            <QrCode className="w-4 h-4" />
            QRIS Statis
          </button>
        </div>

        {/* Payment Instruction */}
        {paymentMethod === 'transfer_bank' ? (
          <div className="flex flex-col gap-3">
            <p className="text-body-sm text-slate font-medium">
              Silakan transfer nominal di atas ke salah satu rekening Bank resmi SM Sport Center berikut:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-inputs border border-silver shadow-sm">
                <span className="text-body-sm font-bold text-graphite">BANK MANDIRI</span>
                <p className="font-mono text-body font-bold text-ink mt-1">123-000-456-7890</p>
                <span className="text-[10px] text-slate font-medium">a/n SM Sport Center</span>
              </div>
              <div className="bg-white p-4 rounded-inputs border border-silver shadow-sm">
                <span className="text-body-sm font-bold text-graphite">BANK BCA</span>
                <p className="font-mono text-body font-bold text-ink mt-1">862-555-1234</p>
                <span className="text-[10px] text-slate font-medium">a/n SM Sport Center</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-body-sm text-slate font-medium text-center">
              Scan QRIS resmi SM Sport Center menggunakan dompet digital Anda (Gopay, OVO, Dana, LinkAja, BCA, dll):
            </p>
            <div className="bg-white p-4 rounded-cards border border-silver max-w-[200px] shadow-sm">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=SM_SPORT_CENTER_MOCK_PAYMENT"
                alt="QRIS QR Code"
                className="w-full aspect-square"
              />
            </div>
            <span className="text-[10px] text-slate font-medium">GPN - Terdaftar Resmi</span>
          </div>
        )}

        <div className="border-t border-silver pt-6">
          <h4 className="text-body-sm font-bold text-graphite mb-3">Upload Bukti Transfer</h4>
          
          <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-silver hover:border-slate rounded-cards cursor-pointer transition-all bg-paper">
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-slate font-semibold">
                <div className="w-8 h-8 border-2 border-silver border-t-ink rounded-full animate-spin"></div>
                <span className="text-body-sm">Mengunggah file...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate text-center font-medium">
                <Upload className="w-8 h-8 text-slate mb-1" />
                <span className="text-body-sm font-bold text-graphite">Pilih file bukti transfer</span>
                <span className="text-xs text-stone">Format: JPG, JPEG, PNG (Maksimal 5MB)</span>
              </div>
            )}
          </label>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-4 rounded-inputs text-body-sm font-medium">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-action-blue p-4 rounded-inputs text-body-sm font-semibold shadow-sm">
            <CheckCircle className="w-5 h-5 text-action-blue flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
