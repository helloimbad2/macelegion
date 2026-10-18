import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, type CSSProperties } from "react";
import { KITS, logoUrl, playersQuery, ranked, regionInfo, title } from "@/lib/tiers";
import { KitTier, PlayerImg, RankNumber, TierBadge } from "@/components/tier-ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mace Legion — Overall Mace PvP Rankings" },
      { name: "description", content: "Official tier list for Mace SMP, Diamond Mace and Mace Pot. See where every tested player ranks." },
      { property: "og:title", content: "Mace Legion — Overall Rankings" },
      { property: "og:description", content: "Official tier list for Mace SMP, Diamond Mace and Mace Pot." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(playersQuery),
  component: Index,
});

const PAGE = 50;

function Index() {
  const { data } = useSuspenseQuery(playersQuery);
  const [filter, setFilter] = useState("");
  const [region, setRegion] = useState("All");
  const [limit, setLimit] = useState(PAGE);
  const list = ranked(data).map((p, i) => ({ ...p, rank: i + 1 }));
  const regions = ["All", ...Array.from(new Set(list.map((p) => p.region))).filter((r) => r !== "—").sort()];
  const filtered = list.filter(
    (p) => p.name.toLowerCase().includes(filter.toLowerCase()) && (region === "All" || p.region === region),
  );
  const shown = filtered.slice(0, limit);
  // rank inside the selected region (separate from the overall rank)
  const regionRank = region === "All" ? null : new Map(list.filter((p) => p.region === region).map((p, i) => [p.name, i + 1]));
  const podium = [list[1], list[0], list[2]];

  return (
    <>
      <section className="relative">
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-14 sm:pt-20">
          <img src={logoUrl} alt="Mace Legion" className="logo-shadow rise mx-auto w-full max-w-xl" />
          <p className="rise mx-auto mt-5 max-w-md text-center text-base text-foreground/75 [animation-delay:80ms]">
            Tested rankings for the mace community.
            <br />
            <span className="font-semibold tabular-nums text-foreground">{list.length}</span> players across{" "}
            <span className="font-semibold tabular-nums text-foreground">{KITS.length}</span> kits.
          </p>

          <div className="mt-12 grid grid-cols-3 items-end gap-2 sm:gap-4">
            {podium.map((p, i) => {
              if (!p) return <div key={i} />;
              const place = p.rank;
              const style = place === 1 ? "podium-gold" : place === 2 ? "podium-silver" : "podium-bronze";
                            return (
                <Link
                  key={p.name}
                  to="/player/$name"
                  params={{ name: p.name }}
                  className={cn("podium rise group flex flex-col items-center rounded-xl px-2 pb-5 pt-6 transition-transform hover:-translate-y-0.5", style, place === 1 ? "sm:pb-8 sm:pt-9" : "")}
                  style={{ animationDelay: `${150 + i * 90}ms` }}
                >
                  <span className="podium-edge" aria-hidden />
                  <PlayerImg
                    player={p}
                    kind="body"
                    className={cn("pixel w-auto max-w-full object-contain drop-shadow-[0_12px_14px_rgba(0,0,0,0.55)]", place === 1 ? "h-40 sm:h-56" : "h-32 sm:h-44")}
                  />
                  <span className="podium-rank mt-3 font-display text-3xl font-bold tabular-nums sm:text-4xl">{place}</span>
                  <span className="mt-0.5 max-w-full truncate font-display text-base font-semibold sm:text-xl">{p.name}</span>
                  <span className="mt-0.5 text-xs text-muted-foreground">
                    {title(p.points)} <span className="ml-1 font-mono text-[color:var(--tone)]">{p.points} pts</span>
                  </span>
                  <div className="mt-4 hidden gap-1.5 sm:flex">
                    {KITS.map((k) => (
                      <KitTier key={k.id} kitId={k.id} tier={p.tiers[k.id]} size="sm" />
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10">
        <div className="grid gap-3 sm:grid-cols-3">
          {KITS.map((k) => {
            const count = list.filter((p) => p.tiers[k.id]).length;
            return (
              <Link key={k.id} to="/kit/$kit" params={{ kit: k.id }} className="panel group flex items-center gap-4 p-4 transition-colors hover:border-primary/60 hover:bg-muted/50">
                <img src={k.icon} alt="" className="pixel h-12 w-12" />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg font-semibold leading-tight">{k.name}</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">{count ? `${count} ranked players` : "Testing soon"}</div>
                </div>
                <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m8 5 5 5-5 5" /></svg>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Overall rankings</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-md border bg-surface p-0.5">
              {regions.map((r) => (
                <button
                  key={r}
                  onClick={() => { setRegion(r); setLimit(PAGE); }}
                  className={cn("rounded-md px-3 py-1 text-xs font-medium transition-colors", region === r ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  {r !== "All" && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: regionInfo(r).color }} />}
                  {r}
                </button>
              ))}
            </div>
            <input
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setLimit(PAGE); }}
              placeholder="Filter by name"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/60 sm:w-48"
            />
          </div>
        </div>

        <div className="mt-5" style={{ "--rk": regionRank ? "5.25rem" : "3rem", "--rkm": regionRank ? "4.75rem" : "2.5rem" } as CSSProperties}>
          <div className="hidden grid-cols-[var(--rk)_minmax(0,1fr)_5rem_repeat(3,4.25rem)] items-center gap-3 rounded-lg border bg-surface px-4 py-3 text-xs font-medium text-muted-foreground md:grid">
            <span>#</span><span>Player</span><span>Region</span>
            {KITS.map((k) => (
              <span key={k.id} className="flex justify-center" title={k.name}>
                <img src={k.icon} alt={k.name} className="pixel h-5 w-5" />
              </span>
            ))}
          </div>
          <div className="mt-1.5 flex flex-col gap-1.5">
            {shown.map((p) => (
              <Link
                key={p.name}
                to="/player/$name"
                params={{ name: p.name }}
                className={cn(
                  "shine grid grid-cols-[var(--rkm)_minmax(0,1fr)] items-center gap-3 rounded-lg border bg-card px-4 py-2.5 transition-colors hover:bg-muted/50 md:grid-cols-[var(--rk)_minmax(0,1fr)_5rem_repeat(3,4.25rem)]",
                  p.rank === 1 && "border-gold/25 bg-gradient-to-r from-gold/[0.12] to-transparent shadow-[inset_3px_0_0_var(--gold)] [--sheen:var(--gold)]",
                  p.rank === 2 && "border-silver/25 bg-gradient-to-r from-silver/[0.10] to-transparent shadow-[inset_3px_0_0_var(--silver)] [--sheen:var(--silver)]",
                  p.rank === 3 && "border-bronze/25 bg-gradient-to-r from-bronze/[0.12] to-transparent shadow-[inset_3px_0_0_var(--bronze)] [--sheen:var(--bronze)]",
                )}
              >
                <div className="flex items-baseline gap-1">
                  <RankNumber rank={p.rank} />
                  {regionRank && <span className="font-mono text-sm font-semibold text-red-500" title="Rank in this region">#{regionRank.get(p.name)}</span>}
                </div>
                <div className="flex min-w-0 items-center gap-3">
                  <PlayerImg player={p} size={40} className="pixel h-9 w-9 shrink-0 rounded-md ring-1 ring-border" />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{title(p.points)}</span>
                      <span className="font-mono text-muted-foreground/70">{p.points} pts</span>
                    </div>
                  </div>
                </div>
                <span className="hidden text-sm font-medium md:block" style={{ color: regionInfo(p.region).color }}>{p.region}</span>
                {KITS.map((k) => (
                  <span key={k.id} className="hidden justify-center md:flex">
                    <KitTier kitId={k.id} tier={p.tiers[k.id]} size="xs" />
                  </span>
                ))}
                <div className="col-span-2 flex flex-wrap gap-2 pl-[calc(var(--rkm)+0.75rem)] md:hidden">
                  {KITS.map((k) => (
                    <span key={k.id} className="flex items-center gap-1">
                      <img src={k.icon} alt={k.name} className="pixel h-4 w-4" />
                      <TierBadge tier={p.tiers[k.id]} />
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
          {shown.length === 0 && <p className="rounded-lg border bg-card px-4 py-12 text-center text-sm text-muted-foreground">No players match that search.</p>}
        </div>
        {filtered.length > limit && (
          <button onClick={() => setLimit(limit + PAGE)} className="mx-auto mt-5 block rounded-md border bg-surface px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground">
            Show more ({filtered.length - limit} left)
          </button>
        )}
      </div>
    </>
  );
}
