import { describe, expect, it } from "vitest";
import { KITS, MAX_POINTS, TIER_POINTS, TITLES, title } from "@/lib/tiers";

describe("achievement titles", () => {
  it("rescales MCTiers' 480 point ladder to this site's maximum", () => {
    expect(KITS.length).toBe(3);
    expect(MAX_POINTS).toBe(180); // 3 kits x HT1 (60)
    expect(TITLES.map((t) => [t.name, t.min])).toEqual([
      ["Combat Grandmaster", 150],
      ["Combat Master", 94],
      ["Combat Ace", 38],
      ["Combat Specialist", 19],
      ["Combat Cadet", 8],
      ["Combat Novice", 4],
      ["Rookie", 0],
    ]);
  });

  it("keeps each title's share of the maximum within a point of MCTiers'", () => {
    const mctiers: Record<string, number> = { "Combat Grandmaster": 400, "Combat Master": 250, "Combat Ace": 100, "Combat Specialist": 50, "Combat Cadet": 20, "Combat Novice": 10 };
    for (const t of TITLES) {
      const base = mctiers[t.name];
      if (base === undefined) continue;
      expect(Math.abs(t.min - (base / 480) * MAX_POINTS)).toBeLessThanOrEqual(0.5);
    }
  });

  it("awards the right title either side of every threshold", () => {
    const cases: [number, string][] = [
      [0, "Rookie"], [3, "Rookie"], [4, "Combat Novice"], [7, "Combat Novice"], [8, "Combat Cadet"], [18, "Combat Cadet"],
      [19, "Combat Specialist"], [37, "Combat Specialist"], [38, "Combat Ace"], [93, "Combat Ace"], [94, "Combat Master"],
      [149, "Combat Master"], [150, "Combat Grandmaster"], [180, "Combat Grandmaster"],
    ];
    for (const [pts, name] of cases) expect(title(pts), `${pts} points`).toBe(name);
  });

  it("describes each threshold with the same number it uses", () => {
    for (const t of TITLES.slice(0, -1)) expect(t.desc).toBe(`Obtained ${t.min}+ total points.`);
    expect(TITLES[TITLES.length - 1]!.desc).toContain(`less than ${TITLES[TITLES.length - 2]!.min} points`);
  });

  it("is balanced: every title can actually be reached with three kits, and a perfect score is Grandmaster", () => {
    const values = [0, ...Object.values(TIER_POINTS)]; // 0 = untested
    const totals = new Set<number>();
    for (const a of values) for (const b of values) for (const c of values) totals.add(a + b + c);
    expect(Math.max(...totals)).toBe(MAX_POINTS);
    for (const t of TITLES) expect([...totals].some((n) => title(n) === t.name), t.name).toBe(true);
    expect(title(MAX_POINTS)).toBe("Combat Grandmaster");
  });
});
