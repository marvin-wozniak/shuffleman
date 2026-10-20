'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Loader2,
  Plus,
  Music2,
  Upload,
  Check,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AlbumInput, iTunesAlbum } from '@/lib/supabase';
import { searchITunesAlbums } from '@/lib/itunes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type AddTabProps = {
  onAdd: (input: AlbumInput) => Promise<boolean>;
};

const GENRES = [
  'Hip-Hop',
  'Memphis Rap',
  'Jazz',
  'Synthwave',
  'Dream Pop',
  'Shoegaze',
  'Neo-Soul',
  'Ambient',
  'Indie Rock',
  'Folk',
  'Synth Pop',
  'Disco House',
  'Post-Rock',
  'Lo-Fi',
  'Alt Rock',
  'New Wave',
  'Chillwave',
  'Classical',
  'Electronic',
  'Other',
];

export function AddAlbumTab({ onAdd }: AddTabProps) {
  const [mode, setMode] = useState<'streaming' | 'custom'>('streaming');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          Ajouter un album
        </h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Enrichis ta discothèque depuis Apple Music ou en import perso.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-full border border-border/60 bg-secondary/40 p-1">
        <button
          onClick={() => setMode('streaming')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-all',
            mode === 'streaming'
              ? 'bg-apple text-white glow-apple'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Music2 className="h-3.5 w-3.5" />
          Streaming (Apple Music)
        </button>
        <button
          onClick={() => setMode('custom')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-all',
            mode === 'custom'
              ? 'bg-primary text-primary-foreground glow-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          Import Perso / Mixtape
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'streaming' ? (
          <motion.div
            key="streaming"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <StreamingForm onAdd={onAdd} />
          </motion.div>
        ) : (
          <motion.div
            key="custom"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <CustomForm onAdd={onAdd} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StreamingForm({ onAdd }: { onAdd: (i: AlbumInput) => Promise<boolean> }) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<iTunesAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<iTunesAlbum | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!term.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const r = await searchITunesAlbums(term);
      setResults(r);
      setLoading(false);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [term]);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const ok = await onAdd({
      title: selected.title,
      artist: selected.artist,
      cover_url: selected.coverUrl,
      release_year: selected.year,
      genre: selected.genre,
      apple_music_url: selected.appleMusicUrl,
      is_custom: false,
    });
    setSaving(false);
    if (ok) {
      setSaved(true);
      setSelected(null);
      setTerm('');
      setResults([]);
      setTimeout(() => setSaved(false), 2200);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Recherche iTunes (artiste, album…)"
          className="h-11 pl-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {results.length > 0 && (
        <div className="max-h-80 space-y-1 overflow-y-auto rounded-xl border border-border/60 bg-card/60 p-1.5 no-scrollbar">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors',
                selected?.id === r.id
                  ? 'bg-primary/15 ring-1 ring-primary/40'
                  : 'hover:bg-secondary/60'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.coverUrl}
                alt={r.title}
                className="h-11 w-11 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {r.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.artist}
                  {r.year ? ` · ${r.year}` : ''}
                  {r.genre ? ` · ${r.genre}` : ''}
                </p>
              </div>
              {selected?.id === r.id && (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}

      {!loading && term.trim() && results.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Aucun résultat sur iTunes. Essaie une autre recherche.
        </p>
      )}

      {selected && (
        <div className="rounded-xl border border-border/60 bg-card/80 p-3">
          <div className="flex gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.coverUrl}
              alt={selected.title}
              className="h-20 w-20 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{selected.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {selected.artist}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {selected.year && (
                  <Badge variant="secondary" className="text-[10px]">
                    {selected.year}
                  </Badge>
                )}
                {selected.genre && (
                  <Badge
                    variant="outline"
                    className="border-primary/40 text-[10px] text-primary"
                  >
                    {selected.genre}
                  </Badge>
                )}
                {selected.appleMusicUrl && (
                  <a
                    href={selected.appleMusicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-apple"
                  >
                    <ExternalLink className="h-3 w-3" /> Apple Music
                  </a>
                )}
              </div>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="mt-3 h-9 w-full gap-2 bg-apple text-xs font-semibold text-white hover:bg-apple/90"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Ajouter à ma discothèque
          </Button>
        </div>
      )}

      {saved && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 py-3 text-sm text-primary">
          <Check className="h-4 w-4" />
          Album ajouté avec succès !
        </div>
      )}
    </div>
  );
}

function CustomForm({ onAdd }: { onAdd: (i: AlbumInput) => Promise<boolean> }) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('Hip-Hop');
  const [coverUrl, setCoverUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!title.trim() || !artist.trim()) {
      setError('Le titre et l\'artiste sont requis.');
      return;
    }
    if (!coverUrl.trim()) {
      setError('Une URL de pochette est requise.');
      return;
    }
    const yearNum = year.trim() ? Number(year) : null;
    if (yearNum != null && (Number.isNaN(yearNum) || yearNum < 1900 || yearNum > 2100)) {
      setError('Année invalide (1900–2100).');
      return;
    }

    setSaving(true);
    const ok = await onAdd({
      title: title.trim(),
      artist: artist.trim(),
      cover_url: coverUrl.trim(),
      release_year: yearNum,
      genre,
      is_custom: true,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTitle('');
      setArtist('');
      setYear('');
      setGenre('Hip-Hop');
      setCoverUrl('');
      setNotes('');
      setTimeout(() => setSaved(false), 2200);
    } else {
      setError('Échec de l\'enregistrement. Réessaie.');
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label className="text-xs">Titre *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de l'album"
            className="h-10 text-sm"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Artiste *</Label>
          <Input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Nom de l'artiste"
            className="h-10 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs">Année</Label>
            <Input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              inputMode="numeric"
              placeholder="2024"
              className="h-10 text-sm"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Genre</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GENRES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">URL de la pochette *</Label>
          <Input
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://…/cover.jpg"
            className="h-10 text-sm"
          />
          {coverUrl.trim() && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt="Aperçu pochette"
              className="mt-1 h-20 w-20 rounded-lg object-cover ring-1 ring-border/60"
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = '0.2';
              }}
            />
          )}
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Notes / Localisation</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: K7 gravée, vinyle trouvé à Memphis…"
            className="min-h-[60px] text-sm"
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {saved && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 py-2 text-xs text-primary">
          <Check className="h-4 w-4" />
          Album importé avec succès !
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={saving}
        className="h-10 w-full gap-2 bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Importer cet album
      </Button>
    </div>
  );
}
