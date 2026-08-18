/** Content for Rigel, the video and channel star. */

export const CHANNEL = {
  name: "elpideus",
  href: "https://youtube.com/@elpideus",
  /** Channel id used by the stats route. Public data only. */
  handle: "@elpideus",
  opened: "24 March 2021",
  body: [
    "I have been editing since 2019, from Windows Movie Maker and Bandicam to Sony Vegas, the Adobe suite and finally DaVinci Resolve, which still runs the pipeline today.",
    "The channel went quiet for a few years while school, code and life took priority. It came back in September 2024 with videos and, above all, live streams.",
  ],
  /** Fallbacks used when the YouTube API is unavailable. */
  fallback: {
    subscribers: 1400,
    views: 1_000_000,
    videos: 0,
  },
  featuredVideo: {
    id: "SrIuKrPx0ew",
    href: "https://www.youtube.com/watch?v=SrIuKrPx0ew",
    title: "Featured video",
  },
  tools: ["DaVinci Resolve", "After Effects", "Photoshop", "OBS"],
} as const;
