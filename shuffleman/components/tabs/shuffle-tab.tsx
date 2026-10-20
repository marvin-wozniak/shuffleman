'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shuffle,
  Disc3,
  Music2,
  ExternalLink,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Album, AlbumReviewInput } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/star-rating';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ShuffleTabProps = {
  albums: Album[];
  onLogListen: (album: Album, review: AlbumReviewInput) => Promise<boolean>;
};

export function ShuffleTab({ albums, onLogListen }: ShuffleTabProps) {
  const [genreFilter, setGenreFilter] = useState('all');
  const [picked, setPicked] = useState<Album | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const [cyclingCover, setCyclingCover] = useState<string | null>(null);

  const [rating, setRating] = useState<number>(0);
  const [favoriteTracks, setFavoriteTracks] = useState('');
  const [review, setReview] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const genres = Array.from(
    new Set(albums.map((a) => a.genre).filter(Boolean) as string[])
  ).sort();

  const pool = useMemo(() => {
    if (genreFilter === 'all') return albums;
    return albums.filter((a) => a.genre === genreFilter);
  }, [albums, genreFilter]);

  const handleShuffle = () => {
    if (pool.length === 0) return;
    setShuffling(true);
    setSaved(false);
    setRating(0);
    setFavoriteTracks('');
    setReview('');

    const start = Date.now();
    const duration = 1500;
    const tick = () => {
      const elapsed = Date.now() - start;
      if (elapsed < duration) {
        const random = pool[Math.floor(Math.random() * pool.length)];
        setCyclingCover(random.cover_url);
        window.requestAnimationFrame(tick);
      } else {
        const final = pool[Math.floor(Math.random() * pool.length)];
        setPicked(final);
        setCyclingCover(null);
        setShuffling(false);
        setRating(final.rating ?? 0);
        setFavoriteTracks(final.favorite_tracks ?? '');
        setReview(final.review ?? '');
      }
    };
    window.requestAnimationFrame(tick);
  };

  const handleSave = async () => {
    if (!picked || rating === 0) return;
    setSaving(true);
    const ok = await onLogListen(picked, {
      rating,
      favorite_tracks: favoriteTracks.trim() || null,
      review: review.trim() || null,
    });
    setSaving(false);
    if (ok) {
      setSaved(true);
      setPicked((p) =>
        p
          ? {
              ...p,
              rating,
              favorite_tracks: favoriteTracks.trim() || null,
              review: review.trim() || null,
            }
          : p
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {pool.length} album{pool.length > 1 ? 's' : ''} dans le tirage
        </p>
        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className="h-8 w-auto gap-1.5 rounded-full border-border/60 bg-secondary/50 px-3 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Genre : Tous</SelectItem>
            {genres.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Central vinyl card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-secondary/60 to-card/40 p-5 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-apple/15 blur-3xl" />

        <div className="relative flex flex-col items-center gap-5">
          <motion.div
            className="relative flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52"
            animate={shuffling ? { rotate: 360 } : { rotate: 0 }}
            transition={
              shuffling
                ? { duration: 0.6, repeat: Infinity, ease: 'linear' }
                : { duration: 0.3 }
            }
          >
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-transparent" />
            <div className="absolute inset-3 rounded-full border border-border/60 bg-background/60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Disc3
                className={cn(
                  'h-24 w-24 text-primary/70',
                  shuffling ? 'animate-pulse-glow' : 'opacity-80'
                )}
              />
            </div>
            <div className="absolute inset-0 rounded-full ring-1 ring-primary/20" />
          </motion.div>

          <Button
            onClick={handleShuffle}
            disabled={shuffling || pool.length === 0}
            className="group relative h-12 w-full max-w-xs gap-2.5 rounded-full bg-primary text-base font-semibold text-primary-foreground glow-primary hover:bg-primary/90 sm:text-lg"
          >
            <Shuffle className={cn('h-5 w-5', shuffling && 'animate-pulse')} />
            {shuffling ? 'Tirage en cours…' : 'TIRER UN ALBUM AU SORT'}
          </Button>
        </div>
      </div>

      {/* Revealed album */}
      <AnimatePresence mode="wait">
        {picked && !shuffling && (
          <motion.div
            key={picked.id}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur"
          >
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:gap-5 sm:p-5">
              <div className="relative mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-xl bg-muted/40 sm:h-44 sm:w-44">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={picked.cover_url}
                  alt={`${picked.title} — ${picked.artist}`}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col gap-3 text-center sm:text-left">
                <div>
                  <h2 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
                    {picked.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {picked.artist}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    {picked.release_year && (
                      <Badge variant="secondary" className="text-[10px]">
                        {picked.release_year}
                      </Badge>
                    )}
                    {picked.genre && (
                      <Badge
                        variant="outline"
                        className="border-primary/40 text-[10px] text-primary"
                      >
                        {picked.genre}
                      </Badge>
                    )}
                    {picked.is_custom ? (
                      <Badge
                        variant="outline"
                        className="border-amber-glow/40 text-[10px] text-amber-glow"
                      >
                        📀 Import Local / Mixtape
                      </Badge>
                    ) : (
                      picked.apple_music_url && (
                        <a
                          href={picked.apple_music_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-apple px-3 py-1 text-[10px] font-semibold text-white glow-apple transition-transform hover:scale-105"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Écouter sur Apple Music
                        </a>
                      )
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/50 p-3 text-left">
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Ta note
                    </Label>
                    <StarRating value={rating} onChange={setRating} size={20} />
                  </div>

                  <Input
                    value={favoriteTracks}
                    onChange={(e) => setFavoriteTracks(e.target.value)}
                    placeholder="Morceaux préférés (ex: Track 1, Track 4…)"
                    className="mb-2 h-9 text-xs"
                  />

                  <Textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Note personnelle / journal d'écoute…"
                    className="min-h-[72px] text-xs"
                  />

                  <Button
                    onClick={handleSave}
                    disabled={saving || rating === 0}
                    className="mt-3 h-9 w-full gap-2 bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : saved ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {saved
                      ? 'Enregistré !'
                      : saving
                        ? 'Enregistrement…'
                        : '✅ Enregistrer l\'écoute & l\'avis'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {pool.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-12 text-center text-muted-foreground">
          <Music2 className="h-8 w-8" />
          <p className="text-xs">
            Aucun album dans ce genre. Ajoute-en un dans l'onglet « Ajouter ».
          </p>
        </div>
      )}
    </div>
  );
}
