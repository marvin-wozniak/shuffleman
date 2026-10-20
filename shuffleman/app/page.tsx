'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Disc3,
  Shuffle,
  Plus,
  Star,
  Library,
  Search,
  CheckCircle2,
  ListFilter,
  ChevronDown,
  ChevronUp,
  Music,
  Tag,
  ExternalLink,
  Loader2,
  Check,
} from 'lucide-react';

export type Album = {
  id: string;
  title: string;
  artist: string;
  cover_url: string;
  year?: number | null;
  genre?: string | null;
  rating?: number | null;
  favorite_tracks?: string | null;
  review?: string | null;
  notes?: string | null;
  apple_music_url?: string | null;
  play_count?: number;
  created_at?: string;
};

type ItunesResult = {
  collectionId: number;
  collectionName: string;
  artistName: string;
  artworkUrl100: string;
  releaseDate: string;
  primaryGenreName: string;
  collectionViewUrl: string;
};

type TabId = 'shuffle' | 'add' | 'journal' | 'discotheque';

const ALL_GENRES = [
  'Hip-Hop',
  'R&B / Soul',
  'Funk',
  'Disco',
  'Jazz',
  'Electronic',
  'Synthwave',
  'House',
  'Techno',
  'Rock',
  'Pop',
  'Reggae / Dub',
  'Bande Originale / OST',
  'Autre',
];

// OBLIGATOIRE : L'export par défaut du composant
export default function Home() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('shuffle');

  // État Toast Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // États Shuffle & Animations
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [genreFilter, setGenreFilter] = useState<string>('Tous');
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [favoriteTracksInput, setFavoriteTracksInput] = useState('');
  const [reviewInput, setReviewInput] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  // États Ajout - Mode Streaming (iTunes API)
  const [addMode, setAddMode] = useState<'streaming' | 'custom'>('streaming');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ItunesResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);

  // États Ajout - Mode Custom
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [customYear, setCustomYear] = useState('');
  const [customGenre, setCustomGenre] = useState('Hip-Hop');
  const [customCover, setCustomCover] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [addingAlbum, setAddingAlbum] = useState(false);

  // État accordéon Journal
  const [expandedJournalId, setExpandedJournalId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const fetchAlbums = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur Supabase:', error.message);
    } else if (data) {
      setAlbums(data as Album[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const genresList = [
    'Tous',
    ...Array.from(
      new Set(
        albums
          .map((a) => a.genre)
          .filter((g): g is string => Boolean(g))
      )
    ),
  ];

  const handleShuffle = () => {
    const pool = genreFilter === 'Tous' ? albums : albums.filter((a) => a.genre === genreFilter);
    if (pool.length === 0) {
      showToast('Aucun album disponible pour ce genre');
      return;
    }

    setIsSpinning(true);
    setSelectedAlbum(null);

    setTimeout(() => {
      const random = pool[Math.floor(Math.random() * pool.length)];
      setSelectedAlbum(random);
      setRatingInput(random.rating || 5);
      setFavoriteTracksInput(random.favorite_tracks || '');
      setReviewInput(random.review || '');
      setIsSpinning(false);
    }, 1200);
  };

  const handleSaveReview = async () => {
    if (!selectedAlbum) return;
    setSavingReview(true);

    const { error } = await supabase
      .from('albums')
      .update({
        rating: ratingInput,
        favorite_tracks: favoriteTracksInput,
        review: reviewInput,
        play_count: (selectedAlbum.play_count || 0) + 1,
      })
      .eq('id', selectedAlbum.id);

    if (error) {
      showToast(`Erreur : ${error.message}`);
    } else {
      showToast('Avis enregistré avec succès !');
      await fetchAlbums();
    }
    setSavingReview(false);
  };

  const handleSearchItunes = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          searchQuery
        )}&entity=album&limit=8`
      );
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Erreur de recherche iTunes:', err);
      showToast('Erreur lors de la recherche iTunes');
    } finally {
      setSearching(false);
    }
  };

  const isAlbumInCollection = (title: string, artist: string) => {
    return albums.some(
      (a) =>
        a.title.toLowerCase().trim() === title.toLowerCase().trim() &&
        a.artist.toLowerCase().trim() === artist.toLowerCase().trim()
    );
  };

  const handleImportItunesAlbum = async (item: ItunesResult) => {
    setImportingId(item.collectionId);

    const hdCover = item.artworkUrl100
      ? item.artworkUrl100.replace('100x100bb', '600x600bb')
      : '';
    const releaseYear = item.releaseDate
      ? new Date(item.releaseDate).getFullYear()
      : null;

    const newAlbum = {
      title: item.collectionName,
      artist: item.artistName,
      year: releaseYear,
      genre: 'Hip-Hop',
      cover_url: hdCover,
      apple_music_url: item.collectionViewUrl,
    };

    const { error } = await supabase.from('albums').insert([newAlbum]);

    if (error) {
      showToast(`Erreur : ${error.message}`);
    } else {
      showToast(`"${item.collectionName}" ajouté à la collection !`);
      await fetchAlbums();
      setTab('discotheque');
    }
    setImportingId(null);
  };

  const handleAddCustomAlbum = async () => {
    if (!customTitle || !customArtist) {
      showToast('Le titre et l’artiste sont obligatoires');
      return;
    }
    setAddingAlbum(true);

    const newAlbum = {
      title: customTitle,
      artist: customArtist,
      year: customYear ? parseInt(customYear) : null,
      genre: customGenre,
      cover_url:
        customCover ||
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      notes: customNotes,
    };

    const { error } = await supabase.from('albums').insert([newAlbum]);

    if (error) {
      showToast(`Erreur : ${error.message}`);
    } else {
      showToast('Album ajouté à ta collection !');
      setCustomTitle('');
      setCustomArtist('');
      setCustomYear('');
      setCustomCover('');
      setCustomNotes('');
      await fetchAlbums();
      setTab('discotheque');
    }
    setAddingAlbum(false);
  };

  const toggleJournalExpand = (id: string) => {
    setExpandedJournalId(expandedJournalId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+80px)] px-4 relative">
      {toastMessage && (
        <div className="fixed top-[calc(env(safe-area-inset-top)+8px)] left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[350px]">
          <div className="flex items-center gap-2.5 bg-purple-950/90 border border-purple-500/40 text-purple-100 px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-xl text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[393px]">
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-32 bg-slate-800/60 rounded-lg"></div>
            <div className="h-48 w-full bg-slate-900/80 rounded-3xl border border-slate-800"></div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <div className="aspect-square bg-slate-900/60 rounded-2xl"></div>
              <div className="aspect-square bg-slate-900/60 rounded-2xl"></div>
            </div>
          </div>
        )}

        {!loading && tab === 'shuffle' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
              <span className="uppercase tracking-wider text-[11px]">
                {albums.length} ALBUMS DISPONIBLES
              </span>
              <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-full px-3 py-1">
                <ListFilter className="h-3 w-3 text-purple-400" />
                <select
                  value={genreFilter}
                  onChange={(e) => setGenreFilter(e.target.value)}
                  className="bg-transparent text-[11px] text-white focus:outline-none"
                >
                  {genresList.map((g) => (
                    <option key={g} value={g || ''} className="bg-slate-900 text-white">
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950 p-6 text-center shadow-xl">
              <div className="mx-auto my-3 flex h-36 w-36 items-center justify-center rounded-full border-4 border-purple-500/20 bg-purple-950/20 shadow-inner">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-purple-500/40 bg-slate-900">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-600/30 text-purple-400">
                    <Disc3
                      className={`h-8 w-8 transition-transform duration-700 ${
                        isSpinning ? 'animate-spin text-purple-300' : 'animate-spin-slow'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleShuffle}
                disabled={isSpinning}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3.5 text-xs font-extrabold text-white shadow-lg shadow-purple-600/30 active:scale-95 transition-all disabled:opacity-60"
              >
                <Shuffle className={`h-4 w-4 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>{isSpinning ? 'RECHERCHE EN COURS...' : 'TIRER UN ALBUM AU SORT'}</span>
              </button>
            </div>

            {selectedAlbum && !isSpinning && (
              <div className="rounded-3xl border border-purple-500/30 bg-slate-900/80 p-4 space-y-4 shadow-lg">
                <div className="flex gap-3 items-center">
                  <img
                    src={selectedAlbum.cover_url}
                    alt={selectedAlbum.title}
                    className="h-20 w-20 rounded-2xl object-cover shrink-0 shadow-md"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-white truncate">
                      {selectedAlbum.title}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">{selectedAlbum.artist}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {selectedAlbum.year && (
                        <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">
                          {selectedAlbum.year}
                        </span>
                      )}
                      {selectedAlbum.genre && (
                        <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300 font-medium">
                          {selectedAlbum.genre}
                        </span>
                      )}
                    </div>

                    {selectedAlbum.apple_music_url && (
                      <a
                        href={selectedAlbum.apple_music_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-500 px-3 py-1 text-[11px] font-bold text-white shadow-md active:scale-95 transition-all"
                      >
                        <Music className="h-3 w-3" />
                        <span>Écouter sur Apple Music</span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-80" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      TA NOTE
                    </span>
                    <div className="flex gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => setRatingInput(s)}>
                          <Star
                            className={`h-4 w-4 ${
                              s <= ratingInput ? 'fill-amber-400' : 'text-slate-800'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Morceaux préférés..."
                    value={favoriteTracksInput}
                    onChange={(e) => setFavoriteTracksInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />

                  <textarea
                    rows={2}
                    placeholder="Note personnelle..."
                    value={reviewInput}
                    onChange={(e) => setReviewInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                  />

                  <button
                    onClick={handleSaveReview}
                    disabled={savingReview}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 transition-all disabled:opacity-50"
                  >
                    {savingReview ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    <span>Enregistrer l'avis</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && tab === 'add' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">Ajouter un album</h2>
              <p className="text-xs text-slate-400">Depuis Apple Music ou import perso.</p>
            </div>

            <div className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-1">
              <button
                onClick={() => setAddMode('streaming')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  addMode === 'streaming'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Streaming (Apple)
              </button>
              <button
                onClick={() => setAddMode('custom')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  addMode === 'custom'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Import Perso / Mixtape
              </button>
            </div>

            {addMode === 'streaming' ? (
              <div className="space-y-3">
                <form onSubmit={handleSearchItunes} className="relative">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Artiste, album... (ex: Three 6 Mafia)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 py-3 pl-10 pr-12 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="submit"
                    disabled={searching}
                    className="absolute right-2 top-2 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white"
                  >
                    {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'OK'}
                  </button>
                </form>

                {searchResults.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase px-1">
                      Résultats iTunes ({searchResults.length})
                    </p>
                    {searchResults.map((item) => {
                      const inCollection = isAlbumInCollection(
                        item.collectionName,
                        item.artistName
                      );

                      return (
                        <div
                          key={item.collectionId}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-2.5 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={
                                item.artworkUrl100
                                  ? item.artworkUrl100.replace('100x100bb', '200x200bb')
                                  : ''
                              }
                              alt={item.collectionName}
                              className="h-12 w-12 rounded-xl object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">
                                {item.collectionName}
                              </h4>
                              <p className="text-[11px] text-slate-400 truncate">
                                {item.artistName}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {item.releaseDate ? new Date(item.releaseDate).getFullYear() : ''}
                              </p>
                            </div>
                          </div>

                          {inCollection ? (
                            <span className="shrink-0 flex items-center gap-1 rounded-xl bg-slate-800 text-emerald-400 border border-emerald-500/30 px-2.5 py-1.5 text-[10px] font-bold">
                              <Check className="h-3 w-3" />
                              <span>En collection</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleImportItunesAlbum(item)}
                              disabled={importingId === item.collectionId}
                              className="shrink-0 flex items-center gap-1 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 px-3 py-2 text-xs font-bold transition-all disabled:opacity-50"
                            >
                              {importingId === item.collectionId ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="h-3.5 w-3.5" />
                                  <span>Ajouter</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Titre *</label>
                  <input
                    type="text"
                    placeholder="Titre de l'album"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-base sm:text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Artiste *</label>
                  <input
                    type="text"
                    placeholder="Nom de l'artiste"
                    value={customArtist}
                    onChange={(e) => setCustomArtist(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-base sm:text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Année</label>
                    <input
                      type="number"
                      placeholder="2026"
                      value={customYear}
                      onChange={(e) => setCustomYear(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-base sm:text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Genre</label>
                    <select
                      value={customGenre}
                      onChange={(e) => setCustomGenre(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-base sm:text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      {ALL_GENRES.map((g) => (
                        <option key={g} value={g} className="bg-slate-900 text-white">
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    URL de la pochette
                  </label>
                  <input
                    type="text"
                    placeholder="https://.../cover.jpg"
                    value={customCover}
                    onChange={(e) => setCustomCover(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-base sm:text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Notes / Localisation
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: K7 gravée, vinyle trouvé à Memphis..."
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-base sm:text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <button
                  onClick={handleAddCustomAlbum}
                  disabled={addingAlbum}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/30 active:scale-95 transition-all disabled:opacity-50"
                >
                  {addingAlbum ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>Importer cet album</span>
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && tab === 'journal' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">Mes Notes & Journal</h2>
              <p className="text-xs text-slate-400">
                {albums.filter((a) => a.rating).length} albums notés
              </p>
            </div>

            <div className="space-y-3">
              {albums
                .filter((a) => a.rating)
                .map((album) => {
                  const isExpanded = expandedJournalId === album.id;
                  return (
                    <div
                      key={album.id}
                      className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 transition-all"
                    >
                      <div
                        onClick={() => toggleJournalExpand(album.id)}
                        className="flex gap-3 p-3 items-center cursor-pointer active:bg-slate-800/50"
                      >
                        <img
                          src={album.cover_url}
                          alt={album.title}
                          className="h-14 w-14 rounded-xl object-cover shrink-0 shadow"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-white truncate">{album.title}</h4>
                          <p className="text-xs text-slate-400 truncate">{album.artist}</p>
                          <div className="mt-1 flex items-center gap-1 text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3 w-3 ${
                                  s <= (album.rating || 0) ? 'fill-amber-400' : 'text-slate-800'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        )}
                      </div>

                      {isExpanded && (
                        <div className="border-t border-slate-800/80 bg-slate-950/60 p-3 space-y-2 text-xs">
                          {album.favorite_tracks && (
                            <div className="flex items-start gap-2 text-purple-300">
                              <Music className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              <div>
                                <span className="font-bold text-[10px] uppercase text-slate-400 block">
                                  Top Titres
                                </span>
                                <span>{album.favorite_tracks}</span>
                              </div>
                            </div>
                          )}

                          {album.review && (
                            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-300 italic">
                              « {album.review} »
                            </div>
                          )}

                          {album.notes && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Tag className="h-3 w-3 text-slate-500" />
                              <span>{album.notes}</span>
                            </div>
                          )}

                          {album.apple_music_url && (
                            <a
                              href={album.apple_music_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:underline pt-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Ouvrir dans Apple Music</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {!loading && tab === 'discotheque' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">Discothèque</h2>
              <p className="text-xs text-slate-400">Toute ta collection en un coup d'œil.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] uppercase text-slate-400 font-bold">Total Albums</span>
                <span className="block text-lg font-black text-white mt-0.5">{albums.length}</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] uppercase text-slate-400 font-bold">Note Moyenne</span>
                <span className="block text-lg font-black text-purple-400 mt-0.5">
                  {(
                    albums.reduce((acc, a) => acc + (a.rating || 0), 0) /
                    (albums.filter((a) => a.rating).length || 1)
                  ).toFixed(1)}{' '}
                  / 5
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {albums.map((album) => (
                <div
                  key={album.id}
                  className="relative group overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900 active:scale-95 transition-all"
                >
                  <div className="relative aspect-square w-full">
                    <img
                      src={album.cover_url}
                      alt={album.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-2.5 flex flex-col justify-end">
                      <h4 className="truncate text-xs font-bold text-white">{album.title}</h4>
                      <p className="truncate text-[10px] text-slate-300">{album.artist}</p>
                      <div className="flex items-center gap-0.5 text-amber-400 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-2.5 w-2.5 ${
                              s <= (album.rating || 0) ? 'fill-amber-400' : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/80 bg-[#0A0D14]/95 backdrop-blur-xl px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
        <div className="mx-auto flex max-w-[393px] items-center justify-around">
          <NavTab
            active={tab === 'shuffle'}
            onClick={() => setTab('shuffle')}
            icon={<Shuffle className="h-5 w-5" />}
            label="Shuffle"
          />
          <NavTab
            active={tab === 'add'}
            onClick={() => setTab('add')}
            icon={<Plus className="h-5 w-5" />}
            label="Ajouter"
          />
          <NavTab
            active={tab === 'journal'}
            onClick={() => setTab('journal')}
            icon={<Star className="h-5 w-5" />}
            label="Journal"
          />
          <NavTab
            active={tab === 'discotheque'}
            onClick={() => setTab('discotheque')}
            icon={<Library className="h-5 w-5" />}
            label="Collection"
          />
        </div>
      </nav>
    </div>
  );
}

function NavTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-1 px-3 transition-all ${
        active ? 'text-purple-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {icon}
      <span className="text-[10px] tracking-tight">{label}</span>
    </button>
  );
}