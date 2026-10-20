/*
# Extend albums table for full ShuffleMan features

1. Modified Tables
- `albums` — add columns to support Apple Music links, custom imports,
  personal reviews, favorite tracks, play counting, and journaling.

  New columns:
  - `apple_music_url` (text, nullable) — link to the album on Apple Music.
  - `is_custom` (boolean, default false) — true for manually imported / mixtape entries.
  - `notes` (text, nullable) — short personal notes / location notes.
  - `favorite_tracks` (text, nullable) — free-form list of favorite tracks.
  - `review` (text, nullable) — longer personal review / journal entry.
  - `play_count` (int, not null, default 0) — number of times the album was played/listened.
  - `last_played_at` (timestamptz, nullable) — timestamp of the most recent listen.

2. Security
- No changes to existing RLS policies (already anon+authenticated full CRUD,
  appropriate for this single-tenant no-auth app).

3. Notes
- Idempotent: uses a DO $$ block to add columns only if they don't already exist.
- Does NOT drop or rename any existing column — preserves all current data.
- Existing `release_year` column is reused as the "year" field in the app.
- Existing `played` column is retained for backward compatibility.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'albums' AND column_name = 'apple_music_url') THEN
    ALTER TABLE albums ADD COLUMN apple_music_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'albums' AND column_name = 'is_custom') THEN
    ALTER TABLE albums ADD COLUMN is_custom boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'albums' AND column_name = 'notes') THEN
    ALTER TABLE albums ADD COLUMN notes text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'albums' AND column_name = 'favorite_tracks') THEN
    ALTER TABLE albums ADD COLUMN favorite_tracks text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'albums' AND column_name = 'review') THEN
    ALTER TABLE albums ADD COLUMN review text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'albums' AND column_name = 'play_count') THEN
    ALTER TABLE albums ADD COLUMN play_count int NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'albums' AND column_name = 'last_played_at') THEN
    ALTER TABLE albums ADD COLUMN last_played_at timestamptz;
  END IF;
END $$;

-- Backfill a few existing rows with reviews / favorite tracks / play counts
-- so the Journal and Discothèque tabs have content on first load.
UPDATE albums SET
  favorite_tracks = 'Midnight Drive, Neon Rain, Velvet Static',
  review = 'A pristine synthwave record — the bass tones echo like an empty highway at 3am.',
  play_count = 3,
  last_played_at = now() - interval '2 days'
WHERE title = 'Midnight Frequencies';

UPDATE albums SET
  favorite_tracks = 'Paper Moons, Velvet Horizon, Slow Burn',
  review = 'Dreamy, washed-out guitars that feel like a long sunset. A keeper.',
  play_count = 5,
  last_played_at = now() - interval '12 hours'
WHERE title = 'Velvet Horizon';

UPDATE albums SET
  favorite_tracks = 'Aqua Discoteca, Mirage, Lights Down',
  review = 'Pure groove. The bassline on Aqua Discoteca is unstoppable.',
  play_count = 2,
  last_played_at = now() - interval '5 days'
WHERE title = 'Aqua Discoteca';

UPDATE albums SET
  favorite_tracks = 'Riviera Nights, Cascade, Girls On Film',
  review = 'Iconic 80s new wave. Every track is a time machine.',
  play_count = 7,
  last_played_at = now() - interval '1 day'
WHERE title = 'Riviera Lights';

UPDATE albums SET
  favorite_tracks = 'Shadow I, Geometry, Hollow',
  review = 'Cinematic post-rock that builds and builds. Headphones recommended.',
  play_count = 1,
  last_played_at = now() - interval '8 days'
WHERE title = 'Shadow Geometry';
