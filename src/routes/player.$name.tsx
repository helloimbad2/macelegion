import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { KITS, TIER_POINTS, bodyRender, playersQuery, ranked, regionInfo, title } from "@/lib/tiers";
import { KitTier } from "@/components/tier-ui";

export const Route = createFileRoute("/player/$name")({
  loader: ({ context }) => context.queryClient.ensureQueryData(playersQuery),
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
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"><svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 5-5 5 5 5" /></svg>Rankings</Link>
      <div className="panel relative mt-4 grid gap-8 overflow-hidden p-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2"
          style={{ background: `radial-gradient(ellipse 60% 55% at 28% 45%, color-mix(in oklab, ${tone} 24%, transparent), transparent 70%)` }}
        />
        <img src={bodyRender(p.name)} alt={p.name} className="pixel relative mx-auto h-60 w-auto drop-shadow-[0_14px_16px_rgba(0,0,0,0.55)]" />
        <div className="relative min-w-0">
          <p className="font-mono text-sm" style={{ color: tone }}>Rank {idx + 1} overall, <span style={{ color: regionInfo(p.region).color }}>{regionInfo(p.region).name}</span></p>
          <h1 className="mt-1 truncate text-5xl font-semibold">{p.name}</h1>
          <p className="mt-2 text-muted-foreground">{title(p.points)}, <span className="font-semibold tabular-nums text-foreground">{p.points}</span> points</p>

          <h2 className="mt-8 text-sm font-medium text-muted-foreground">Tiers</h2>
          <div className="mt-2 flex flex-wrap gap-1 rounded-xl border bg-surface p-3 sm:p-4">
            {KITS.map((k) => {
              const t = p.tiers[k.id];
              return (
                <Link key={k.id} to="/kit/$kit" params={{ kit: k.id }} className="group flex w-28 flex-col items-center gap-1 rounded-lg px-1 py-3 transition-colors hover:bg-muted/50">
                  <KitTier kitId={k.id} tier={t} size="md" />
                  <span className="mt-1 text-sm font-medium">{k.name}</span>
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
