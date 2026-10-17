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
  /** Mojang UUID (no dashes) when it could be resolved. Skins load by UUID, which survives renames and rate limits. */
  uuid?: string;
  region: string;
  tiers: Partial<Record<KitId, Tier>>;
};

export function points(p: Player) {
  return Object.values(p.tiers).reduce((s, t) => s + (t ? TIER_POINTS[t] : 0), 0);
}

export function title(pts: number) {
  if (pts >= 150) return "Combat Grandmaster";
  if (pts >= 100) return "Combat Master";
  if (pts >= 50) return "Combat Ace";
  if (pts >= 20) return "Combat Specialist";
  if (pts >= 10) return "Combat Cadet";
  return "Rookie";
}

type SkinSubject = { name: string; uuid?: string | undefined };

/**
 * Ordered list of skin image URLs to try. The first is used; if it fails to load, the
 * next one is tried. UUID lookups come first because name lookups are what get rate
 * limited when a whole leaderboard loads at once (which is what produced Steve heads).
 */
export function skinUrls(p: SkinSubject, kind: "head" | "body", size = 40): string[] {
  const id = p.uuid?.replace(/-/g, "");
  const name = encodeURIComponent(p.name);
  const px = size * 2; // 2x for sharp pixels on retina screens
  if (kind === "head")
    return [
      ...(id ? [`https://crafatar.com/avatars/${id}?size=${px}&overlay`] : []),
      `https://mc-heads.net/avatar/${id ?? name}/${px}`,
      `https://minotar.net/helm/${name}/${px}`,
    ];
  return [
    ...(id ? [`https://crafatar.com/renders/body/${id}?scale=10&overlay`] : []),
    `https://mc-heads.net/body/${id ?? name}/320`,
    `https://visage.surgeplay.com/full/320/${id ?? name}`,
  ];
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
