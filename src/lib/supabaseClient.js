import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Check if variables are real and configured
const isRealSupabase =
  SUPABASE_URL &&
  SUPABASE_URL !== 'isi-dengan-url-project-supabase' &&
  SUPABASE_URL.startsWith('http') &&
  SUPABASE_ANON_KEY &&
  SUPABASE_ANON_KEY !== 'isi-dengan-anon-key-supabase';

export let supabase;

if (isRealSupabase) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('Using Real Supabase Backend');
} else {
  console.log('Using Local Mock Supabase Backend');

  // Helper to read/write mock localStorage tables
  const db = {
    get: (key) => {
      const data = localStorage.getItem(`mock_db_${key}`);
      return data ? JSON.parse(data) : null;
    },
    set: (key, val) => {
      localStorage.setItem(`mock_db_${key}`, JSON.stringify(val));
    }
  };

  // Seeding initial database tables
  if (!db.get('lapangan')) {
    db.set('lapangan', [
      { id: 'l-futsal-1', nama: 'Lapangan Futsal 1', jenis: 'futsal', harga_per_jam: 150000, foto_url: 'https://images.unsplash.com/photo-1577223625856-74367e918170?q=80&w=600&auto=format&fit=crop', status: 'aktif' },
      { id: 'l-futsal-2', nama: 'Lapangan Futsal 2', jenis: 'futsal', harga_per_jam: 150000, foto_url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=600&auto=format&fit=crop', status: 'aktif' },
      { id: 'l-badminton-1', nama: 'Lapangan Badminton 1', jenis: 'badminton', harga_per_jam: 50000, foto_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop', status: 'aktif' },
      { id: 'l-badminton-2', nama: 'Lapangan Badminton 2', jenis: 'badminton', harga_per_jam: 50000, foto_url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop', status: 'aktif' },
      { id: 'l-badminton-3', nama: 'Lapangan Badminton 3', jenis: 'badminton', harga_per_jam: 50000, foto_url: 'https://images.unsplash.com/photo-1613918431208-6752fe2faa7a?q=80&w=600&auto=format&fit=crop', status: 'aktif' }
    ]);
  }

  if (!db.get('admin')) {
    db.set('admin', [
      { id: 'admin-uuid-1', nama: 'Admin Utama', email: 'admin@smsportcenter.com', role: 'admin' },
      { id: 'admin-uuid-2', nama: 'Super Admin', email: 'superadmin@smsportcenter.com', role: 'superadmin' }
    ]);
  }

  if (!db.get('pelanggan')) db.set('pelanggan', []);
  if (!db.get('reservasi')) db.set('reservasi', []);
  if (!db.get('transaksi')) db.set('transaksi', []);
  if (!db.get('slot_lock')) db.set('slot_lock', []);
  if (!db.get('auth_users')) {
    db.set('auth_users', [
      // Pre-seed default user: password is "password"
      { id: 'user-uuid-1', email: 'pelanggan@gmail.com', password: 'password', raw_user_meta_data: { nama: 'Rizky Rachma', no_telepon: '081234567890' } },
      { id: 'admin-uuid-1', email: 'admin@smsportcenter.com', password: 'password', raw_user_meta_data: { nama: 'Admin Utama' } },
      { id: 'admin-uuid-2', email: 'superadmin@smsportcenter.com', password: 'password', raw_user_meta_data: { nama: 'Super Admin' } }
    ]);
  }

  // Active Session state
  let currentSession = JSON.parse(localStorage.getItem('mock_session')) || null;
  const authListeners = new Set();

  const notifyAuthChange = (event, session) => {
    localStorage.setItem('mock_session', JSON.stringify(session));
    currentSession = session;
    authListeners.forEach(listener => listener(event, session));
  };

  class QueryBuilder {
    constructor(tableName) {
      this.tableName = tableName;
      this.operation = 'select'; // 'select', 'insert', 'update', 'delete'
      this.insertRows = null;
      this.updateValues = null;
      this.filters = [];
      this.sorts = [];
      this.shouldSingle = false;
      this.shouldMaybeSingle = false;
      this.columns = '*';
    }

    select(columns = '*') {
      this.columns = columns;
      if (this.operation === 'select') {
        this.operation = 'select';
      }
      return this;
    }

    eq(column, value) {
      this.filters.push((row) => row[column] === value);
      return this;
    }

    neq(column, value) {
      this.filters.push((row) => row[column] !== value);
      return this;
    }

    match(queryObj) {
      this.filters.push((row) => {
        for (const [key, value] of Object.entries(queryObj)) {
          if (row[key] !== value) return false;
        }
        return true;
      });
      return this;
    }

    order(column, { ascending = true } = {}) {
      this.sorts.push((a, b) => {
        if (a[column] < b[column]) return ascending ? -1 : 1;
        if (a[column] > b[column]) return ascending ? 1 : -1;
        return 0;
      });
      return this;
    }

    single() {
      this.shouldSingle = true;
      return this;
    }

    maybeSingle() {
      this.shouldMaybeSingle = true;
      return this;
    }

    insert(rows) {
      this.operation = 'insert';
      this.insertRows = rows;
      return this;
    }

    update(values) {
      this.operation = 'update';
      this.updateValues = values;
      return this;
    }

    delete() {
      this.operation = 'delete';
      return this;
    }

    // Resolves simple mock relationships (joins) like:
    // .select('*, lapangan(*), pelanggan(*), transaksi(*)')
    _resolveJoins(row) {
      if (!this.columns || this.columns === '*') return row;

      const newRow = { ...row };
      const joins = this.columns.split(',').map(s => s.trim());

      joins.forEach(join => {
        if (join.includes('lapangan(*)')) {
          const lapanganList = db.get('lapangan') || [];
          newRow.lapangan = lapanganList.find(l => l.id === row.lapangan_id) || null;
        }
        if (join.includes('pelanggan(*)')) {
          const pelangganList = db.get('pelanggan') || [];
          newRow.pelanggan = pelangganList.find(p => p.id === row.pelanggan_id) || null;
        }
        if (join.includes('transaksi(*)')) {
          const transaksiList = db.get('transaksi') || [];
          newRow.transaksi = transaksiList.find(t => t.reservasi_id === row.id) || null;
        }
        if (join.includes('reservasi(*)')) {
          const reservasiList = db.get('reservasi') || [];
          const matchedReservasi = reservasiList.find(r => r.id === row.reservasi_id);
          if (matchedReservasi) {
            // Also join nested tables if needed
            const lapanganList = db.get('lapangan') || [];
            matchedReservasi.lapangan = lapanganList.find(l => l.id === matchedReservasi.lapangan_id) || null;
            const pelangganList = db.get('pelanggan') || [];
            matchedReservasi.pelanggan = pelangganList.find(p => p.id === matchedReservasi.pelanggan_id) || null;
            newRow.reservasi = matchedReservasi;
          } else {
            newRow.reservasi = null;
          }
        }
      });

      return newRow;
    }

    async then(resolve) {
      try {
        const tableData = db.get(this.tableName) || [];

        if (this.operation === 'select') {
          // Execute Select
          let result = [...tableData];

          this.filters.forEach(filterFn => {
            result = result.filter(filterFn);
          });

          this.sorts.forEach(sortFn => {
            result.sort(sortFn);
          });

          result = result.map(row => this._resolveJoins(row));

          if (this.shouldSingle) {
            if (result.length === 0) {
              resolve({ data: null, error: { message: 'Row not found' } });
            } else {
              resolve({ data: result[0], error: null });
            }
          } else if (this.shouldMaybeSingle) {
            resolve({ data: result[0] || null, error: null });
          } else {
            resolve({ data: result, error: null });
          }
        }

        else if (this.operation === 'insert') {
          // Execute Insert
          const isArray = Array.isArray(this.insertRows);
          const rowsToInsert = isArray ? this.insertRows : [this.insertRows];

          const newRecords = rowsToInsert.map(row => {
            const id = row.id || `${this.tableName[0]}-${Math.random().toString(36).substr(2, 9)}`;
            return {
              id,
              created_at: new Date().toISOString(),
              ...row
            };
          });

          db.set(this.tableName, [...tableData, ...newRecords]);

          if (this.tableName === 'reservasi') {
            const transaksiList = db.get('transaksi') || [];
            newRecords.forEach(res => {
              const hasTx = transaksiList.some(t => t.reservasi_id === res.id);
              if (!hasTx) {
                const uniqueCode = Math.floor(100 + Math.random() * 900);
                const limitTime = new Date(Date.now() + 60 * 60 * 1000);
                transaksiList.push({
                  id: `tx-${Math.random().toString(36).substr(2, 9)}`,
                  reservasi_id: res.id,
                  kode_unik: uniqueCode,
                  jumlah_bayar: Number(res.total_harga) + uniqueCode,
                  metode_pembayaran: 'transfer_bank',
                  bukti_transfer_url: null,
                  status_verifikasi: 'menunggu',
                  diverifikasi_oleh: null,
                  diverifikasi_pada: null,
                  batas_waktu_bayar: limitTime.toISOString(),
                  created_at: new Date().toISOString()
                });
              }
            });
            db.set('transaksi', transaksiList);
          }

          resolve({
            data: isArray ? newRecords : newRecords[0],
            error: null
          });
        }

        else if (this.operation === 'update') {
          // Execute Update
          let filteredRows = [...tableData];
          this.filters.forEach(filterFn => {
            filteredRows = filteredRows.filter(filterFn);
          });

          const updatedIds = filteredRows.map(r => r.id);
          const values = this.updateValues;

          const newTableData = tableData.map(row => {
            if (updatedIds.includes(row.id)) {
              // Simulating trigger events on status changes
              if (this.tableName === 'transaksi' && values.status_verifikasi === 'disetujui') {
                const resList = db.get('reservasi') || [];
                const newResList = resList.map(res => {
                  if (res.id === row.reservasi_id) {
                    const locks = db.get('slot_lock') || [];
                    const filteredLocks = locks.filter(l => !(l.lapangan_id === res.lapangan_id && l.tanggal === res.tanggal && l.jam_mulai === res.jam_mulai));
                    db.set('slot_lock', filteredLocks);
                    return { ...res, status: 'terkonfirmasi' };
                  }
                  return res;
                });
                db.set('reservasi', newResList);
              }

              if (this.tableName === 'transaksi' && values.status_verifikasi === 'ditolak') {
                const resList = db.get('reservasi') || [];
                const newResList = resList.map(res => {
                  if (res.id === row.reservasi_id) {
                    return { ...res, status: 'dibatalkan' };
                  }
                  return res;
                });
                db.set('reservasi', newResList);
              }

              if (this.tableName === 'transaksi' && values.bukti_transfer_url) {
                const resList = db.get('reservasi') || [];
                const newResList = resList.map(res => {
                  if (res.id === row.reservasi_id) {
                    return { ...res, status: 'menunggu_verifikasi' };
                  }
                  return res;
                });
                db.set('reservasi', newResList);
              }

              return { ...row, ...values };
            }
            return row;
          });

          db.set(this.tableName, newTableData);
          const returnedData = newTableData.filter(row => updatedIds.includes(row.id));

          resolve({
            data: returnedData,
            error: null
          });
        }

        else if (this.operation === 'delete') {
          // Execute Delete
          let filteredRows = [...tableData];
          this.filters.forEach(filterFn => {
            filteredRows = filteredRows.filter(filterFn);
          });

          const idsToDelete = filteredRows.map(r => r.id);
          const newTableData = tableData.filter(row => !idsToDelete.includes(row.id));

          db.set(this.tableName, newTableData);

          resolve({
            data: filteredRows,
            error: null
          });
        }
      } catch (err) {
        resolve({ data: null, error: err });
      }
    }
  }

  // Supabase Object export Mock
  supabase = {
    from: (tableName) => {
      return new QueryBuilder(tableName);
    },

    auth: {
      signUp: async ({ email, password, options }) => {
        const users = db.get('auth_users') || [];
        const pelangganList = db.get('pelanggan') || [];

        if (users.some(u => u.email === email)) {
          return { data: null, error: { message: 'Email sudah terdaftar.' } };
        }

        const newUser = {
          id: `usr-${Math.random().toString(36).substr(2, 9)}`,
          email,
          password, // Store as plain text for mockup simplicity
          raw_user_meta_data: options?.data || {}
        };

        users.push(newUser);
        db.set('auth_users', users);

        // Sync with pelanggan table (trigger simulation)
        const newPelanggan = {
          id: newUser.id,
          nama: options?.data?.nama || 'Pelanggan Baru',
          email: newUser.email,
          no_telepon: options?.data?.no_telepon || '',
          created_at: new Date().toISOString()
        };
        pelangganList.push(newPelanggan);
        db.set('pelanggan', pelangganList);

        const session = {
          access_token: `mock-token-${newUser.id}`,
          user: {
            id: newUser.id,
            email: newUser.email,
            user_metadata: newUser.raw_user_meta_data
          }
        };

        notifyAuthChange('SIGNED_IN', session);

        return {
          data: { user: session.user, session },
          error: null
        };
      },

      signInWithPassword: async ({ email, password }) => {
        const users = db.get('auth_users') || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
          return { data: null, error: { message: 'Email atau password salah.' } };
        }

        // Check if user is admin
        const adminList = db.get('admin') || [];
        const isAdminUser = adminList.find(a => a.email === email);

        const session = {
          access_token: `mock-token-${user.id}`,
          user: {
            id: user.id,
            email: user.email,
            user_metadata: user.raw_user_meta_data,
            app_metadata: {
              role: isAdminUser ? 'admin' : 'pelanggan'
            }
          }
        };

        notifyAuthChange('SIGNED_IN', session);

        return {
          data: { user: session.user, session },
          error: null
        };
      },

      signOut: async () => {
        notifyAuthChange('SIGNED_OUT', null);
        return { error: null };
      },

      getUser: async () => {
        return { data: { user: currentSession?.user || null }, error: null };
      },

      getSession: async () => {
        return { data: { session: currentSession }, error: null };
      },

      onAuthStateChange: (callback) => {
        authListeners.add(callback);
        // Fire initial event
        callback(currentSession ? 'SIGNED_IN' : 'SIGNED_OUT', currentSession);

        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authListeners.delete(callback);
              }
            }
          }
        };
      }
    },

    storage: {
      from: (bucketName) => {
        return {
          upload: async (path, file) => {
            // Path structure: {pelanggan_id}/{reservasi_id}/{nama_file}
            // For mock storage, we convert file to a base64 Data URL or mock url string
            let mockUrl = '';
            if (file instanceof File || file instanceof Blob) {
              mockUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
              });
            } else {
              mockUrl = `https://mock-storage.local/${bucketName}/${path}`;
            }

            // Save to virtual storage index in localStorage
            const storageKey = `mock_storage_${bucketName}`;
            const items = JSON.parse(localStorage.getItem(storageKey)) || {};
            items[path] = mockUrl;
            localStorage.setItem(storageKey, JSON.stringify(items));

            return {
              data: { path, fullPath: `${bucketName}/${path}` },
              error: null
            };
          },

          getPublicUrl: (path) => {
            const storageKey = `mock_storage_${bucketName}`;
            const items = JSON.parse(localStorage.getItem(storageKey)) || {};
            const url = items[path] || `https://mock-storage.local/${bucketName}/${path}`;
            return {
              data: { publicUrl: url }
            };
          }
        };
      }
    },

    // Realtime subscription stub
    channel: (channelName) => {
      return {
        on: (event, filter, callback) => {
          // No-op for mock, but matches API
          return this;
        },
        subscribe: () => {
          return {
            unsubscribe: () => { }
          };
        }
      };
    }
  };

  // Helper method specifically for checking publicUrl in components since storage.from().getPublicUrl needs to access the bucket
  const originalFrom = supabase.storage.from;
  supabase.storage.from = (bucketName) => {
    const parent = originalFrom(bucketName);
    return {
      ...parent,
      getPublicUrl: (path) => {
        const storageKey = `mock_storage_${bucketName}`;
        const items = JSON.parse(localStorage.getItem(storageKey)) || {};
        // If it starts with l-futsal or l-badminton and it is in field seeding, get photo_url from table
        if (bucketName === 'lapangan-photos') {
          const fields = db.get('lapangan') || [];
          const field = fields.find(f => f.foto_url.includes(path) || f.id === path);
          if (field) {
            return { data: { publicUrl: field.foto_url } };
          }
        }
        const url = items[path] || `https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=600&auto=format&fit=crop`;
        return {
          data: { publicUrl: url }
        };
      }
    };
  };

  // Background routine: expired reservation checker simulation
  // Changes status 'pending_bayar' to 'kedaluwarsa' and deletes 'slot_lock' if limit exceeded
  setInterval(() => {
    const transaksiList = db.get('transaksi') || [];
    const resList = db.get('reservasi') || [];
    const locks = db.get('slot_lock') || [];
    const now = new Date();
    let changed = false;

    // Check transactions whose deadline has passed and status is still 'menunggu' (meaning pending upload/verification)
    const expiredTxResIds = transaksiList
      .filter(t => t.bukti_transfer_url === null && new Date(t.batas_waktu_bayar) < now)
      .map(t => t.reservasi_id);

    if (expiredTxResIds.length > 0) {
      const newResList = resList.map(res => {
        if (expiredTxResIds.includes(res.id) && res.status === 'pending_bayar') {
          changed = true;
          // Delete matching slot locks
          const index = locks.findIndex(l => l.lapangan_id === res.lapangan_id && l.tanggal === res.tanggal && l.jam_mulai === res.jam_mulai);
          if (index !== -1) {
            locks.splice(index, 1);
          }
          return { ...res, status: 'kedaluwarsa' };
        }
        return res;
      });

      if (changed) {
        db.set('reservasi', newResList);
        db.set('slot_lock', locks);
        console.log('Mock Schedule: Marked expired reservations and freed slot locks');
      }
    }

    // Clean slot locks whose kedaluwarsa_pada has passed
    const activeLocks = db.get('slot_lock') || [];
    const validLocks = activeLocks.filter(l => new Date(l.kedaluwarsa_pada) > now);
    if (activeLocks.length !== validLocks.length) {
      db.set('slot_lock', validLocks);
      console.log('Mock Schedule: Cleared expired slot locks');
    }
  }, 10000); // Check every 10 seconds
}
