import { useEffect, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tip } from "@/components/tip";
import { regionInfo } from "@/lib/tiers";
import { cn } from "@/lib/utils";
import serverIcon from "@/assets/testing-server.png";

const SERVERS = [
  { region: "NA", ip: "na.turtled.net" },
  { region: "EU", ip: "eu.turtled.net" },
] as const;

/** Copy to the clipboard, falling back to the old way for insecure pages and older browsers. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand("copy");
      field.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function ServerRow({ region, ip }: { region: string; ip: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const info = regionInfo(region);

  return (
    <button
      type="button"
      aria-label={`Copy the ${info.name} address, ${ip}`}
      onClick={async () => {
        if (!(await copyText(ip))) return;
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), 1600);
      }}
      className="group flex w-full items-center gap-3 rounded-lg border bg-surface px-3 py-2.5 text-left transition-colors hover:border-foreground/30 hover:bg-muted/50 pointer-coarse:py-3.5"
    >
      <span className="w-7 shrink-0 text-xs font-bold" style={{ color: info.color }}>{region}</span>
      <span className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">{ip}</span>
      <span aria-live="polite" className={cn("inline-flex shrink-0 items-center gap-1.5 text-xs font-medium transition-colors", copied ? "text-[#5ee08a]" : "text-muted-foreground group-hover:text-foreground")}>
        {copied ? (
          <>
            <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8.5 3.2 3.2L13 4.8" /></svg>
            Copied
          </>
        ) : (
          <>
            <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5.5" y="5.5" width="8" height="8" rx="1.8" /><path d="M10.5 5.5V4.3a1.8 1.8 0 0 0-1.8-1.8H4.3a1.8 1.8 0 0 0-1.8 1.8v4.4a1.8 1.8 0 0 0 1.8 1.8h1.2" /></svg>
            Copy
          </>
        )}
      </span>
    </button>
  );
}

/**
 * "Testing Server" button with the NA and EU addresses.
 * `header` sits in the desktop header; `pinned` sits at the end of the phone and tablet tab row.
 */
export function TestingServer({ variant }: { variant: "header" | "pinned" }) {
  const trigger = (
    <PopoverTrigger asChild>
      <button
        type="button"
        aria-label="Testing Server"
        className={cn(
          "inline-flex items-center gap-2 rounded-md border text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground",
          variant === "header" ? "h-9 bg-background px-2 pointer-coarse:h-10 xl:px-3" : "h-10 bg-card px-2 md:px-3",
        )}
      >
        <img src={serverIcon} alt="" className="h-6 w-6 shrink-0 object-contain" />
        <span className={cn("hidden", variant === "header" ? "xl:inline" : "md:inline")}>Testing Server</span>
      </button>
    </PopoverTrigger>
  );

  return (
    <Popover>
      {/* icon-only on narrower screens, so give it a themed tooltip there */}
      {variant === "header" ? <Tip label="Testing Server" side="bottom">{trigger}</Tip> : trigger}
      <PopoverContent align="end" sideOffset={8} collisionPadding={12} className="w-[min(21rem,calc(100vw-1.5rem))] rounded-2xl border bg-card p-3 shadow-2xl shadow-black/60 sm:p-4">
        <div className="flex items-center gap-3">
          <img src={serverIcon} alt="" className="h-10 w-10 shrink-0 object-contain" />
          <h3 className="text-[15px] font-bold">Testing Server</h3>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {SERVERS.map((s) => (
            <ServerRow key={s.region} region={s.region} ip={s.ip} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
