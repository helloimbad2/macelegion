import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type CSSProperties } from "react";
import { KITS, logoUrl, type KitId, type Tier } from "@/lib/tiers";
import { cn } from "@/lib/utils";

// Colour recipe (taken from the reference): one tint per tier, mixed into the page
// background, drives both the ring and the pill fill. Text is the bright tier colour,
// slightly deeper for LT. Tiers 4 and 5 resolve to dark grey through the same recipe.
const TIER_VAR: Record<string, string> = { "1": "var(--t1)", "2": "var(--t2)", "3": "var(--t3)", "4": "var(--t4)", "5": "var(--t5)" };
const FILL = "bg-[color-mix(in_oklab,var(--c)_40%,#0a0a0a)]";
const RING = "border-[color-mix(in_oklab,var(--c)_40%,#0a0a0a)]";
const TEXT_HT = "text-[color:var(--c)]";
const TEXT_LT = "text-[color:color-mix(in_oklab,var(--c)_80%,black)]";
const cv = (tier: Tier) => ({ ["--c" as string]: TIER_VAR[tier.charAt(2)] }) as CSSProperties;

export function TierBadge({ tier, className }: { tier?: Tier | undefined; className?: string }) {
  if (!tier)
    return (
      <span className={cn("inline-flex h-6 min-w-11 items-center justify-center text-xs font-bold text-muted-foreground/40", className)}>–</span>
    );
  return (
    <span
      style={cv(tier)}
      className={cn("inline-flex h-6 min-w-11 items-center justify-center rounded-md text-xs font-bold tracking-wide", FILL, tier.startsWith("HT") ? TEXT_HT : TEXT_LT, className)}
    >
      {tier}
    </span>
  );
}

const SIZES = {
  xs: { circle: "h-9 w-9", icon: "h-5 w-5", pill: "h-5 min-w-9 text-[11px]" },
  sm: { circle: "h-12 w-12", icon: "h-7 w-7", pill: "h-[22px] min-w-12 text-[13px]" },
  md: { circle: "h-16 w-16", icon: "h-9 w-9", pill: "h-7 min-w-16 text-sm" },
} as const;

/** Kit icon in a ringed circle, with the tier pill tucked under its lower edge. */
export function KitTier({ kitId, tier, size = "md", className }: { kitId: KitId; tier?: Tier | undefined; size?: keyof typeof SIZES; className?: string }) {
  const kit = KITS.find((k) => k.id === kitId)!;
  const s = SIZES[size];
  if (!tier)
    return (
      <span title={`${kit.name}: untested`} className={cn("inline-flex flex-col items-center", className)}>
        <span className={cn("rounded-full border-2 border-dotted border-[oklch(0.24_0_0)] bg-[oklch(0.09_0_0)]", s.circle)} />
        <span className={cn("-mt-1 flex items-center justify-center font-bold text-muted-foreground/60", s.pill.split(" ")[0], "min-w-9")}>–</span>
      </span>
    );
  return (
    <span title={`${kit.name}: ${tier}`} style={cv(tier)} className={cn("inline-flex flex-col items-center", className)}>
      <span className={cn("flex items-center justify-center rounded-full border-2 bg-[oklch(0.08_0_0)]", RING, s.circle)}>
        <img src={kit.icon} alt={kit.name} className={cn("pixel", s.icon)} />
      </span>
      <span
        className={cn("relative -mt-1 inline-flex items-center justify-center rounded-md px-1.5 font-bold tracking-wide", FILL, s.pill, tier.startsWith("HT") ? TEXT_HT : TEXT_LT)}
      >
        {tier}
      </span>
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
