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

The animated 3D players (podium and profile page) use [skinview3d](https://github.com/bs-community/skinview3d), loaded lazily. They need the raw skin file, which `GET /api/skin/<username>` serves from Mojang's texture server (`src/lib/skin-texture.server.ts`, cached in memory and by the CDN). If that lookup or WebGL fails, the player stays as the crafty.gg image.
