-- Seeding Akun Admin & Pelanggan ke Supabase Auth (auth.users) dan tabel public
-- ID Admin berformat ADM____, ID Pelanggan berformat PLG____
-- Semua akun di bawah menggunakan Password: password

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_admin_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  v_pelanggan_id UUID := '22222222-2222-2222-2222-222222222222'::UUID;
  v_rizky_id UUID := '33333333-3333-3333-3333-333333333333'::UUID;
BEGIN
  -- 1. Akun Admin (email: admin@smsportcenter.com | password: password)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
    'admin@smsportcenter.com', extensions.crypt('password', extensions.gen_salt('bf')), NOW(),
    '{"provider": "email", "providers": ["email"]}', '{"nama": "Administrator SM Sport"}', NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    v_admin_id, v_admin_id, format('{"sub": "%s", "email": "%s"}', v_admin_id, 'admin@smsportcenter.com')::jsonb,
    'email', v_admin_id::text, NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider_id, provider) DO NOTHING;

  INSERT INTO public.admin (id, nama, email, role)
  VALUES ('ADM0001', 'Administrator SM Sport', 'admin@smsportcenter.com', 'superadmin')
  ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama, email = EXCLUDED.email, role = EXCLUDED.role;

  -- 2. Akun Pelanggan Demo (email: pelanggan@gmail.com | password: password)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000', v_pelanggan_id, 'authenticated', 'authenticated',
    'pelanggan@gmail.com', extensions.crypt('password', extensions.gen_salt('bf')), NOW(),
    '{"provider": "email", "providers": ["email"]}', '{"nama": "Pelanggan Demo", "no_telepon": "081234567890"}', NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    v_pelanggan_id, v_pelanggan_id, format('{"sub": "%s", "email": "%s"}', v_pelanggan_id, 'pelanggan@gmail.com')::jsonb,
    'email', v_pelanggan_id::text, NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider_id, provider) DO NOTHING;

  INSERT INTO public.pelanggan (id, nama, email, no_telepon)
  VALUES ('PLG0001', 'Pelanggan Demo', 'pelanggan@gmail.com', '081234567890')
  ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama, email = EXCLUDED.email, no_telepon = EXCLUDED.no_telepon;

  -- 3. Akun Pelanggan Rizky (email: rizky@gmail.com | password: password)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000', v_rizky_id, 'authenticated', 'authenticated',
    'rizky@gmail.com', extensions.crypt('password', extensions.gen_salt('bf')), NOW(),
    '{"provider": "email", "providers": ["email"]}', '{"nama": "Rizky Rachma", "no_telepon": "081299887766"}', NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    v_rizky_id, v_rizky_id, format('{"sub": "%s", "email": "%s"}', v_rizky_id, 'rizky@gmail.com')::jsonb,
    'email', v_rizky_id::text, NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider_id, provider) DO NOTHING;

  INSERT INTO public.pelanggan (id, nama, email, no_telepon)
  VALUES ('PLG0002', 'Rizky Rachma', 'rizky@gmail.com', '081299887766')
  ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama, email = EXCLUDED.email, no_telepon = EXCLUDED.no_telepon;

END $$;
