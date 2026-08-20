/**
 * Which shape the touch build takes, and which way round it is.
 *
 * Plain values with no client directive on purpose: the page reads them on the
 * server to seed the first paint from the user agent, and the hooks that refine
 * them in the browser live in `lib/hooks/useFormFactor.ts`.
 */

/** Shape of the touch chrome. */
export enum TouchLayout {
  /** Phones: one column, sky windows cut into the reading. */
  Deck = "deck",
  /** Tablets: a permanent sky window with the reading beside it. */
  Bridge = "bridge",
}

/** Which way the bridge is arranged. */
export enum BridgeOrientation {
  Landscape = "landscape",
  Portrait = "portrait",
}
