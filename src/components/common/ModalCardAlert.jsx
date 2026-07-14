import React from 'react';
import { AlertTriangle, CheckCircle2, Info, HelpCircle, X } from 'lucide-react';

export default function ModalCardAlert({ card, onClose }) {
  if (!card) return null;

  const {
    type = 'alert', // 'alert' | 'confirm'
    title,
    message,
    actionText,
    cancelText,
    variant = 'info', // 'success' | 'danger' | 'warning' | 'info'
    onConfirm,
    onCancel
  } = card;

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      default:
        return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-100 border border-red-200';
      case 'success':
        return 'bg-green-100 border border-green-200';
      case 'warning':
        return 'bg-amber-100 border border-amber-200';
      default:
        return 'bg-blue-100 border border-blue-200';
    }
  };

  const getActionButtonStyle = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      default:
        return 'bg-ink hover:opacity-90 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white border border-silver rounded-cards shadow-2xl overflow-hidden flex flex-col p-6 text-left transform transition-all scale-100">
        <div className="flex items-start justify-between border-b border-silver/50 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBg()}`}>
              {getIcon()}
            </div>
            <h3 className="font-cal-sans text-subheading font-bold text-graphite tracking-tight">
              {title || (type === 'confirm' ? 'Konfirmasi Tindakan' : 'Pemberitahuan')}
            </h3>
          </div>
          <button
            onClick={() => {
              if (onCancel) onCancel();
              else onClose();
            }}
            className="text-slate hover:text-graphite transition-colors p-1 rounded-full hover:bg-paper cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-2">
          <p className="text-body-sm text-slate leading-relaxed font-medium">
            {message}
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-silver/60">
          {type === 'confirm' && (
            <button
              type="button"
              onClick={() => {
                if (onCancel) onCancel();
                else onClose();
              }}
              className="px-4 py-2 border border-silver text-slate hover:text-graphite hover:border-slate rounded-tags font-semibold text-xs transition-all cursor-pointer"
            >
              {cancelText || 'Batal'}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (onConfirm) {
                onConfirm();
              } else {
                onClose();
              }
            }}
            className={`px-5 py-2 rounded-tags font-semibold text-xs transition-all shadow-sm cursor-pointer ${getActionButtonStyle()}`}
          >
            {actionText || (type === 'confirm' ? 'Ya, Lanjutkan' : 'Mengerti')}
          </button>
        </div>
      </div>
    </div>
  );
}
