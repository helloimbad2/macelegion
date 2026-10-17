import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { KITS, avatar, playersQuery, type Tier } from "@/lib/tiers";

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
      <div className="flex items-center gap-4">
        <img src={kit.icon} alt="" className="pixel h-14 w-14" />
        <div>
          <h1 className="text-4xl font-semibold">{kit.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every tested player, Tier 1 to Tier 5.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((n) => {
          const inTier = data
            .filter((p) => p.tiers[kit.id]?.charAt(2) === String(n))
            .sort((a, b) => (a.tiers[kit.id]!.startsWith("HT") ? -1 : 1) - (b.tiers[kit.id]!.startsWith("HT") ? -1 : 1));
          return (
            <section key={n} className="panel overflow-hidden" style={{ borderTop: `2px solid var(--t${n})` }}>
              <h2 className={`flex items-baseline justify-between border-b bg-surface px-4 py-3 text-lg font-semibold ${tierHead[n - 1]}`}>Tier {n}<span className="text-xs font-normal tabular-nums text-muted-foreground">{inTier.length}</span></h2>
              <ul className="p-1.5">
                {inTier.map((p) => {
                  const t = p.tiers[kit.id] as Tier;
                  const high = t.startsWith("HT");
                  return (
                    <li key={p.name}>
                      <Link to="/player/$name" params={{ name: p.name }} className="flex items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors hover:bg-muted/60">
                        <img src={avatar(p.name, 28)} alt="" className="pixel h-6 w-6 shrink-0 rounded ring-1 ring-border" loading="lazy" />
                        <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                        <span className={`text-xs ${high ? "font-medium text-foreground" : "text-muted-foreground"}`}>{high ? "High" : "Low"}</span>
                      </Link>
                    </li>
                  );
                })}
                {inTier.length === 0 && <li className="px-2.5 py-3 text-sm text-muted-foreground">Nobody yet.</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
