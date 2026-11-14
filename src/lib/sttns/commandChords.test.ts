import { describe, expect, it } from "vitest";
import {
  CHORD_TABLE,
  chordNavigateUrl,
  detectChordPrefix,
  findChord,
  groupChordsForHelp,
  shouldIgnoreForChord,
} from "@/lib/sttns/commandChords";

describe("commandChords — KF2 Command Chord Spine", () => {
  it("détecte uniquement les préfixes g et n minuscules", () => {
    expect(detectChordPrefix("g")).toBe("g");
    expect(detectChordPrefix("n")).toBe("n");
    expect(detectChordPrefix("G")).toBeNull();
    expect(detectChordPrefix("k")).toBeNull();
  });

  it("ignore les événements avec modifieur ou dans un champ de saisie", () => {
    expect(shouldIgnoreForChord({ key: "g", ctrlKey: true }, null)).toBe(true);
    expect(shouldIgnoreForChord({ key: "g", metaKey: true }, null)).toBe(true);
    expect(shouldIgnoreForChord({ key: "g", altKey: true }, null)).toBe(true);
    expect(
      shouldIgnoreForChord({ key: "g" }, { tagName: "INPUT" })
    ).toBe(true);
    expect(
      shouldIgnoreForChord({ key: "g" }, { tagName: "TEXTAREA" })
    ).toBe(true);
    expect(
      shouldIgnoreForChord({ key: "g" }, { tagName: "SELECT" })
    ).toBe(true);
    expect(
      shouldIgnoreForChord({ key: "g" }, { tagName: "DIV", isContentEditable: true })
    ).toBe(true);
    expect(shouldIgnoreForChord({ key: "g" }, { tagName: "BODY" })).toBe(false);
  });

  it("resout les accords g <lettre> vers la bonne route", () => {
    const gw = findChord("g", "w");
    expect(gw?.navigate).toBe("/why");
    expect(chordNavigateUrl(gw!, "acme")).toBe("/projects/acme/why");

    const gk = findChord("g", "k");
    expect(gk?.navigate).toBe("/kanban");
    expect(chordNavigateUrl(gk!, "demo")).toBe("/projects/demo/kanban");
  });

  it("resout les accords n <lettre> vers un quickAction connu", () => {
    expect(findChord("n", "u")?.quickAction).toBe("persona");
    expect(findChord("n", "p")?.quickAction).toBe("pain_point");
    expect(findChord("n", "j")?.quickAction).toBe("jtbd");
    expect(findChord("n", "e")?.quickAction).toBe("epic");
    expect(findChord("n", "f")?.quickAction).toBe("feature");
    expect(findChord("n", "s")?.quickAction).toBe("story");
  });

  it("est insensible à la casse sur la seconde touche", () => {
    expect(findChord("g", "W")?.navigate).toBe("/why");
    expect(findChord("n", "F")?.quickAction).toBe("feature");
  });

  it("retourne null pour les touches inconnues", () => {
    expect(findChord("g", "z")).toBeNull();
    expect(findChord("n", "x")).toBeNull();
    expect(findChord("g", "ww")).toBeNull();
  });

  it("ne contient aucun doublon (prefix,key)", () => {
    const seen = new Set<string>();
    for (const entry of CHORD_TABLE) {
      const key = `${entry.prefix}:${entry.key}`;
      expect(seen.has(key), `Doublon accord ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it("groupe les accords pour l'aide contextuelle", () => {
    const groups = groupChordsForHelp();
    expect(groups).toHaveLength(2);
    expect(groups[0].prefix).toBe("g");
    expect(groups[1].prefix).toBe("n");
    expect(groups[0].entries.every((e) => e.navigate)).toBe(true);
    expect(groups[1].entries.every((e) => e.quickAction)).toBe(true);
  });
});
