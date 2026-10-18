import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { KITS, playersQuery, regionInfo, type Tier } from "@/lib/tiers";
import { PlayerImg, TierMark } from "@/components/tier-ui";
import { KitInfo } from "@/components/kit-info";

export const Route = createFileRoute("/kit/$kit")({
  loader: ({ context, params }) => {
    const kit = KITS.find((k) => k.id === params.kit);
    if (!kit) throw notFound();
    return context.queryClient.ensureQueryData(playersQuery).then(() => ({ name: kit.name }));
  },
  head: ({ loaderData }) => {
    const n = loaderData?.name ?? "Kit";
    return {
      meta: [
        { title: `${n} Tiers — Mace Legion` },
        { name: "description", content: `Every tested ${n} player, sorted from Tier 1 to Tier 5.` },
        { property: "og:title", content: `${n} Tiers — Mace Legion` },
        { property: "og:description", content: `Every tested ${n} player, sorted from Tier 1 to Tier 5.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: KitPage,
});

const tierHead = ["text-t1", "text-t2", "text-t3", "text-t4", "text-t5"];

function KitPage() {
  const { kit: kitId } = Route.useParams();
  const kit = KITS.find((k) => k.id === kitId)!;
  const { data } = useSuspenseQuery(playersQuery);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={kit.icon} alt="" className="pixel h-14 w-14" />
          <h1 className="text-4xl font-semibold">{kit.name}</h1>
        </div>
        <KitInfo kitId={kit.id} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((n) => {
          const inTier = data
            .filter((p) => p.tiers[kit.id]?.charAt(2) === String(n))
            .sort((a, b) => (a.tiers[kit.id]!.startsWith("HT") ? -1 : 1) - (b.tiers[kit.id]!.startsWith("HT") ? -1 : 1));
          return (
            <section key={n} className="panel overflow-hidden" style={{ borderTop: `2px solid var(--t${n})` }}>
              <h2 className={`flex items-baseline justify-between border-b px-4 py-3 text-lg font-semibold ${tierHead[n - 1]}`} style={{ background: `color-mix(in oklab, var(--t${n}) 9%, var(--surface))` }}>Tier {n}<span className="text-xs font-normal tabular-nums text-muted-foreground">{inTier.length}</span></h2>
              <ul className="flex flex-col gap-1.5 p-2">
                {inTier.map((p) => {
                  const t = p.tiers[kit.id] as Tier;
                  const high = t.startsWith("HT");
                  const region = regionInfo(p.region);
                  return (
                    <li key={p.name}>
                      <Link
                        to="/player/$name"
                        params={{ name: p.name }}
                        className={`group relative flex items-center gap-2.5 overflow-hidden rounded-lg py-2 pl-3.5 pr-2.5 transition-colors ${high ? "bg-muted hover:bg-accent" : "bg-muted/45 hover:bg-muted/80"}`}
                      >
                        <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: region.color }} />
                        <PlayerImg player={p} size={40} className="pixel h-9 w-9 shrink-0 rounded-xl bg-background p-0.5 ring-2 ring-border" />
                        <span className="relative h-6 min-w-0 flex-1 overflow-hidden text-sm font-semibold">
                          <span className="absolute inset-0 block truncate leading-6 transition-all duration-200 group-hover:-translate-y-full group-hover:opacity-0 group-focus-visible:-translate-y-full group-focus-visible:opacity-0">{p.name}</span>
                          <span aria-hidden className="absolute inset-0 block translate-y-full truncate leading-6 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100" style={{ color: region.color }}>{region.short}</span>
                        </span>
                        <TierMark high={high} className={high ? "text-foreground" : "text-muted-foreground"} />
                      </Link>
                    </li>
                  );
                })}
                {inTier.length === 0 && <li className="px-2 py-3 text-sm text-muted-foreground">Nobody yet.</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
