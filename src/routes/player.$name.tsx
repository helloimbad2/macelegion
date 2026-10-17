import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { KITS, TIER_POINTS, bodyRender, playersQuery, ranked, title } from "@/lib/tiers";
import { TierBadge } from "@/components/tier-ui";

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

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"><svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 5-5 5 5 5" /></svg>Rankings</Link>
      <div className="panel mt-4 grid gap-8 p-6 sm:grid-cols-[160px_minmax(0,1fr)] sm:p-8">
        <img src={bodyRender(p.name)} alt={p.name} className="pixel mx-auto h-56 w-auto" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">Rank {idx + 1} overall, {p.region}</p>
          <h1 className="mt-1 truncate text-5xl font-semibold">{p.name}</h1>
          <p className="mt-2 text-muted-foreground">{title(p.points)}, <span className="font-semibold tabular-nums text-foreground">{p.points}</span> points</p>

          <div className="mt-6 grid gap-2">
            {KITS.map((k) => {
              const t = p.tiers[k.id];
              return (
                <Link key={k.id} to="/kit/$kit" params={{ kit: k.id }} className="flex items-center gap-3 rounded-lg border bg-surface px-3.5 py-3 transition-colors hover:border-primary/60 hover:bg-muted/40">
                  <img src={k.icon} alt="" className="pixel h-7 w-7" />
                  <span className="flex-1 text-sm font-medium">{k.name}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">{t ? `+${TIER_POINTS[t]}` : "Untested"}</span>
                  <TierBadge tier={t} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
