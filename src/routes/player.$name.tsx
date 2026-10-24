import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { KITS, TIER_POINTS, playersQuery, ranked, regionInfo, title } from "@/lib/tiers";
import { warmSkin } from "@/lib/players.functions";
import { KitTier } from "@/components/tier-ui";
import { PlayerViewer } from "@/components/player-viewer";

export const Route = createFileRoute("/player/$name")({
  loader: ({ context, params }) => {
    // on a direct visit the server starts fetching this player's skin while it builds the page
    if (typeof window === "undefined") void warmSkin({ data: params.name }).catch(() => {});
    return context.queryClient.ensureQueryData(playersQuery);
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.name} — Mace Legion Tiers` },
      { name: "description", content: `${params.name}'s tiers in Mace SMP, Diamond Mace and Mace Pot.` },
      { property: "og:title", content: `${params.name} — Mace Legion` },
      { property: "og:description", content: `${params.name}'s tiers and overall ranking.` },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlayerPage,
});

function PlayerPage() {
  const { name } = Route.useParams();
  const { data } = useSuspenseQuery(playersQuery);
  const list = ranked(data);
  const idx = list.findIndex((p) => p.name.toLowerCase() === name.toLowerCase());
  const p = list[idx];

  if (!p)
    return (
      <div className="mx-auto max-w-md px-4 pt-24 text-center">
        <h1 className="text-2xl font-semibold">No tiers for “{name}”</h1>
        <p className="mt-2 text-sm text-muted-foreground">This player hasn't been tested yet.</p>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">Back to rankings</Link>
      </div>
    );

  const tone = idx === 0 ? "var(--gold)" : idx === 1 ? "var(--silver)" : idx === 2 ? "var(--bronze)" : "oklch(0.6 0 0)";

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground pointer-coarse:py-2.5 pointer-coarse:pr-4"><svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 5-5 5 5 5" /></svg>Rankings</Link>
      {/* phone: model and name side by side, tiers full width underneath. sm and up: model on the left spanning both rows. */}
      <div className="panel relative mt-4 grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-4 gap-y-5 overflow-hidden p-4 min-[380px]:grid-cols-[9rem_minmax(0,1fr)] min-[380px]:p-5 sm:grid-cols-[210px_minmax(0,1fr)] sm:gap-8 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2"
          style={{ background: `radial-gradient(ellipse 60% 55% at 28% 45%, color-mix(in oklab, ${tone} 24%, transparent), transparent 70%)` }}
        />
        <PlayerViewer player={p} pose="showcase" facing={0.25} className="relative mx-auto aspect-[3/4] w-full max-w-[13rem] sm:row-span-2" />
        <div className="relative min-w-0">
          <p className="font-mono text-sm" style={{ color: tone }}>Rank {idx + 1} overall, <span style={{ color: regionInfo(p.region).color }}>{regionInfo(p.region).name}</span></p>
          <h1 className="mt-1 text-2xl font-semibold max-sm:break-words min-[380px]:text-3xl sm:truncate sm:text-5xl">{p.name}</h1>
          <p className="mt-2 text-muted-foreground">{title(p.points)}, <span className="font-semibold tabular-nums text-foreground">{p.points}</span> points</p>
        </div>

        <div className="relative col-span-2 min-w-0 sm:col-span-1">
          <h2 className="text-sm font-medium text-muted-foreground">Tiers</h2>
          <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl border bg-surface p-2 sm:flex sm:flex-wrap sm:p-4">
            {KITS.map((k) => {
              const t = p.tiers[k.id];
              return (
                <Link key={k.id} to="/kit/$kit" params={{ kit: k.id }} className="group flex w-full flex-col items-center gap-1 rounded-lg px-1 py-3 transition-colors hover:bg-muted/50 sm:w-32">
                  <KitTier kitId={k.id} tier={t} size="md" />
                  <span className="mt-1 text-center text-[13px] font-medium sm:whitespace-nowrap sm:text-sm">{k.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{t ? `+${TIER_POINTS[t]} pts` : "Untested"}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
