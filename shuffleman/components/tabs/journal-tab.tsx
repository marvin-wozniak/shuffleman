'use client';

import { useMemo, useState } from 'react';
import { Quote, Music2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Album } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/star-rating';

type JournalTabProps = {
  albums: Album[];
};

type SortMode = 'recent' | 'best';
type StarFilter = 0 | 1 | 2 | 3 | 4 | 5;

export function JournalTab({ albums }: JournalTabProps) {
  const [sort, setSort] = useState<SortMode>('recent');
  const [starFilter, setStarFilter] = useState<StarFilter>(0);

  const reviewed = useMemo(
    () => albums.filter((a) => a.rating != null && a.rating > 0),
    [albums]
  );

  const filtered = useMemo(() => {
    let list = reviewed;
    if (starFilter > 0) {
      list = list.filter((a) => a.rating === starFilter);
    }
    const sorted = [...list];
    if (sort === 'recent') {
      sorted.sort(
        (a, b) =>
          new Date(b.last_played_at ?? b.created_at).getTime() -
          new Date(a.last_played_at ?? a.created_at).getTime()
      );
    } else {
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return sorted;
  }, [reviewed, sort, starFilter]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          Mes Notes &amp; Journal
        </h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          {reviewed.length} album{reviewed.length > 1 ? 's' : ''} noté
          {reviewed.length > 1 ? 's' : ''}.
        </p>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-1 rounded-full border border-border/60 bg-secondary/40 p-1 text-xs">
        {(['recent', 'best'] as SortMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setSort(m)}
            className={cn(
              'flex-1 rounded-full py-1.5 font-semibold transition-all',
              sort === m
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {m === 'recent' ? 'Récemment notés' : 'Meilleures notes'}
          </button>
        ))}
      </div>

      {/* Star filter chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {([0, 5, 4, 3, 2, 1] as StarFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStarFilter(s)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all',
              starFilter === s
                ? 'border-amber-glow/60 bg-amber-glow/15 text-amber-glow'
                : 'border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground'
            )}
          >
            {s === 0 ? 'Toutes' : `${s}★`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-12 text-center text-muted-foreground">
          <Music2 className="h-8 w-8" />
          <p className="text-xs">
            Aucune note pour ce filtre. Tire un album et note-le dans l'onglet
            Shuffle.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((album) => (
            <JournalCard key={album.id} album={album} />
          ))}
        </div>
      )}
    </div>
  );
}

function JournalCard({ album }: { album: Album }) {
  const dateStr = album.last_played_at
    ? new Date(album.last_played_at).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const tracks = album.favorite_tracks
    ?.split(',')
    .map((t) => t.trim())
    .filter(Boolean) ?? [];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/70 p-3 backdrop-blur sm:flex-row sm:gap-4 sm:p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={album.cover_url}
        alt={`${album.title} — ${album.artist}`}
        className="h-20 w-20 shrink-0 rounded-lg object-cover sm:h-24 sm:w-24"
      />

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {album.title}
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              {album.artist}
              {album.release_year ? ` · ${album.release_year}` : ''}
            </p>
          </div>
          <StarRating value={album.rating} readOnly size={14} />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {album.genre && (
            <Badge
              variant="outline"
              className="border-primary/40 text-[10px] text-primary"
            >
              {album.genre}
            </Badge>
          )}
          {dateStr && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {dateStr}
            </span>
          )}
          {album.play_count > 0 && (
            <span className="text-[10px] text-muted-foreground">
              · {album.play_count} écoute{album.play_count > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {tracks.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Top titres
            </p>
            <p className="text-xs text-foreground/90">{tracks.join(' · ')}</p>
          </div>
        )}

        {album.review && (
          <blockquote className="flex gap-1.5 rounded-lg border-l-2 border-primary/50 bg-background/40 px-3 py-2 text-xs italic text-foreground/80">
            <Quote className="h-3 w-3 shrink-0 translate-y-0.5 text-primary/60" />
            <span>{album.review}</span>
          </blockquote>
        )}
      </div>
    </div>
  );
}
