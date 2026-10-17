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

export const avatar = (name: string, size = 64) => `https://mc-heads.net/avatar/${name}/${size}`;
export const bodyRender = (name: string) => `https://mc-heads.net/body/${name}/240`;

export const playersQuery = {
  queryKey: ["players"],
  queryFn: () => getPlayers(),
  staleTime: 60_000,
};

export function ranked(players: Player[]) {
  return [...players].map((p) => ({ ...p, points: points(p) })).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
}
