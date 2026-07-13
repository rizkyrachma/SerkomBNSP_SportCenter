import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';

const OPERATIONAL_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

export default function JadwalLapangan({ onSlotSelect, selectedSlots = [], currentUserId }) {
  const [lapangans, setLapangans] = useState([]);
  const [activeLapanganId, setActiveLapanganId] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState([]);
  const [locks, setLocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch active fields
  useEffect(() => {
    const fetchLapangans = async () => {
      const { data, error } = await supabase
        .from('lapangan')
        .select('*')
        .eq('status', 'aktif');
      
      if (data && data.length > 0) {
        setLapangans(data);
        setActiveLapanganId(data[0].id);
      }
    };
    fetchLapangans();
  }, []);

  const fetchJadwalStatus = async () => {
    if (!activeLapanganId || !tanggal) return;
    setLoading(true);
    setErrorMsg('');

    try {
      // Get active bookings
      const { data: resData, error: resErr } = await supabase
        .from('reservasi')
        .select('id, jam_mulai, jam_selesai, status')
        .match({ lapangan_id: activeLapanganId, tanggal })
        .neq('status', 'dibatalkan')
        .neq('status', 'kedaluwarsa');

      if (resErr) throw resErr;

      // Get slot locks
      const { data: lockData, error: lockErr } = await supabase
        .from('slot_lock')
        .select('id, jam_mulai, jam_selesai, pelanggan_id, kedaluwarsa_pada')
        .match({ lapangan_id: activeLapanganId, tanggal });

      if (lockErr) throw lockErr;

      const now = new Date();
      const validLocks = (lockData || []).filter(lock => new Date(lock.kedaluwarsa_pada) > now);

      setBookings(resData || []);
      setLocks(validLocks);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal memuat jadwal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJadwalStatus();
    const interval = setInterval(fetchJadwalStatus, 10000);
    return () => clearInterval(interval);
  }, [activeLapanganId, tanggal]);

  const handleSlotToggle = async (timeStart) => {
    const timeEnd = getNextHour(timeStart);
    setErrorMsg('');

    const isSelected = selectedSlots.some(
      s => s.lapanganId === activeLapanganId && s.tanggal === tanggal && s.jamMulai === timeStart
    );

    if (isSelected) {
      const { error } = await supabase
        .from('slot_lock')
        .delete()
        .match({
          lapangan_id: activeLapanganId,
          tanggal,
          jam_mulai: timeStart + ':00',
          pelanggan_id: currentUserId
        });

      onSlotSelect(selectedSlots.filter(
        s => !(s.lapanganId === activeLapanganId && s.tanggal === tanggal && s.jamMulai === timeStart)
      ));
      fetchJadwalStatus();
      return;
    }

    const isBooked = bookings.some(b => isTimeOverlapping(b.jam_mulai, b.jam_selesai, timeStart, timeEnd));
    const isLockedByOthers = locks.some(l => 
      l.pelanggan_id !== currentUserId && isTimeOverlapping(l.jam_mulai, l.jam_selesai, timeStart, timeEnd)
    );

    if (isBooked || isLockedByOthers) {
      setErrorMsg('Slot ini sudah dipesan atau sedang dikunci oleh pelanggan lain.');
      return;
    }

    const expireTime = new Date(Date.now() + 10 * 60 * 1000);
    const newLock = {
      lapangan_id: activeLapanganId,
      tanggal,
      jam_mulai: timeStart + ':00',
      jam_selesai: timeEnd + ':00',
      pelanggan_id: currentUserId,
      kedaluwarsa_pada: expireTime.toISOString()
    };

    const { data, error } = await supabase
      .from('slot_lock')
      .insert(newLock);

    if (error) {
      setErrorMsg('Gagal mengunci slot. Mungkin slot baru saja dipesan orang lain.');
      fetchJadwalStatus();
    } else {
      const activeField = lapangans.find(l => l.id === activeLapanganId);
      onSlotSelect([...selectedSlots, {
        lapanganId: activeLapanganId,
        lapanganNama: activeField.nama,
        jenis: activeField.jenis,
        harga: activeField.harga_per_jam,
        tanggal,
        jamMulai: timeStart,
        jamSelesai: timeEnd
      }]);
      fetchJadwalStatus();
    }
  };

  const getNextHour = (timeStr) => {
    const [hour] = timeStr.split(':').map(Number);
    return `${String(hour + 1).padStart(2, '0')}:00`;
  };

  const isTimeOverlapping = (start1, end1, start2, end2) => {
    const getMinutes = (t) => {
      const parts = t.split(':').map(Number);
      return parts[0] * 60 + parts[1];
    };
    return getMinutes(start1) < getMinutes(end2) && getMinutes(start2) < getMinutes(end1);
  };

  const activeField = lapangans.find(l => l.id === activeLapanganId);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Date selector: White card backdrop, Silver border, 12px radius */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-cards border border-silver shadow-sm">
        <div className="flex items-center gap-3">
          <Calendar className="text-ink w-5 h-5" />
          <span className="text-body font-semibold text-graphite">Pilih Tanggal Reservasi</span>
        </div>
        <input
          type="date"
          min={new Date().toISOString().split('T')[0]}
          value={tanggal}
          onChange={(e) => {
            setTanggal(e.target.value);
            onSlotSelect([]);
          }}
          className="bg-white border border-silver rounded-inputs px-4 py-2 text-graphite focus:outline-none focus:border-ink text-body-sm font-semibold cursor-pointer"
        />
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-inputs text-body-sm font-medium">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs of Sports Fields: 9999px radius (tags) */}
      <div className="flex flex-wrap gap-2 justify-center">
        {lapangans.map((lap) => {
          const isActive = lap.id === activeLapanganId;
          return (
            <button
              key={lap.id}
              onClick={() => {
                setActiveLapanganId(lap.id);
                onSlotSelect([]);
              }}
              className={`px-6 py-2.5 font-semibold text-body-sm transition-all cursor-pointer rounded-tags ${
                isActive
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-white text-slate border border-silver hover:text-graphite hover:border-slate'
              }`}
            >
              {lap.nama} ({lap.jenis === 'futsal' ? 'Futsal' : 'Badminton'})
            </button>
          );
        })}
      </div>

      {/* Field Image Preview in a White Card (12px radius, quiet shadow) */}
      {activeField && (
        <div className="bg-white p-6 rounded-cards border border-silver shadow-sm text-graphite flex flex-col md:flex-row gap-6 items-center">
          <div className="w-full md:w-1/3 aspect-video md:aspect-square overflow-hidden rounded-cards border border-silver">
            <img
              src={activeField.foto_url || 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=600&auto=format&fit=crop'}
              alt={activeField.nama}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 flex flex-col gap-2 text-left">
            <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Rincian Lapangan</span>
            <h3 className="font-cal-sans text-subheading font-semibold text-graphite">{activeField.nama}</h3>
            <p className="text-body-sm text-slate font-medium">Jenis Lapangan: <span className="text-graphite font-semibold capitalize">{activeField.jenis}</span></p>
            <p className="text-body-sm text-slate font-medium">Tarif Sewa: <span className="text-graphite font-bold">Rp {Number(activeField.harga_per_jam).toLocaleString('id-ID')} / jam</span></p>
          </div>
        </div>
      )}

      {/* Scheduler Grid Box: White background, 12px radius, silver border */}
      <div className="bg-white p-6 rounded-cards border border-silver shadow-sm text-left">
        <h4 className="font-cal-sans text-body-sm font-semibold text-graphite mb-6 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate" />
          Ketersediaan Jam Operasional (08:00 - 22:00)
        </h4>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-silver border-t-ink rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {OPERATIONAL_HOURS.map((hour) => {
              const endTime = getNextHour(hour);
              
              const isBooked = bookings.some(b => isTimeOverlapping(b.jam_mulai, b.jam_selesai, hour, endTime));
              const currentBooking = bookings.find(b => isTimeOverlapping(b.jam_mulai, b.jam_selesai, hour, endTime));
              
              const isLocked = locks.some(l => isTimeOverlapping(l.jam_mulai, l.jam_selesai, hour, endTime));
              const currentLock = locks.find(l => isTimeOverlapping(l.jam_mulai, l.jam_selesai, hour, endTime));
              const isLockedByMe = currentLock && currentLock.pelanggan_id === currentUserId;

              const isSelected = selectedSlots.some(
                s => s.lapanganId === activeLapanganId && s.tanggal === tanggal && s.jamMulai === hour
              );

              let btnClass = '';
              let labelText = `${hour} - ${endTime}`;
              let isDisabled = false;

              if (isBooked) {
                let badgeColor = 'text-red-600 bg-red-50 border border-red-100';
                if (currentBooking?.status === 'menunggu_verifikasi') {
                  badgeColor = 'text-amber-600 bg-amber-50 border border-amber-100';
                }
                btnClass = 'bg-paper border border-silver text-stone cursor-not-allowed opacity-50';
                labelText = (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-body-sm font-bold">{hour} - {endTime}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-tags uppercase font-bold tracking-wider ${badgeColor}`}>
                      {currentBooking?.status === 'menunggu_verifikasi' ? 'Verifikasi' : 'Terisi'}
                    </span>
                  </div>
                );
                isDisabled = true;
              } else if (isLocked && !isLockedByMe) {
                btnClass = 'bg-paper border border-silver text-stone cursor-not-allowed opacity-50';
                labelText = (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-body-sm font-bold">{hour} - {endTime}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-silver text-slate rounded-tags uppercase font-bold tracking-wider">Locked</span>
                  </div>
                );
                isDisabled = true;
              } else if (isSelected || isLockedByMe) {
                btnClass = 'bg-ink text-white font-bold rounded-buttons shadow-sm cursor-pointer scale-102 border-transparent';
              } else {
                btnClass = 'bg-white border border-silver hover:border-slate text-graphite font-semibold transition-all cursor-pointer rounded-buttons';
              }

              return (
                <button
                  key={hour}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSlotToggle(hour)}
                  className={`w-full py-3.5 text-center text-body-sm transition-all focus:outline-none ${btnClass}`}
                >
                  {labelText}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
