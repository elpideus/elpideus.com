/** Identity, location and the short prose used across the map. */

/** Birth date, used to derive the age shown on the site. */
export const BIRTH_DATE = new Date(Date.UTC(2003, 1, 9));

/**
 * Age in whole years at the given moment. Computed at render time so the site
 * never ships a stale number.
 */
export function ageAt(now: Date = new Date()): number {
  let age = now.getUTCFullYear() - BIRTH_DATE.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < BIRTH_DATE.getUTCMonth() ||
    (now.getUTCMonth() === BIRTH_DATE.getUTCMonth() &&
      now.getUTCDate() < BIRTH_DATE.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** Years since the first line of PHP was written, same idea as `ageAt`. */
export const CODING_SINCE = 2017;

export function yearsCoding(now: Date = new Date()): number {
  return now.getUTCFullYear() - CODING_SINCE;
}

export const PROFILE = {
  name: "Stefan Narcis Cucoranu",
  handle: "elpideus",
  role: "Full Stack Developer & Designer",
  location: "Ostuni, Puglia, Italy",
  locationNote: 'The "White City" in southern Italy. Remote by default.',
  email: "elpideus@gmail.com",
  /** Short line under the name on the origin star. */
  lede: "Self taught full stack developer, designer and video maker.",
  intro: [
    "I build web products end to end: architecture, data, interface, motion. I started with PHP on a tablet in 2017 because a Telegram bot I relied on was abandoned, and I have not stopped since.",
    "Almost everything on this map is self taught. The parts that are not, I learned by breaking something first.",
  ],
  /** Rendered on the About star. */
  principles: [
    {
      title: "Problems are the point",
      body: "I like dissecting a problem, splitting it into pieces small enough to hold, then closing them one by one. You do not grow without hardship, falling and getting back up. That idea is literally my name.",
    },
    {
      title: "I know that I do not know",
      body: "Socrates got there first. Meeting a technology I have never touched is the part I enjoy most, because that is where growth happens.",
    },
    {
      title: "Finish or do not start",
      body: "I used to delete projects instead of leaving them half done. Learning to split big problems into small ones fixed that, and kept the sense of accomplishment intact.",
    },
    {
      title: "I can try",
      body: 'I never say "I cannot do it". I say "let me think it through". Adapting and learning fast is the skill I trust most.',
    },
    {
      title: "Details are the work",
      body: '"No one is going to notice" is not a reason. Form matters as much as content. Attention to detail is the difference between average and stunning.',
    },
    {
      title: "Fun is optional, finishing is not",
      body: "Once I decide a problem is mine, it gets solved regardless of how I feel about it that day.",
    },
    {
      title: "Open source is the ground floor",
      body: "Most great software stands on it. Most of my own work lives in the open too, including this site.",
    },
    {
      title: "I make my own tools",
      body: "Tools shaped around my workflow and personality, so things work the way I need them to.",
    },
  ],
  /** Small factual chips. */
  facts: [
    { label: "Based in", value: "Ostuni, Italy" },
    { label: "Languages", value: "Italian, English, Romanian" },
    { label: "Learning", value: "Mandarin Chinese" },
    { label: "Work mode", value: "Remote, distributed teams" },
  ],
  learning: {
    title: "Currently learning Chinese",
    body: "A long standing admiration for Chinese and Japanese culture: the warmth and wholesomeness of one, the deep respect of the other.",
  },
} as const;
