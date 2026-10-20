/*
# Create albums table (single-tenant, no auth)

1. New Tables
- `albums`
  - `id` (uuid, primary key)
  - `title` (text, not null) — album title
  - `artist` (text, not null) — album artist
  - `cover_url` (text, not null) — cover image URL
  - `release_year` (int, nullable) — year the album was released
  - `genre` (text, nullable) — album genre
  - `rating` (int, nullable, 0-5) — user rating in stars
  - `played` (boolean, default false) — whether the user has played/favorited the album
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `albums`.
- Single-tenant, no sign-in: allow anon + authenticated full CRUD because the data
  is intentionally shared/public within the app.
- Four separate policies (select/insert/update/delete), not FOR ALL.

3. Notes
- Idempotent: safe to re-run.
- Seed rows inserted afterward via a separate migration so the app has data on first load.
*/

CREATE TABLE IF NOT EXISTS albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL,
  cover_url text NOT NULL,
  release_year int,
  genre text,
  rating int CHECK (rating >= 0 AND rating <= 5),
  played boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_albums" ON albums;
CREATE POLICY "anon_select_albums" ON albums
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_albums" ON albums;
CREATE POLICY "anon_insert_albums" ON albums
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_albums" ON albums;
CREATE POLICY "anon_update_albums" ON albums
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_albums" ON albums;
CREATE POLICY "anon_delete_albums" ON albums
  FOR DELETE TO anon, authenticated USING (true);
