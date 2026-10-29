import type { MutableRefObject } from "react";
import type { Language } from "../i18n";
import type { Simulation } from "../lib/simulation";
export type Quality = "auto" | "low" | "high";
export interface SceneProps {
  language: Language;
  simulation: MutableRefObject<Simulation>;
  selected: string | null;
  navigation: number;
  reduced: boolean;
  hidden: boolean;
  orbits: boolean;
  labels: boolean;
  quality: Quality;
  textureVersion: number;
  onSelect: (id: string) => void;
  onReady: () => void;
  onQuality: (q: "low" | "high") => void;
  onTexture: (ok: boolean) => void;
  onFailure: () => void;
}
