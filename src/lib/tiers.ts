import { getPlayers } from "./players.functions";
import logo from "@/assets/logo.png";
import maceSmp from "@/assets/kit-macesmp.png";
import diamondMace from "@/assets/kit-diamondmace.png";
import macePot from "@/assets/kit-macepot.png";

export const logoUrl = logo;

export type KitId = "macesmp" | "diamondmace" | "macepot";
export type Tier = "HT1" | "LT1" | "HT2" | "LT2" | "HT3" | "LT3" | "HT4" | "LT4" | "HT5" | "LT5";

export const KITS: { id: KitId; name: string; icon: string }[] = [
  { id: "macesmp", name: "Mace SMP", icon: maceSmp },
  { id: "diamondmace", name: "Diamond Mace", icon: diamondMace },
  { id: "macepot", name: "Mace Pot", icon: macePot },
];

export const TIER_POINTS: Record<Tier, number> = {
  HT1: 60, LT1: 45, HT2: 30, LT2: 20, HT3: 10, LT3: 6, HT4: 4, LT4: 3, HT5: 2, LT5: 1,
};

export type Player = {
  name: string;
  /** Optional Minecraft UUID, used for skins instead of the name when the tier API provides one. */
  uuid?: string;
  region: string;
  tiers: Partial<Record<KitId, Tier>>;
};

export function points(p: Player) {
  return Object.values(p.tiers).reduce((s, t) => s + (t ? TIER_POINTS[t] : 0), 0);
}

/**
 * Achievement titles, highest first. `min` is the total points needed.
 *
 * The ladder is MCTiers' (400 / 250 / 100 / 50 / 20 / 10), which was built for a 480 point
 * maximum: 8 gamemodes x 60. Here the maximum is every kit at HT1, so each threshold is
 * rescaled by (our max / 480) and rounded to a whole point. That keeps every title exactly as
 * hard to reach, relative to a perfect score, as it is on MCTiers. Adding a kit rescales the
 * ladder automatically.
 */
const MCTIERS_MAX_POINTS = 8 * 60;
export const MAX_POINTS = KITS.length * TIER_POINTS.HT1;
const scaled = (mctiersMin: number) => Math.round((mctiersMin * MAX_POINTS) / MCTIERS_MAX_POINTS);

const LADDER = [
  ["Combat Grandmaster", 400, "#f6c453"],
  ["Combat Master", 250, "#f5b23c"],
  ["Combat Ace", 100, "#f2517a"],
  ["Combat Specialist", 50, "#b78cf6"],
  ["Combat Cadet", 20, "#9b9cf2"],
  ["Combat Novice", 10, "#8d8ff0"],
] as const;

export const TITLES: { name: string; min: number; color: string; desc: string }[] = [
  ...LADDER.map(([name, base, color]) => {
    const min = scaled(base);
    return { name, min, color, desc: `Obtained ${min}+ total points.` };
  }),
  { name: "Rookie", min: 0, color: "#7d8493", desc: `Starting rank for players with less than ${scaled(10)} points.` },
];

export function title(pts: number) {
  return (TITLES.find((t) => pts >= t.min) ?? TITLES[TITLES.length - 1]!).name;
}

type SkinSubject = { name: string; uuid?: string | undefined };

/**
 * All skins come from crafty.gg's render service (https://crafty.gg/skin-service), which
 * resolves usernames itself.
 *   head - flat 2D face
 *   bust - 3D head and shoulders, Crafty's own default camera (used on the podium)
 *   body - 3D full body, at the angle Crafty uses in its own docs
 * Their API only exposes camera angle, size, shadow and cape (no limb posing), so the
 * `FULL_BODY_ANGLE` below is the one knob to turn if the profile figure needs re-angling.
 * Returns [primary, fallback]: the fallback is Crafty's own Steve, so a failed load never
 * shows a broken image.
 */
const FULL_BODY_ANGLE = "width=300&height=360&x=-30&z=50";

export function skinUrls(p: SkinSubject, kind: "head" | "bust" | "body", size = 40): string[] {
  const who = encodeURIComponent(p.uuid?.replace(/-/g, "") ?? p.name);
  const steve = "MHF_Steve";
  if (kind === "head") {
    const px = Math.min(1024, Math.max(32, size * 2)); // 2x for sharp pixels on retina screens
    return [`https://render.crafty.gg/2d/head/${who}?size=${px}`, `https://render.crafty.gg/2d/head/${steve}?size=${px}`];
  }
  if (kind === "bust") return [`https://render.crafty.gg/3d/bust/${who}`, `https://render.crafty.gg/3d/bust/${steve}`];
  return [`https://render.crafty.gg/3d/full/${who}?${FULL_BODY_ANGLE}`, `https://render.crafty.gg/3d/full/${steve}?${FULL_BODY_ANGLE}`];
}

export const playersQuery = {
  queryKey: ["players"],
  queryFn: () => getPlayers(),
  staleTime: 60_000,
};

export function ranked(players: Player[]) {
  return [...players].map((p) => ({ ...p, points: points(p) })).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
}

export const REGIONS: Record<string, { name: string; short: string; color: string }> = {
  NA: { name: "North America", short: "N. America", color: "#ff6b6b" },
  EU: { name: "Europe", short: "Europe", color: "#5ee08a" },
  AS: { name: "Asia", short: "Asia", color: "#b48cf7" },
  SA: { name: "South America", short: "S. America", color: "#f6c453" },
  OC: { name: "Oceania", short: "Oceania", color: "#5cc8f0" },
  AU: { name: "Oceania", short: "Oceania", color: "#5cc8f0" },
  AF: { name: "Africa", short: "Africa", color: "#f89f5a" },
};
export const regionInfo = (code: string) => REGIONS[code] ?? { name: code, short: code, color: "oklch(0.6 0 0)" };
