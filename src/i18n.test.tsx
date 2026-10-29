import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { readLanguage, persistLanguage, translate } from "./i18n";
import { bodies } from "./data/bodies";
import { englishBodyCopy, englishTourStops } from "./data/body-translations";
beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});
describe("language preference", () => {
  it("defaults to English and rejects unsupported stored values", () => {
    expect(readLanguage()).toBe("en");
    localStorage.setItem("orbita-language", "de");
    expect(readLanguage()).toBe("en");
  });
  it("persists an explicit Polish or English choice", () => {
    persistLanguage("pl");
    expect(readLanguage()).toBe("pl");
    persistLanguage("en");
    expect(readLanguage()).toBe("en");
  });
  it("keeps working when storage access or writing is blocked", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(readLanguage()).toBe("en");
    expect(() => persistLanguage("pl")).not.toThrow();
  });
  it("translates all nine bodies and all guided stops without modifying physical data", () => {
    expect(Object.keys(englishBodyCopy).sort()).toEqual(
      bodies.map((b) => b.id).sort(),
    );
    for (const b of bodies) {
      const copy = englishBodyCopy[b.id];
      expect(copy.name).toBeTruthy();
      expect(copy.kind).toBeTruthy();
      expect(copy.description.length).toBeGreaterThan(30);
      expect(copy.fact.length).toBeGreaterThan(20);
    }
    expect(englishTourStops.map((s) => s.id)).toEqual([
      "sun",
      "earth",
      "jupiter",
      "saturn",
      "neptune",
    ]);
    expect(translate("en", "Wstrzymaj symulację")).toBe("Pause simulation");
    expect(translate("pl", "Wstrzymaj symulację")).toBe("Wstrzymaj symulację");
  });
});
