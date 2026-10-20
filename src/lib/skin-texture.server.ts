/**
 * Raw skin files for the animated 3D models.
 *
 * crafty.gg only publishes rendered images, not the skin file itself, and a 3D model has
 * to be built from that file. So, for the handful of animated players (podium + profile),
 * we fetch the skin from Mojang's texture server here on the server and cache it. Nothing
 * else on the site uses this: heads and still images come from crafty.gg, and if this
 * lookup fails the player simply stays as the crafty.gg image.
 */

const VALID_NAME = /^[A-Za-z0-9_]{1,16}$/;
const OK_TTL = 6 * 60 * 60_000; // a found skin is reused for 6h
const MISS_TTL = 5 * 60_000; // failures are retried after 5 minutes (covers rate limits)
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

type Entry = { png: Uint8Array | null; at: number };
const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<Uint8Array | null>>();

export const isValidSkinName = (name: string) => VALID_NAME.test(name);

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { signal: AbortSignal.timeout(4000), headers: { accept: "application/json" } });
  // 204 / 404 = no such player, 429 = rate limited: all mean "no skin right now"
  return res.status === 200 ? ((await res.json()) as T) : null;
}

async function fetchSkin(name: string): Promise<Uint8Array | null> {
  const profile = await getJson<{ id?: string }>(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(name)}`);
  if (!profile?.id) return null;

  const session = await getJson<{ properties?: { name: string; value: string }[] }>(
    `https://sessionserver.mojang.com/session/minecraft/profile/${profile.id}`,
  );
  const encoded = session?.properties?.find((p) => p.name === "textures")?.value;
  if (!encoded) return null;

  const textures = JSON.parse(atob(encoded)) as { textures?: { SKIN?: { url?: string } } };
  const skinUrl = textures.textures?.SKIN?.url;
  if (!skinUrl) return null;

  // Only ever fetch from Mojang's texture host, so this can't be used to fetch arbitrary URLs.
  const path = new URL(skinUrl).pathname;
  if (!/^\/texture\/[0-9a-f]{16,64}$/i.test(path)) return null;
  const img = await fetch(`https://textures.minecraft.net${path}`, { signal: AbortSignal.timeout(4000) });
  if (!img.ok) return null;

  const bytes = new Uint8Array(await img.arrayBuffer());
  if (bytes.length > 300_000 || !PNG_MAGIC.every((b, i) => bytes[i] === b)) return null;
  return bytes;
}

export async function getSkinPng(name: string): Promise<Uint8Array | null> {
  const key = name.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < (hit.png ? OK_TTL : MISS_TTL)) return hit.png;

  // several visitors asking for the same player share one lookup
  let pending = inflight.get(key);
  if (!pending) {
    pending = fetchSkin(name)
      .catch(() => null)
      .then((png) => {
        cache.set(key, { png, at: Date.now() });
        return png;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }
  return pending;
}
