'use client';

import { useMemo } from 'react';
import { Disc3, Headphones, Star, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Album } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/star-rating';

type DiscothequeTabProps = {
  albums: Album[];
};

export function DiscothequeTab({ albums }: DiscothequeTabProps) {
  const stats = useMemo(() => {
    const total = albums.length;
    const totalPlays = albums.reduce((s, a) => s + (a.play_count ?? 0), 0);
    const rated = albums.filter((a) => a.rating != null && a.rating > 0);
    const avg =
      rated.length > 0
        ? rated.reduce((s, a) => s + (a.rating ?? 0), 0) / rated.length
        : 0;
    return {
      total,
      totalPlays,
      ratedCount: rated.length,
      avg,
    };
  }, [albums]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          Discothèque
        </h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Toute ta collection, en un coup d'œil.
        </p>
      </div>

      {/* Stats 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Disc3 className="h-4 w-4" />}
          label="TOTAL ALBUMS"
          value={String(stats.total)}
        />
        <StatCard
          icon={<Headphones className="h-4 w-4" />}
          label="TOTAL ÉCOUTES"
          value={String(stats.totalPlays)}
        />
        <StatCard
          icon={<Star className="h-4 w-4" />}
          label="ALBUMS NOTÉS"
          value={String(stats.ratedCount)}
        />
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="NOTE MOYENNE"
          value={`${stats.avg.toFixed(1)} / 5`}
          highlight
        />
      </div>

      {/* Collection grid 2-col */}
      {albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-12 text-center text-muted-foreground">
          <Disc3 className="h-8 w-8" />
          <p className="text-xs">
            Ta discothèque est vide. Ajoute un album pour commencer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {albums.map((album) => (
            <CollectionCard key={album.id} album={album} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3 backdrop-blur transition-colors',
        highlight
          ? 'border-primary/40 bg-primary/10'
          : 'border-border/60 bg-card/60'
      )}
    >
      <div
        className={cn(
          'mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider',
          highlight ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        {icon}
        {label}
      </div>
      <p className="text-lg font-bold tabular-nums text-foreground sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

function CollectionCard({ album }: { album: Album }) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-muted/40">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={album.cover_url}
        alt={`${album.title} — ${album.artist}`}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <p className="truncate text-xs font-semibold text-white">
          {album.title}
        </p>
        <p className="truncate text-[10px] text-white/70">
          {album.artist}
        </p>
        <div className="mt-1 flex items-center justify-between gap-1">
          {album.genre && (
            <Badge
              variant="outline"
              className="border-white/30 bg-black/40 text-[9px] text-white"
            >
              {album.genre}
            </Badge>
          )}
          {album.rating != null && album.rating > 0 && (
            <StarRating value={album.rating} readOnly size={10} />
          )}
        </div>
      </div>

      {album.is_custom && (
        <div className="absolute left-2 top-2">
          <Badge className="border-none bg-amber-glow/90 text-[9px] text-black">
            📀 Mixtape
          </Badge>
        </div>
      )}
    </div>
  );
}
