export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {title && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: '1.125rem',
              fontWeight: 700,
            }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.25rem',
                color: 'var(--color-muted-indigo)',
                padding: '0.25rem',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
