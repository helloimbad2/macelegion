import { createServerFn } from "@tanstack/react-start";
import type { KitId, Player, Tier } from "./tiers";

const API = "https://tiersapi.wisp.uno/api/getallinfo";

const MODE: Record<string, KitId> = {
  diamace: "diamondmace",
  diamondmace: "diamondmace",
  macepot: "macepot",
  macesmp: "macesmp",
  smp: "macesmp",
  mace: "macesmp",
};

type ApiPlayer = { ign: string; uuid?: string; tiers?: { gamemode: string; region?: string; tier: string }[] };

export const getPlayers = createServerFn({ method: "GET" }).handler(async (): Promise<Player[]> => {
  const res = await fetch(API, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Tier API responded ${res.status}`);
  const json = (await res.json()) as { players?: ApiPlayer[] };
  const api = json.players ?? [];
  return api.map((p) => {
    const tiers: Player["tiers"] = {};
    let region = "";
    for (const t of p.tiers ?? []) {
      const kit = MODE[t.gamemode.toLowerCase()];
      const tier = t.tier.toUpperCase().match(/[HL]T[1-5]/)?.[0] as Tier | undefined;
      if (!kit || !tier) continue;
      tiers[kit] = tier;
      if (!region && t.region) region = t.region.toUpperCase();
    }
    const raw = p.uuid?.replace(/-/g, "");
    const uuid = raw && /^[0-9a-f]{32}$/i.test(raw) ? raw : undefined;
    return { name: p.ign, region: region || "—", tiers, ...(uuid ? { uuid } : {}) };
  });
});
