import { describe, expect, it } from "vitest";
import { computeCoverage, loadData, validateData } from "../scripts/lib/data.mjs";

const data = loadData();

describe("catalog data", () => {
  it("passes schema and integrity validation", () => {
    expect(validateData(data)).toEqual([]);
  });

  it("detects duplicate ids, broken relationships and bad translation references", () => {
    const broken = {
      makes: [
        { id: "a", name: "A", aliases: [] },
        { id: "a", name: "A2", aliases: [] },
      ],
      models: [
        { id: "a/x", makeId: "a", name: "X", aliases: [] },
        { id: "a/x", makeId: "a", name: "X again", aliases: [] },
        { id: "zzz/y", makeId: "zzz", name: "Y", aliases: [] },
      ],
      locales: { xx: { makes: { nope: { name: "N" } }, models: { "a/none": { name: "N" } } } },
    };
    const errors = validateData(broken).join("\n");
    expect(errors).toContain("duplicate make id: a");
    expect(errors).toContain("duplicate model id: a/x");
    expect(errors).toContain("unknown make: zzz");
    expect(errors).toContain("unknown make id nope");
    expect(errors).toContain("unknown model id a/none");
  });

  it("flags makes without models", () => {
    const errors = validateData({ makes: [{ id: "a", name: "A", aliases: [] }], models: [], locales: {} });
    expect(errors).toContain("make a has no models");
  });

  it("rejects blank names and aliases", () => {
    const blank = {
      makes: [{ id: "a", name: "  ", aliases: [""] }],
      models: [],
      locales: {},
    };
    expect(validateData(blank).length).toBeGreaterThan(0);
  });

  it("reports coverage per locale", () => {
    const c = computeCoverage(data);
    expect(c.makes).toBe(data.makes.length);
    expect(c.locales.ar!.translatedMakes + c.locales.ar!.missingMakes.length).toBe(c.makes);
    expect(c.locales.ar!.translatedModels + c.locales.ar!.missingModels.length).toBe(c.models);
  });

  it("keeps Arabic names free of Latin letters", () => {
    const names = [
      ...Object.values(data.locales.ar.makes),
      ...Object.values(data.locales.ar.models),
    ].flatMap((e: any) => [e.name, ...(e.aliases ?? [])]);
    // Only the "الفئة A/B/C…" style aliases intentionally keep a Latin letter.
    const offenders = names.filter((n: string) => /[A-Za-z]/.test(n) && !/^الفئة [A-Z]$/.test(n));
    expect(offenders).toEqual([]);
  });
});

describe("id stability", () => {
  it("keeps every previously published make and model id", async () => {
    const snapshot = (await import("./ids.snapshot.json")).default as {
      makes: string[];
      models: string[];
    };
    const makes = new Set(data.makes.map((m: any) => m.id));
    const models = new Set(data.models.map((m: any) => m.id));
    expect(snapshot.makes.filter((id) => !makes.has(id))).toEqual([]);
    expect(snapshot.models.filter((id) => !models.has(id))).toEqual([]);
  });

  it("detects colliding search keys", () => {
    const errors = validateData({
      makes: [{ id: "a", name: "A", aliases: [] }],
      models: [
        { id: "a/x", makeId: "a", name: "Xr", aliases: [] },
        { id: "a/y", makeId: "a", name: "Y", aliases: ["xr"] },
      ],
      locales: {},
    }).join("\n");
    expect(errors).toContain('"xr" is used by both a/x and a/y');
  });
});
