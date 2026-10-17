import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { KITS, logoUrl, type Tier } from "@/lib/tiers";
import { cn } from "@/lib/utils";

// Tier colour lives in the badge itself: a filled chip for high tiers,
// a quieter outlined chip for low tiers, so HT/LT reads without a label.
const tierColor: Record<string, { hi: string; lo: string }> = {
  "1": { hi: "bg-t1 text-black border-t1", lo: "text-t1 border-t1/45 bg-t1/10" },
  "2": { hi: "bg-t2 text-black border-t2", lo: "text-t2 border-t2/45 bg-t2/10" },
  "3": { hi: "bg-t3 text-black border-t3", lo: "text-t3 border-t3/45 bg-t3/10" },
  "4": { hi: "bg-t4 text-black border-t4", lo: "text-t4 border-t4/45 bg-t4/10" },
  "5": { hi: "bg-t5 text-black border-t5", lo: "text-t5 border-t5/45 bg-t5/10" },
};

export function TierBadge({ tier, className }: { tier?: Tier | undefined; className?: string }) {
  if (!tier)
    return (
      <span className={cn("inline-flex h-6 min-w-11 items-center justify-center rounded-sm text-xs text-muted-foreground/40", className)}>
        –
      </span>
    );
  const c = tierColor[tier.charAt(2)];
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-11 items-center justify-center rounded-sm border font-mono text-xs font-medium",
        tier.startsWith("HT") ? c.hi : c.lo,
        className,
      )}
    >
      {tier}
    </span>
  );
}

const navLink =
  "relative flex items-center gap-2 px-3 py-5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-md after:bg-transparent";
const navActive = "text-foreground after:bg-primary";

export function SiteHeader() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4">
        <Link to="/" className="shrink-0">
          <img src={logoUrl} alt="Mace Legion" className="h-10 w-auto" />
        </Link>
        <nav className="hidden items-center md:flex">
          <Link to="/" activeOptions={{ exact: true }} className={cn(navLink, "py-[1.3125rem]")} activeProps={{ className: navActive }}>
            Overall
          </Link>
          {KITS.map((k) => (
            <Link key={k.id} to="/kit/$kit" params={{ kit: k.id }} className={cn(navLink, "py-[1.3125rem]")} activeProps={{ className: navActive }}>
              <img src={k.icon} alt="" className="pixel h-4 w-4" />
              {k.name}
            </Link>
          ))}
        </nav>
        <form
          className="relative ml-auto"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) navigate({ to: "/player/$name", params: { name: q.trim() } });
          }}
        >
          <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="9" cy="9" r="5.5" />
            <path d="m13.5 13.5 3.5 3.5" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search player"
            aria-label="Search player"
            className="h-9 w-40 rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/60 sm:w-56"
          />
        </form>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t px-3 py-2 text-sm md:hidden">
        <Link to="/" activeOptions={{ exact: true }} className="shrink-0 rounded-md px-3 py-1 text-muted-foreground" activeProps={{ className: "text-foreground bg-muted" }}>Overall</Link>
        {KITS.map((k) => (
          <Link key={k.id} to="/kit/$kit" params={{ kit: k.id }} className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1 text-muted-foreground" activeProps={{ className: "text-foreground bg-muted" }}>
            <img src={k.icon} alt="" className="pixel h-4 w-4" />{k.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-surface/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <span>© 2026 Mace Legion. Not affiliated with Mojang or Microsoft.</span>
        <span>Tiers update after every test.</span>
      </div>
    </footer>
  );
}

export function RankNumber({ rank }: { rank: number }) {
  const c = rank === 1 ? "text-gold" : rank === 2 ? "text-silver" : rank === 3 ? "text-bronze" : "text-muted-foreground";
  return <span className={cn("w-8 shrink-0 font-display text-lg font-semibold tabular-nums", c)}>{rank}</span>;
}
