import React from 'react';

export default function StatusBadge({ status }) {
  const config = {
    pending: {
      label: 'Menunggu Pembayaran',
      dotColor: 'bg-[#ffa64d]',
      textColor: 'text-[#14141e]',
      bgColor: 'bg-[#f0f4fe]'
    },
    dikonfirmasi: {
      label: 'Dikonfirmasi (Lunas)',
      dotColor: 'bg-[#3b82f6]',
      textColor: 'text-[#145aff]',
      bgColor: 'bg-[#f0f4fe]'
    },
    selesai: {
      label: 'Selesai Dipakai',
      dotColor: 'bg-[#16ca2e]',
      textColor: 'text-[#14141e]',
      bgColor: 'bg-[#f1f5f9]'
    },
    dibatalkan: {
      label: 'Dibatalkan',
      dotColor: 'bg-[#f26052]',
      textColor: 'text-[#6b7280]',
      bgColor: 'bg-[#f1f5f9]'
    }
  };

  const current = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${current.bgColor} ${current.textColor} border border-[#e2e8f0]`}>
      <span className={`w-2 h-2 rounded-full ${current.dotColor} shrink-0`} />
      {current.label}
    </span>
  );
}
