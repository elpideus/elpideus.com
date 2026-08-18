"use client";

/**
 * Live channel statistics with a silent fallback.
 *
 * If the API is unreachable, misconfigured or rate limited, the site shows the
 * static numbers instead and reports the reason to the console only. A visitor
 * must never see an error because a third party is having a bad day.
 */

import { useEffect, useState } from "react";

import { CHANNEL } from "@/lib/content/studio";

/** Where the numbers on screen came from. */
export enum StatsSource {
  Fallback = "fallback",
  Live = "live",
}

export interface ChannelStats {
  readonly subscribers: number;
  readonly views: number;
  readonly videos: number;
  readonly source: StatsSource;
}

const FALLBACK: ChannelStats = {
  subscribers: CHANNEL.fallback.subscribers,
  views: CHANNEL.fallback.views,
  videos: CHANNEL.fallback.videos,
  source: StatsSource.Fallback,
};

export function useChannelStats(): ChannelStats {
  const [stats, setStats] = useState<ChannelStats>(FALLBACK);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/youtube", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`youtube route responded ${response.status}`);
        return response.json() as Promise<Partial<ChannelStats>>;
      })
      .then((payload) => {
        if (typeof payload.subscribers !== "number") return;
        setStats({
          subscribers: payload.subscribers,
          views: payload.views ?? FALLBACK.views,
          videos: payload.videos ?? FALLBACK.videos,
          source: StatsSource.Live,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("[channel stats] falling back to static numbers:", error);
      });

    return () => controller.abort();
  }, []);

  return stats;
}

/** Drops a trailing zero decimal, so 1.0 reads as 1 rather than 1.0. */
function trim(value: string): string {
  return value.replace(/\.0+$/, "");
}

/** Compact human readable formatting, for example 1.4K, 1M or 1.02M. */
export function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${trim((value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 2))}M`;
  }
  if (value >= 1_000) return `${trim((value / 1_000).toFixed(value >= 10_000 ? 0 : 1))}K`;
  return String(value);
}
