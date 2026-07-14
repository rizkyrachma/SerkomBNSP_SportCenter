import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Download, CheckCircle, FileText } from 'lucide-react';
import ModalCardAlert from '../common/ModalCardAlert';

export default function BuktiPembayaranUnduh({ reservasi, transaksi }) {
  const [downloading, setDownloading] = useState(false);
  const [modalCard, setModalCard] = useState(null);

  const generatePDF = () => {
    setDownloading(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Invoice Styling & Geometry
      const primaryColor = '#132322'; // Obsidian Canvas
      const accentColor = '#3ddc91'; // Neon Pulse
      const slateColor = '#828786'; // Slate text
      
      // Page Border / Framing
      doc.setDrawColor(208, 211, 211); // Fog Border #d0d3d3
      doc.setLineWidth(0.5);
      doc.rect(5, 5, 200, 287); // Page Frame

      // Header Block (Obsidian Color Accent bar)
      doc.setFillColor(19, 35, 34); // #132322
      doc.rect(6, 6, 198, 30, 'F');

      // Title Text
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('SM SPORT CENTER', 12, 18);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Bukti Reservasi & Pembayaran Lapangan Resmi', 12, 23);
      doc.text('Jl. Olahraga Raya No. 10, Kota Bandung', 12, 28);

      // Status Stamp (Neon Pulse green badge)
      doc.setFillColor(61, 220, 145); // #3ddc91
      doc.rect(145, 12, 50, 10, 'F');
      doc.setTextColor(19, 35, 34);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('TERKONFIRMASI', 151, 18.5);

      // Reset Text Color
      doc.setTextColor(19, 35, 34);

      // Metadata Block
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('INFORMASI INVOICE', 12, 48);
      doc.setDrawColor(61, 220, 145);
      doc.setLineWidth(1);
      doc.line(12, 50, 50, 50); // Small green underline

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(130, 135, 134); // Slate text
      
      const leftColX = 12;
      const rightColX = 110;
      let curY = 56;

      doc.text('ID Reservasi:', leftColX, curY);
      doc.setTextColor(19, 35, 34);
      doc.setFont('Helvetica', 'bold');
      doc.text(reservasi.id.toUpperCase(), leftColX + 30, curY);

      doc.setTextColor(130, 135, 134);
      doc.setFont('Helvetica', 'normal');
      doc.text('Tanggal Invoice:', rightColX, curY);
      doc.setTextColor(19, 35, 34);
      doc.text(new Date(reservasi.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' }), rightColX + 35, curY);

      curY += 6;
      doc.setTextColor(130, 135, 134);
      doc.text('Pelanggan:', leftColX, curY);
      doc.setTextColor(19, 35, 34);
      doc.setFont('Helvetica', 'bold');
      doc.text(reservasi.pelanggan?.nama || 'Pelanggan Sport Center', leftColX + 30, curY);

      doc.setTextColor(130, 135, 134);
      doc.setFont('Helvetica', 'normal');
      doc.text('Email / Telp:', rightColX, curY);
      doc.setTextColor(19, 35, 34);
      doc.text(`${reservasi.pelanggan?.email || '-'} / ${reservasi.pelanggan?.no_telepon || '-'}`, rightColX + 35, curY);

      curY += 12;

      // Table Header
      doc.setFillColor(19, 35, 34);
      doc.rect(12, curY, 186, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('LAPANGAN & RINCIAN SEWA', 15, curY + 5.5);
      doc.text('TANGGAL & JAM', 100, curY + 5.5);
      doc.text('HARGA', 170, curY + 5.5);

      // Table Row
      curY += 8;
      doc.setTextColor(19, 35, 34);
      doc.setDrawColor(208, 211, 211);
      doc.setLineWidth(0.3);
      doc.rect(12, curY, 186, 15);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(reservasi.lapangan?.nama || 'Lapangan', 15, curY + 9);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Jenis: ${reservasi.lapangan?.jenis === 'futsal' ? 'Futsal' : 'Badminton'}`, 15, curY + 13);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`${reservasi.tanggal}`, 100, curY + 7);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(61, 220, 145);
      doc.text(`${reservasi.jam_mulai.substring(0, 5)} - ${reservasi.jam_selesai.substring(0, 5)} WIB`, 100, curY + 12);

      doc.setTextColor(19, 35, 34);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Rp ${Number(reservasi.total_harga).toLocaleString('id-ID')}`, 170, curY + 9);

      curY += 24;

      // Payment Summary Block
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('RINCIAN PEMBAYARAN', 120, curY);
      doc.line(120, curY + 2, 198, curY + 2);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      curY += 8;
      doc.text('Tarif Dasar:', 120, curY);
      doc.text(`Rp ${Number(reservasi.total_harga).toLocaleString('id-ID')}`, 165, curY);

      curY += 6;
      doc.text('Kode Unik:', 120, curY);
      doc.text(`Rp ${transaksi?.kode_unik || 0}`, 165, curY);

      curY += 8;
      doc.setFillColor(237, 247, 245); // Mint Frost #edf7f5
      doc.rect(120, curY - 5, 78, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.text('TOTAL DIBAYAR:', 122, curY);
      doc.text(`Rp ${Number(transaksi?.jumlah_bayar || reservasi.total_harga).toLocaleString('id-ID')}`, 165, curY);

      // Verifikasi details (Admin Signature Box on bottom left)
      curY += 20;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('VERIFIKASI MANUAL ADMIN', 12, curY);
      doc.setLineWidth(0.5);
      doc.line(12, curY + 2, 80, curY + 2);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      curY += 8;
      doc.text('Metode:', 12, curY);
      doc.setFont('Helvetica', 'bold');
      doc.text((transaksi?.metode_pembayaran === 'qris_statis' ? 'QRIS' : 'Transfer Bank').toUpperCase(), 35, curY);

      doc.setFont('Helvetica', 'normal');
      curY += 6;
      doc.text('Diverifikasi Oleh:', 12, curY);
      doc.setFont('Helvetica', 'bold');
      doc.text(transaksi?.admin?.nama || 'Sistem / Admin Utama', 35, curY);

      doc.setFont('Helvetica', 'normal');
      curY += 6;
      doc.text('Tanggal Verifikasi:', 12, curY);
      doc.setFont('Helvetica', 'bold');
      doc.text(
        transaksi?.diverifikasi_pada 
          ? new Date(transaksi.diverifikasi_pada).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
          : new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }), 
        35, 
        curY
      );

      // Legal & Footnote
      curY += 24;
      doc.setFont('Helvetica', 'oblique');
      doc.setFontSize(8.5);
      doc.setTextColor(130, 135, 134);
      doc.text('* Invoice ini sah dan dihasilkan secara otomatis oleh sistem reservasi SM Sport Center.', 12, curY);
      doc.text('  Silakan tunjukkan file PDF ini kepada penjaga lapangan saat jam sewa dimulai.', 12, curY + 4);

      // Save PDF
      const formattedDate = reservasi.tanggal.replace(/-/g, '');
      doc.save(`invoice_${formattedDate}_${reservasi.id.substring(0, 8)}.pdf`);
    } catch (err) {
      console.error(err);
      setModalCard({
        type: 'alert',
        title: 'Gagal Unduh PDF',
        message: 'Terjadi kesalahan saat membuat dan mendownload invoice PDF.',
        variant: 'danger'
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <button
        onClick={generatePDF}
        disabled={downloading}
        className="px-5 py-2.5 bg-ink text-white rounded-tags text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
      >
        {downloading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Membuat PDF...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 text-action-blue" />
            Unduh Invoice PDF
          </>
        )}
      </button>
      <ModalCardAlert card={modalCard} onClose={() => setModalCard(null)} />
    </>
  );
}
