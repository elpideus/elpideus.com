/**
 * A filter over the three.js console.
 *
 * three routes every message it prints through one function, and lets an
 * application replace it. That is the only honest way to silence a warning
 * raised by a dependency: nothing in this repository constructs the object
 * being complained about, so there is no call site to fix.
 *
 * The list is deliberately exact rather than a pattern. A deprecation that we
 * could actually act on has to keep reaching the console, and a fuzzy match
 * would eventually swallow one.
 */

import { getConsoleFunction, setConsoleFunction } from "three";

/**
 * Messages raised for code we do not own. Each one needs a note saying who
 * causes it, so it can be dropped again when that dependency moves on.
 */
const MUTED = new Set([
  /*
   * @react-three/fiber builds a `THREE.Clock` for the `state.clock` every
   * `useFrame` callback reads. Deprecated in three r183 in favour of
   * `THREE.Timer`, still constructed by fiber 9.7. Remove when fiber migrates.
   */
  "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.",
]);

/**
 * Call once before a canvas mounts. Safe to call again: a filter already in
 * place is left alone rather than wrapped a second time.
 */
export function filterThreeConsole(): void {
  if (getConsoleFunction()) return;

  setConsoleFunction((type, message, ...params) => {
    if (MUTED.has(message)) return;
    console[type](message, ...params);
  });
}
