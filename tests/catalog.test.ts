import { describe, expect, it } from "vitest";
import { createCatalog, normalizeSearchText } from "../src";
import ar from "../src/locales/ar";

describe("lookups", () => {
  const en = createCatalog();

  it("links makes and models", () => {
    const models = en.getModels("toyota");
    expect(models.length).toBeGreaterThan(5);
    expect(models.every((m) => m.makeId === "toyota")).toBe(true);
    expect(en.getModel("toyota/camry")).toMatchObject({
      id: "toyota/camry",
      makeId: "toyota",
      name: "Camry",
      displayName: "Camry",
      translated: false,
    });
  });

  it("returns [] / undefined for unknown ids", () => {
    expect(en.getModels("nope")).toEqual([]);
    expect(en.getModels("constructor")).toEqual([]);
    expect(en.getMake("nope")).toBeUndefined();
    expect(en.getModel("toyota/nope")).toBeUndefined();
    expect(en.getMake("__proto__")).toBeUndefined();
  });

  it("returns localized display names with canonical name preserved", () => {
    const catalog = createCatalog({ locale: "ar", translations: ar });
    expect(catalog.getModel("toyota/camry")).toEqual({
      id: "toyota/camry",
      makeId: "toyota",
      name: "Camry",
      displayName: "كامري",
      translated: true,
    });
    expect(catalog.getMake("toyota")?.displayName).toBe("تويوتا");
  });

  it("falls back to the canonical name when a translation is missing", () => {
    const catalog = createCatalog({ locale: "ar", translations: ar });
    const porsche911 = catalog.getModel("porsche/911");
    expect(porsche911).toMatchObject({ displayName: "911", translated: false });

    const partial = createCatalog({
      translations: { makes: { toyota: { name: "   " } } },
    });
    expect(partial.getMake("toyota")).toMatchObject({ displayName: "Toyota", translated: false });
  });

  it("tolerates unsupported locale tags and ignores unknown translation ids", () => {
    const catalog = createCatalog({
      locale: "not a locale!",
      translations: { makes: { "no-such-make": { name: "x" } } },
    });
    expect(catalog.getMakes().length).toBeGreaterThan(0);
    expect(catalog.getMake("no-such-make")).toBeUndefined();
  });

  it("sorts lists by display name", () => {
    const names = en.getMakes().map((m) => m.displayName);
    const sorted = [...names].sort(new Intl.Collator().compare);
    expect(names).toEqual(sorted);
  });
});

describe("immutability", () => {
  it("does not let consumers mutate internal data", () => {
    const catalog = createCatalog();
    const make = catalog.getMake("toyota")!;
    expect(() => {
      (make as { displayName: string }).displayName = "hacked";
    }).toThrow(TypeError);

    const list = catalog.getMakes();
    list.length = 0;
    list.push(make);
    expect(catalog.getMakes().length).toBeGreaterThan(1);

    const models = catalog.getModels("toyota");
    models.reverse();
    expect(catalog.getModels("toyota")[0]).not.toBe(models[0]);
    expect(Object.isFrozen(catalog.getModel("toyota/camry"))).toBe(true);
  });
});

describe("search", () => {
  const catalog = createCatalog({ locale: "ar", translations: ar });
  const en = createCatalog();

  it("ranks exact, then prefix, then partial matches", () => {
    const results = en.searchModels("rav");
    const ids = results.map((m) => m.id);
    expect(ids[0]).toBe("toyota/rav4"); // prefix
    const partial = en.searchModels("cruiser").map((m) => m.id);
    expect(partial).toContain("toyota/land-cruiser"); // partial

    const exact = en.searchModels("accord")[0]!;
    expect(exact.id).toBe("honda/accord");
    const ranked = en.searchModels("x").map((m) => m.name.toLowerCase());
    const firstPartial = ranked.findIndex((n) => !n.startsWith("x"));
    expect(ranked.slice(0, firstPartial).every((n) => n.startsWith("x"))).toBe(true);
  });

  it("puts exact matches before longer prefix matches", () => {
    const results = en.searchModels("tiggo 7");
    expect(results[0]!.id).toBe("chery/tiggo-7");
  });

  it("finds the same vehicle from Arabic and English queries", () => {
    const fromArabic = catalog.searchModels("كامري", { makeId: "toyota" })[0];
    const fromEnglish = catalog.searchModels("camry", { makeId: "toyota" })[0];
    expect(fromArabic?.id).toBe("toyota/camry");
    expect(fromEnglish?.id).toBe("toyota/camry");
    expect(en.searchModels("كامري")[0]?.id).toBeUndefined(); // no Arabic loaded
    expect(catalog.searchMakes("تويو")[0]?.id).toBe("toyota");
    expect(catalog.searchMakes("toy")[0]?.id).toBe("toyota");
  });

  it("matches aliases, canonical and localized", () => {
    expect(en.searchMakes("mercedes")[0]?.id).toBe("mercedes-benz");
    expect(catalog.searchModels("لاندكروزر")[0]?.id).toBe("toyota/land-cruiser");
    expect(catalog.searchModels("land cruiser prado")[0]?.id).toBe("toyota/prado");
  });

  it("normalizes case, whitespace, diacritics, tatweel, alef variants and hyphens", () => {
    expect(en.searchModels("  LAND   cruiser ")[0]?.id).toBe("toyota/land-cruiser");
    expect(en.searchModels("x trail")[0]?.id).toBe("nissan/x-trail");
    expect(catalog.searchModels("كَامِري")[0]?.id).toBe("toyota/camry");
    expect(catalog.searchModels("كـــامري")[0]?.id).toBe("toyota/camry");
    expect(catalog.searchModels("افالون")[0]?.id).toBe("toyota/avalon");
    expect(catalog.searchModels("أفالون")[0]?.id).toBe("toyota/avalon");
    expect(catalog.searchModels("إفالون")[0]?.id).toBe("toyota/avalon");
    expect(en.searchMakes("skoda")[0]?.id).toBe("skoda");
    expect(en.searchMakes("Škoda")[0]?.id).toBe("skoda");
  });

  it("normalization never alters display names", () => {
    const model = catalog.getModel("toyota/avalon")!;
    expect(model.displayName).toBe("أفالون");
    expect(normalizeSearchText("أفالون")).toBe("افالون");
  });

  it("returns the whole list for an empty query, subject to limit", () => {
    expect(en.searchMakes("")).toEqual(en.getMakes());
    expect(en.searchMakes("   ", { limit: 3 })).toHaveLength(3);
    expect(en.searchModels("", { makeId: "toyota" })).toEqual(en.getModels("toyota"));
    expect(en.searchModels("", { limit: 0 })).toEqual([]);
  });

  it("restricts to a make and treats an unknown make as empty", () => {
    const results = en.searchModels("", { makeId: "honda" });
    expect(results.every((m) => m.makeId === "honda")).toBe(true);
    expect(en.searchModels("camry", { makeId: "honda" })).toEqual([]);
    expect(en.searchModels("camry", { makeId: "nope" })).toEqual([]);
  });

  it("respects limit and rejects invalid limits", () => {
    expect(en.searchModels("a", { limit: 2 })).toHaveLength(2);
    expect(() => en.searchMakes("a", { limit: -1 })).toThrow(RangeError);
    expect(() => en.searchMakes("a", { limit: 1.5 })).toThrow(RangeError);
  });

  it("returns [] when nothing matches", () => {
    expect(en.searchMakes("zzzzzz")).toEqual([]);
  });
});

describe("independence", () => {
  it("keeps catalog instances with different languages isolated", () => {
    const arabic = createCatalog({ locale: "ar", translations: ar });
    const english = createCatalog({ locale: "en" });
    const arabicAgain = createCatalog({ locale: "ar", translations: ar });

    expect(arabic.getMake("toyota")?.displayName).toBe("تويوتا");
    expect(english.getMake("toyota")?.displayName).toBe("Toyota");
    expect(arabic.locale).toBe("ar");
    expect(english.locale).toBe("en");
    expect(arabicAgain.getMake("toyota")?.displayName).toBe("تويوتا");
    expect(english.searchMakes("تويو")).toEqual([]);
  });
});
