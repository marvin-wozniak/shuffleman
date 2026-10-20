import type { iTunesAlbum } from './supabase';

// iTunes Search API — public, no key required, CORS-enabled.
const ITUNES_ENDPOINT = 'https://itunes.apple.com/search';

export async function searchITunesAlbums(term: string): Promise<iTunesAlbum[]> {
  const trimmed = term.trim();
  if (!trimmed) return [];

  const url = `${ITUNES_ENDPOINT}?term=${encodeURIComponent(
    trimmed
  )}&entity=album&limit=12`;

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !Array.isArray(data.results)) return [];

    return data.results
      .map((r: any): iTunesAlbum => {
        const yearRaw =
          r.releaseDate != null ? String(r.releaseDate).slice(0, 4) : null;
        const year = yearRaw ? Number(yearRaw) : null;
        return {
          id: r.collectionId ?? r.trackId ?? Math.random(),
          title: r.collectionName ?? r.trackName ?? 'Untitled',
          artist: r.artistName ?? 'Unknown Artist',
          coverUrl:
            (r.artworkUrl100 ?? r.artworkUrl60 ?? '').replace(
              '100x100',
              '300x300'
            ).replace('60x60', '300x300') || '',
          year: Number.isNaN(year) ? null : year,
          genre: r.primaryGenreName ?? null,
          appleMusicUrl:
            r.collectionViewUrl ?? r.trackViewUrl ?? null,
        };
      })
      .filter((a: iTunesAlbum) => a.coverUrl);
  } catch {
    return [];
  }
}
