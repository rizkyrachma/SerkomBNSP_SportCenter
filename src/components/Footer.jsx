import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#e2e8f0] bg-[#fcfcfc] py-10">
      <div className="max-w-[1200px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#6b7280]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#145aff] flex items-center justify-center text-white font-bold text-xs">
            S
          </div>
          <span className="font-semibold text-[#020520]">SM Sport Center</span>
          <span>— Sistem Reservasi Futsal & Badminton</span>
        </div>
        <div className="text-xs font-mono text-[#6b7280]">
          © {new Date().getFullYear()} SM Sport Center. Prototipe Sistem Reservasi Tanpa Bentrok.
        </div>
      </div>
    </footer>
  );
}
