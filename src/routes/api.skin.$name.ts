import { createFileRoute } from "@tanstack/react-router";
import { getSkinPng, isValidSkinName } from "@/lib/skin-texture.server";

// GET /api/skin/<username>  ->  the player's skin PNG (same-origin, so WebGL can read it).
export const Route = createFileRoute("/api/skin/$name")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!isValidSkinName(params.name)) return new Response("Invalid name", { status: 400 });
        const png = await getSkinPng(params.name);
        if (!png) return new Response("Skin not found", { status: 404, headers: { "cache-control": "public, max-age=60" } });
        return new Response(png as unknown as BodyInit, {
          headers: {
            "content-type": "image/png",
            "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        });
      },
    },
  },
});
