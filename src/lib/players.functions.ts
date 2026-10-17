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

// ---- name -> UUID resolution --------------------------------------------------------
// Skin services look players up by name through Mojang. Doing ~160 of those at once from
// every visitor's browser gets rate limited, and the failures come back as Steve. Instead
// we resolve names here, 10 per request via Mojang's bulk endpoint, and cache the result.
const UUID_TTL = 24 * 60 * 60_000;
const MISS_TTL = 30 * 60_000;
const VALID_NAME = /^[A-Za-z0-9_]{3,16}$/;
const uuidCache = new Map<string, { id: string | null; at: number }>();

async function resolveUuids(names: string[], budgetMs = 4000): Promise<void> {
  const now = Date.now();
  const todo = names.filter((n) => {
    if (!VALID_NAME.test(n)) return false;
    const hit = uuidCache.get(n.toLowerCase());
    return !hit || now - hit.at > (hit.id ? UUID_TTL : MISS_TTL);
  });
  const chunks: string[][] = [];
  for (let i = 0; i < todo.length; i += 10) chunks.push(todo.slice(i, i + 10));

  const lookup = async (chunk: string[]) => {
    try {
      const res = await fetch("https://api.mojang.com/profiles/minecraft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(chunk),
        signal: AbortSignal.timeout(3500),
      });
      if (!res.ok) return; // rate limited or down: leave uncached so a later request retries
      const found = (await res.json()) as { id: string; name: string }[];
      const byName = new Map(found.map((f) => [f.name.toLowerCase(), f.id]));
      for (const n of chunk) uuidCache.set(n.toLowerCase(), { id: byName.get(n.toLowerCase()) ?? null, at: Date.now() });
    } catch {
      /* network error: skip this batch */
    }
  };

  // a few batches in flight at a time, and never hold the page up longer than the budget
  const queue = [...chunks];
  const worker = async () => {
    for (let c = queue.shift(); c; c = queue.shift()) await lookup(c);
  };
  await Promise.race([
    Promise.all(Array.from({ length: 4 }, worker)),
    new Promise<void>((r) => setTimeout(r, budgetMs)),
  ]);
}

export const getPlayers = createServerFn({ method: "GET" }).handler(async (): Promise<Player[]> => {
  const res = await fetch(API, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Tier API responded ${res.status}`);
  const json = (await res.json()) as { players?: ApiPlayer[] };
  const api = json.players ?? [];
  await resolveUuids(api.filter((p) => !p.uuid).map((p) => p.ign));
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
    const uuid = (p.uuid ?? uuidCache.get(p.ign.toLowerCase())?.id ?? undefined)?.replace(/-/g, "");
    return { name: p.ign, region: region || "—", tiers, ...(uuid ? { uuid } : {}) };
  });
});
