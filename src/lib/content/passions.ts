/** Passions shown on Aldebaran. */

export enum PassionKind {
  Gaming = "gaming",
  Music = "music",
  Editing = "editing",
  Writing = "writing",
}

export interface Passion {
  readonly kind: PassionKind;
  readonly title: string;
  readonly body: readonly string[];
  readonly notes: readonly string[];
  readonly href?: string;
  readonly hrefLabel?: string;
}

export const PASSIONS: readonly Passion[] = [
  {
    kind: PassionKind.Gaming,
    title: "Gaming",
    body: [
      "Genshin Impact above everything else: it is a far more deliberate piece of work than its reputation suggests, and I have a whole essay about why.",
      "Cyberpunk 2077 and Red Dead Redemption for the opposite reason: worlds that stay with you because they keep pointing back at real life.",
    ],
    notes: ["Genshin Impact", "Cyberpunk 2077", "Red Dead Redemption"],
  },
  {
    kind: PassionKind.Music,
    title: "Music",
    body: [
      "I play tamburello for Li Spizzicusi, a folk group from Carovigno. Guitar lessons in middle school, piano taught to myself, and a permanent weakness for orchestral game soundtracks.",
      "Yu-Peng Chen and HoYo-Mix are the reason I take game music seriously. Evan Call is close behind.",
    ],
    notes: ["Tamburello", "Guitar", "Piano", "HoYo-Mix"],
    href: "https://lispizzicusi.it",
    hrefLabel: "lispizzicusi.it",
  },
  {
    kind: PassionKind.Editing,
    title: "Video editing",
    body: [
      "Telling a story or explaining a feeling by combining footage, music and sound is close to alchemy for me. It is also the discipline that most shapes how I design interfaces: rhythm, timing, restraint.",
    ],
    notes: ["DaVinci Resolve", "Motion", "Sound design"],
  },
  {
    kind: PassionKind.Writing,
    title: "Writing",
    body: [
      "I am writing my first book, Spiriti dell'Oblio, a classic fantasy saga. Yes, a saga: the sequels are already planned.",
    ],
    notes: ["Spiriti dell'Oblio", "Fantasy", "Worldbuilding"],
  },
] as const;
