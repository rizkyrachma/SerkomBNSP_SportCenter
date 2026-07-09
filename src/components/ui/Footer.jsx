import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer
      style={{
        background: '#10141a',
        color: '#c1c7d0',
        padding: '4rem 2rem 2rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '1680px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '3rem',
          marginBottom: '3rem',
        }}
      >
        {/* Kolom 1: Logo & Deskripsi */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            {/* 4-Square Colorful Logo Icon */}
            <div
              style={{
                width: '32px',
                height: '32px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '3px',
              }}
            >
              <div
                style={{
                  background: '#36b37e',
                  borderTopLeftRadius: '8px',
                }}
              />
              <div
                style={{
                  background: '#998dd9',
                  borderTopRightRadius: '8px',
                }}
              />
              <div
                style={{
                  background: '#0052cc',
                  borderBottomLeftRadius: '8px',
                }}
              />
              <div
                style={{
                  background: '#ffab00',
                  borderBottomRightRadius: '8px',
                }}
              />
            </div>

            <span
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.02em',
              }}
            >
              SM Sport Center
            </span>
          </div>

          <p
            style={{
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: '#8c9ba5',
              maxWidth: '280px',
            }}
          >
            Sistem reservasi lapangan futsal dan badminton berbasis web untuk
            pelanggan dan admin SM Sport Center.
          </p>
        </div>

        {/* Kolom 2: LAPANGAN */}
        <div>
          <h4
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: '0.875rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '1.25rem',
            }}
          >
            LAPANGAN
          </h4>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              fontSize: '0.875rem',
            }}
          >
            <li>
              <span style={{ color: '#c1c7d0' }}>Futsal Lapangan 1</span>
            </li>
            <li>
              <span style={{ color: '#c1c7d0' }}>Futsal Lapangan 2</span>
            </li>
            <li>
              <span style={{ color: '#c1c7d0' }}>Badminton Court 1–3</span>
            </li>
          </ul>
        </div>

        {/* Kolom 3: BANTUAN */}
        <div>
          <h4
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: '0.875rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '1.25rem',
            }}
          >
            BANTUAN
          </h4>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              fontSize: '0.875rem',
            }}
          >
            <li>
              <span style={{ color: '#c1c7d0' }}>Cara Booking</span>
            </li>
            <li>
              <span style={{ color: '#c1c7d0' }}>Kebijakan Pembatalan</span>
            </li>
            <li>
              <span style={{ color: '#c1c7d0' }}>Hubungi Kami</span>
            </li>
          </ul>
        </div>

        {/* Kolom 4: KONTAK */}
        <div>
          <h4
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: '0.875rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '1.25rem',
            }}
          >
            KONTAK
          </h4>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              fontSize: '0.875rem',
              color: '#c1c7d0',
            }}
          >
            <li>0812-xxxx-xxxx</li>
            <li>Jl. Contoh No. 1, Depok</li>
            <li>Setiap hari, 07.00 – 23.00</li>
          </ul>
        </div>
      </div>

      {/* Garis Pemisah */}
      <div
        style={{
          maxWidth: '1680px',
          margin: '0 auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8125rem',
          color: '#748393',
        }}
      >
        <div>© 2026 SM Sport Center. Semua hak dilindungi.</div>
        <div>Dibuat untuk tugas Sistem Reservasi Lapangan</div>
      </div>
    </footer>
  )
}
