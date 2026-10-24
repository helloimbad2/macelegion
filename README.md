# Mace Legion

Tier list for the Mace SMP, Diamond Mace and Mace Pot kits: overall rankings, per-kit tier lists and player profiles.

## Develop

```sh
bun install
bun run dev
```

Other scripts: `bun run build`, `bun run preview`, `bun run test`, `bun run lint`.

## Stack

- TanStack Start (React, file-based routing, server functions)
- TypeScript
- Tailwind CSS v4
- Nitro for deployment (auto-detects Vercel; set a preset in `vite.config.ts` for other hosts)

Player data comes from the tier API in `src/lib/players.functions.ts`. Heads and still images load from crafty.gg.

The animated 3D players (podium and profile page) use [skinview3d](https://github.com/bs-community/skinview3d), loaded lazily. They need the raw skin file, which `GET /api/skin/<username>` serves from Mojang's texture server (`src/lib/skin-texture.server.ts`, cached in memory and by the CDN). While a model loads, a soft silhouette holds its place. Only if the model can't be shown (no skin file, no WebGL, reduced motion or data saver) does the player fall back to the crafty.gg image. The skin files are downloaded in parallel with the 3D engine, prefetched when a row is hovered, and warmed on the server for the podium.
