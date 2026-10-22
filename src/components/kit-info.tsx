import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TierBadge, TierMark } from "@/components/tier-ui";
import { TIER_POINTS, TITLES, type KitId, type Tier } from "@/lib/tiers";
import { cn } from "@/lib/utils";
import diamondKit from "@/assets/testing-kit-diamondmace.png";
import macePotLt from "@/assets/testing-kit-macepot-lt.png";
import macePotHt from "@/assets/testing-kit-macepot-ht.png";

type KitVariant = { label: string; tiers: Tier[]; src: string; alt: string };

/** Testing kit inventories per kit. A kit with no entry has no Testing Kit tab. */
const TESTING_KITS: Partial<Record<KitId, KitVariant[]>> = {
  diamondmace: [{ label: "Diamond Mace", tiers: [], src: diamondKit, alt: "Diamond Mace testing kit inventory" }],
  macepot: [
    { label: "LT Mace Pot", tiers: ["LT5", "HT5", "LT4", "HT4", "LT3"], src: macePotLt, alt: "Low tier Mace Pot testing kit inventory" },
    { label: "HT Mace Pot", tiers: ["HT3", "LT2", "HT2", "LT1", "HT1"], src: macePotHt, alt: "High tier Mace Pot testing kit inventory" },
  ],
};

const tabTrigger =
  "h-auto whitespace-normal rounded-xl border border-transparent bg-muted/40 px-2 py-2.5 text-center text-sm font-semibold sm:px-3 sm:py-3 sm:text-[15px] leading-tight text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-border data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none";

export function KitInfo({ kitId }: { kitId: KitId }) {
  const [open, setOpen] = useState(false);
  const hasKit = Boolean(TESTING_KITS[kitId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted data-[state=open]:bg-muted sm:gap-2.5 sm:px-4 sm:py-2.5 sm:text-[15px] sm:leading-normal"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 sm:h-[22px] sm:w-[22px]">
            <circle cx="12" cy="12" r="11" fill="currentColor" />
            <circle cx="12" cy="7.2" r="1.7" fill="oklch(0.15 0 0)" />
            <rect x="10.5" y="10" width="3" height="7.6" rx="1.2" fill="oklch(0.15 0 0)" />
          </svg>
          Information
        </button>
      </PopoverTrigger>
      {/* Wide and compact so nothing needs scrolling; overflow stays as a safety net on very short screens. */}
      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="max-h-[var(--radix-popover-content-available-height)] w-[min(40rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border bg-card p-3 shadow-2xl shadow-black/60 sm:p-4"
      >
        <Tabs defaultValue="titles">
          <TabsList className={cn("grid h-auto w-full gap-2 bg-transparent p-0", hasKit ? "grid-cols-3" : "grid-cols-2")}>
            <TabsTrigger value="titles" className={tabTrigger}>Titles</TabsTrigger>
            <TabsTrigger value="points" className={tabTrigger}>Points</TabsTrigger>
            {hasKit && <TabsTrigger value="kit" className={tabTrigger}>Testing Kit</TabsTrigger>}
          </TabsList>

          <TabsContent value="titles" className="mt-3 sm:mt-4">
            <TitlesTab />
          </TabsContent>
          <TabsContent value="points" className="mt-3 sm:mt-4">
            <PointsTab />
          </TabsContent>
          {hasKit && (
            <TabsContent value="kit" className="mt-3 sm:mt-4">
              <TestingKitTab kitId={kitId} />
            </TabsContent>
          )}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

/* ---------------------------------- Titles ---------------------------------- */

function TitlesTab() {
  return (
    <>
      <h3 className="text-sm font-bold sm:text-[15px]">How to obtain Achievement Titles</h3>
      <ul className="mt-2 grid gap-x-3 gap-y-2 max-[380px]:grid-cols-2 min-[381px]:gap-y-2.5 min-[381px]:mt-2.5 sm:mt-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3.5">
        {TITLES.map((t, i) => (
          <li key={t.name} className={cn("flex items-start gap-2.5 sm:gap-3", i === TITLES.length - 1 && "max-[380px]:col-span-2 sm:col-span-2")}>
            <TitleEmblem rank={TITLES.length - 1 - i} color={t.color} className="mt-0.5" />
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight sm:text-base">{t.name}</div>
              <div className="mt-0.5 text-[13px] leading-snug text-muted-foreground max-[380px]:text-xs sm:text-sm">{t.desc}</div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * Rank emblem: a rounded diamond that gains detail with rank.
 * rank 0 = Rookie (hollow diamond) ... rank 6 = Grandmaster (double chevron + sparkles).
 */
function TitleEmblem({ rank, color, className }: { rank: number; color: string; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cn("h-6 w-6 shrink-0", className)} style={{ color }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.6 21.4 12 12 21.4 2.6 12Z" fill={rank >= 3 ? "currentColor" : "none"} fillOpacity={rank >= 3 ? 0.18 : 0} />
      {rank === 0 && <path d="M12 8.2 15.8 12 12 15.8 8.2 12Z" strokeWidth="1.6" />}
      {rank === 1 && <circle cx="12" cy="12" r="3" strokeWidth="1.8" />}
      {rank === 2 && <circle cx="12" cy="12" r="2.8" fill="currentColor" stroke="none" />}
      {rank === 3 && <path d="M12 8.6 15.4 12 12 15.4 8.6 12Z" fill="currentColor" stroke="none" />}
      {rank === 4 && (
        <>
          <path d="M8.8 12 12 8.8 15.2 12" strokeWidth="1.9" />
          <circle cx="12" cy="15" r="1.1" fill="currentColor" stroke="none" />
        </>
      )}
      {rank >= 5 && <path d="M8.8 10.6 12 7.4l3.2 3.2M8.8 15.4 12 12.2l3.2 3.2" strokeWidth="1.9" />}
      {rank === 6 && <path d="M20.2 1.6v3.6M18.4 3.4H22M3.6 1.6v2.4M2.4 2.8h2.4" strokeWidth="1.3" />}
    </svg>
  );
}

/* ---------------------------------- Points ---------------------------------- */

const TIER_ACCENT = ["var(--t1)", "var(--t2)", "var(--t3)"];

function PointsTab() {
  return (
    <>
      <h3 className="text-[15px] font-bold">How ranking points are calculated</h3>
      <div className="mt-2 flex flex-col divide-y divide-border/60">
        {[1, 2, 3, 4, 5].map((n) => {
          const accent = TIER_ACCENT[n - 1];
          return (
            <div key={n} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 sm:gap-x-4 sm:py-3">
              <div className="flex w-[4.75rem] items-center gap-1.5 text-sm font-bold sm:w-24 sm:gap-2 sm:text-base" style={accent ? { color: accent } : undefined}>
                {accent ? <Trophy className="h-[18px] w-[18px]" /> : <span className="w-[18px]" />}
                Tier {n}
              </div>
              <div className="flex flex-wrap gap-2">
                {(["HT", "LT"] as const).map((h) => {
                  const pts = TIER_POINTS[`${h}${n}` as Tier];
                  return (
                    <span
                      key={h}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-bold sm:px-3.5 sm:py-1.5 sm:text-sm"
                      style={{ color: `var(--t${n})`, background: `color-mix(in oklab, var(--t${n}) 16%, #0c0c0c)` }}
                    >
                      {pts} {pts === 1 ? "Point" : "Points"}
                      <TierMark high={h === "HT"} className="h-4 w-4" />
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Trophy({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M6.5 3h11v5.2c0 3.2-2.1 5.8-5 6.3V17h3.2v2.5H8.3V17h3.2v-2.5c-2.9-.5-5-3.1-5-6.3V3Z" />
      <path d="M6.5 5H3v2.2c0 2.2 1.5 3.8 3.7 4.1-.2-.7-.2-1.4-.2-2.1V5Zm11 0H21v2.2c0 2.2-1.5 3.8-3.7 4.1.2-.7.2-1.4.2-2.1V5Z" opacity=".85" />
    </svg>
  );
}

/* -------------------------------- Testing kit -------------------------------- */

function TestingKitTab({ kitId }: { kitId: KitId }) {
  const variants = TESTING_KITS[kitId] ?? [];
  const [i, setI] = useState(0);
  const v = variants[Math.min(i, variants.length - 1)];
  if (!v) return null;

  return (
    // Side by side on wide panels: the kit list on the left, the inventory on the right.
    <div className="grid gap-3 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-4">
      <div>
        <h3 className="text-[15px] font-bold">Testing Kit</h3>
        <div role="tablist" aria-label="Testing kit" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-1">
          {variants.map((opt, idx) => (
            <button
              key={opt.label}
              type="button"
              role="tab"
              aria-selected={idx === i}
              onClick={() => setI(idx)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border px-2.5 py-2.5 text-sm font-semibold transition-colors",
                idx === i ? "border-border bg-muted text-foreground" : "border-transparent bg-muted/40 text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
              {opt.tiers.length > 0 && (
                <span className="flex flex-wrap justify-center gap-1">
                  {opt.tiers.map((t) => (
                    <TierBadge key={t} tier={t} className="h-[18px] min-w-8 text-[10px]" />
                  ))}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* The image shrinks to whatever height the popover has, so the kit is always fully visible. */}
      <figure className="flex items-start justify-center overflow-hidden rounded-xl border bg-black/50 p-2 [--kit-overhead:17rem] sm:p-2.5 sm:[--kit-overhead:8.5rem]">
        <img
          src={v.src}
          alt={v.alt}
          className="block h-auto w-auto max-w-full rounded-md"
          style={{ maxHeight: "max(11rem, min(30rem, calc(var(--radix-popover-content-available-height, 100vh) - var(--kit-overhead))))" }}
        />
      </figure>
    </div>
  );
}
