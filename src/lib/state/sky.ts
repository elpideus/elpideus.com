"use client";

/**
 * Hover state for the background sky, plus the index the picker searches.
 *
 * The sky is drawn as point clouds, which have no scene graph nodes to attach
 * pointer events to and far too many points to raycast comfortably. Instead the
 * layers register their positions here, and `SkyPicker` runs a cheap angular
 * search against them once per frame.
 */

/** A registered point cloud that can be hovered. */
export interface SkyLayerIndex {
  /** Identity of the layer, used for hover keys. */
  readonly seed: number;
  /**
   * First slot of this layer in the global name space. Layers occupy disjoint
   * ranges, which is what keeps names unique across the whole sky.
   */
  readonly slotBase: number;
  /** Flat xyz triples, in the layer's own space. */
  readonly positions: Float32Array;
  /**
   * Point indices this layer offers to the pointer, as offsets into
   * `positions`. Only a subset of the sky is hoverable, because every label is
   * a real catalogued object and there are more points than there are stars
   * worth naming.
   */
  readonly indices: Uint32Array;
  /**
   * True when the layer is parented to the camera, in which case its positions
   * are relative to the camera and the search has to offset them.
   */
  readonly cameraLocked: boolean;
}

const layers = new Map<number, SkyLayerIndex>();

export function registerSkyLayer(layer: SkyLayerIndex): () => void {
  layers.set(layer.seed, layer);
  return () => {
    layers.delete(layer.seed);
  };
}

export function skyLayers(): Iterable<SkyLayerIndex> {
  return layers.values();
}

/** The currently hovered background star, if any. */
export interface SkyHover {
  /** Identity of the point, so the tooltip only re-renders on a real change. */
  key: string;
  /** The most familiar name of the object. */
  name: string;
  /** Its other catalogue identifiers, most familiar first. */
  aliases: readonly string[];
  /** Screen position in CSS pixels, refreshed every frame. */
  x: number;
  y: number;
}

const hover: SkyHover = { key: "", name: "", aliases: [], x: 0, y: 0 };

type SkyListener = (key: string) => void;
const listeners = new Set<SkyListener>();

export function subscribeSkyHover(listener: SkyListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Read the live hover record. Callers must not hold on to it across frames. */
export function readSkyHover(): Readonly<SkyHover> {
  return hover;
}

/**
 * Publishes the hovered point. Position updates are silent; only a change of
 * identity notifies subscribers, so the tooltip re-renders once per star rather
 * than once per frame.
 */
export function setSkyHover(
  key: string,
  name: string,
  aliases: readonly string[],
  x: number,
  y: number,
): void {
  const changed = key !== hover.key;
  hover.key = key;
  hover.name = name;
  hover.aliases = aliases;
  hover.x = x;
  hover.y = y;
  if (changed) for (const listener of listeners) listener(key);
}

export function clearSkyHover(): void {
  if (hover.key === "") return;
  hover.key = "";
  hover.name = "";
  hover.aliases = [];
  for (const listener of listeners) listener("");
}
