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
  const players = api.map((p) => {
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
  void warmPodiumSkins(players);
  return players;
});

/**
 * The animated models need each player's skin file, which the server fetches from Mojang the first
 * time it is asked (a few upstream calls). Start that for the podium now, while the page is still
 * being built and sent, so the files are cached by the time the browser asks for them.
 */
async function warmPodiumSkins(players: Player[]) {
  try {
    const [{ getSkinPng }, { ranked }] = await Promise.all([import("./skin-texture.server"), import("./tiers")]);
    for (const p of ranked(players).slice(0, 3)) void getSkinPng(p.name);
  } catch {
    /* warming is only an optimisation */
  }
}

/** Same idea for a single player's profile page. */
export const warmSkin = createServerFn({ method: "GET" })
  .inputValidator((name: string) => name)
  .handler(async ({ data }) => {
    const { getSkinPng, isValidSkinName } = await import("./skin-texture.server");
    if (isValidSkinName(data)) void getSkinPng(data);
    return true;
  });
