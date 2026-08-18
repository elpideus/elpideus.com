/**
 * Public channel statistics.
 *
 * The API key never reaches the browser, the response is cached so the quota is
 * not burned by traffic, and every failure path returns the static fallback
 * with a console message instead of an error the visitor could see.
 */

import { NextResponse } from "next/server";

import { CHANNEL } from "@/lib/content/studio";

export const runtime = "nodejs";
/** One hour is plenty: subscriber counts move slowly and are rounded anyway. */
export const revalidate = 3600;

interface YouTubeStatistics {
  subscriberCount?: string;
  viewCount?: string;
  videoCount?: string;
}

interface YouTubeResponse {
  items?: { statistics?: YouTubeStatistics }[];
}

/** Shape returned to the client, live or not. */
interface StatsPayload {
  subscribers: number;
  views: number;
  videos: number;
  source: "live" | "fallback";
}

const FALLBACK: StatsPayload = {
  subscribers: CHANNEL.fallback.subscribers,
  views: CHANNEL.fallback.views,
  videos: CHANNEL.fallback.videos,
  source: "fallback",
};

function buildEndpoint(apiKey: string): string {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  const base = "https://www.googleapis.com/youtube/v3/channels?part=statistics";
  const selector = channelId
    ? `&id=${encodeURIComponent(channelId)}`
    : `&forHandle=${encodeURIComponent(CHANNEL.handle)}`;
  return `${base}${selector}&key=${apiKey}`;
}

export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    // Not an error: a local checkout without credentials is a normal state.
    return NextResponse.json(FALLBACK, {
      headers: { "cache-control": "public, max-age=300" },
    });
  }

  try {
    const response = await fetch(buildEndpoint(apiKey), {
      next: { revalidate },
    });
    if (!response.ok) throw new Error(`youtube api responded ${response.status}`);

    const payload = (await response.json()) as YouTubeResponse;
    const statistics = payload.items?.[0]?.statistics;
    if (!statistics?.subscriberCount) throw new Error("youtube api returned no statistics");

    const stats: StatsPayload = {
      subscribers: Number(statistics.subscriberCount) || FALLBACK.subscribers,
      views: Number(statistics.viewCount) || FALLBACK.views,
      videos: Number(statistics.videoCount) || FALLBACK.videos,
      source: "live",
    };

    return NextResponse.json(stats, {
      headers: { "cache-control": "public, max-age=1800, s-maxage=3600" },
    });
  } catch (error) {
    console.error("[youtube] serving fallback statistics:", error);
    return NextResponse.json(FALLBACK, {
      headers: { "cache-control": "public, max-age=120" },
    });
  }
}
