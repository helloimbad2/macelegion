import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { KITS, logoUrl, skinUrls, type KitId, type Tier } from "@/lib/tiers";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
      <Tip label={`${kit.name}: untested`}>
        <span className={cn("inline-flex flex-col items-center", className)}>
          <span className={cn("flex items-center justify-center rounded-full border-2 border-dotted border-[oklch(0.24_0_0)] bg-[oklch(0.09_0_0)]", s.circle)}>
            <img src={kit.icon} alt="" className={cn("pixel opacity-20 grayscale", s.icon)} />
          </span>
          <span className={cn("-mt-1 flex items-center justify-center font-bold text-muted-foreground/60", s.pill.split(" ")[0], "min-w-9")}>–</span>
        </span>
      </Tip>
    );
  return (
    <Tip label={`${kit.name}: ${tier}`}>
      <span style={cv(tier)} className={cn("inline-flex flex-col items-center", className)}>
        <span className={cn("flex items-center justify-center rounded-full border-2 bg-[oklch(0.08_0_0)]", RING, s.circle)}>
          <img src={kit.icon} alt={kit.name} className={cn("pixel", s.icon)} />
        </span>
        <span
          className={cn("relative -mt-1 inline-flex items-center justify-center rounded-md px-1.5 font-bold tracking-wide", FILL, s.pill, tier.startsWith("HT") ? TEXT_HT : TEXT_LT)}
        >
          {tier}
        </span>
      </span>
    </Tip>
  );
}

/** Low tier is one chevron, high tier is two. */
export function TierMark({ high, className }: { high: boolean; className?: string }) {
  return (
    <svg role="img" aria-label={high ? "High tier" : "Low tier"} viewBox="0 0 20 20" className={cn("h-5 w-5 shrink-0", className)} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {high ? <path d="m4.5 10.5 5.5-5.5 5.5 5.5M4.5 16 10 10.5 15.5 16" /> : <path d="m4.5 13 5.5-5.5 5.5 5.5" />}
    </svg>
  );
}

/** Themed tooltip (replaces the browser's native title tooltip, which can't be styled). */
export function Tip({ label, children, side = "top" }: { label: ReactNode; children: ReactElement; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <Tooltip delayDuration={120}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} sideOffset={6} className="rounded-md border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-xl shadow-black/50">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export const DISCORD_URL = "https://discord.gg/macelegion";

export function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
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
        <div className="ml-auto flex items-center gap-2">
        <form
          className="relative"
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
        <Tip label="Discord" side="bottom">
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Join the Mace Legion Discord"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:border-[#5865F2]/70 hover:bg-[#5865F2] hover:text-white"
        >
          <DiscordIcon className="h-[18px] w-[18px]" />
        </a>
        </Tip>
        </div>
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
        <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-[#7983f5]">
          <DiscordIcon className="h-4 w-4" />
          discord.gg/macelegion
        </a>
      </div>
    </footer>
  );
}

/** Player head or full-body render from crafty.gg. Falls back to Crafty's Steve if a skin fails to load. */
export function PlayerImg({
  player, kind = "head", size = 40, className, alt = "",
}: { player: { name: string; uuid?: string | undefined }; kind?: "head" | "bust" | "body"; size?: number; className?: string; alt?: string }) {
  const urls = useMemo(() => skinUrls(player, kind, size), [player.name, player.uuid, kind, size]);
  const [i, setI] = useState(0);
  const ref = useRef<HTMLImageElement>(null);
  const next = () => setI((n) => Math.min(n + 1, urls.length - 1));
  useEffect(() => setI(0), [urls[0]]);
  // an image that already failed before hydration never fires onError, so check once mounted
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) next();
  }, [i, urls]);
  return <img ref={ref} src={urls[i]} alt={alt} className={className} loading={kind === "head" ? "lazy" : undefined} onError={next} />;
}

export function RankNumber({ rank }: { rank: number }) {
  const c = rank === 1 ? "text-gold" : rank === 2 ? "text-silver" : rank === 3 ? "text-bronze" : "text-muted-foreground";
  return <span className={cn("w-8 shrink-0 font-display text-lg font-semibold tabular-nums", c)}>{rank}</span>;
}
