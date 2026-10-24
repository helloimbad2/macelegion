import { useEffect, useRef, useState } from "react";
import type { PlayerObject, SkinViewer } from "skinview3d";
import { PlayerImg } from "@/components/tier-ui";
import { cn } from "@/lib/utils";

/**
 * Animated 3D player, in the spirit of Modrinth's skin selector: the model breathes, shifts
 * its weight, looks toward your cursor, plays a pose of its own, and can be flicked around
 * (it springs back to face front).
 *
 * It starts as the crafty.gg render and swaps to the live model once the skin file has
 * loaded. If WebGL, the skin lookup, or the user's motion preference rules the model out,
 * the crafty.gg image simply stays.
 */

export type Pose = "champion" | "ready" | "calm" | "showcase";

type Engine = typeof import("skinview3d");
type Status = "loading" | "ready" | "fallback";

/** Whether this visitor should get a live 3D model at all. */
function canAnimate() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  // a data saver gets the still image, since the 3D engine is a ~160KB download
  return !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
}

// The 3D engine is a separate chunk. Start downloading it the moment this file runs in the browser,
// which is long before React hydrates, so it is usually waiting by the time a model needs it.
let enginePromise: Promise<Engine> | null = null;
const loadEngine = () => {
  enginePromise ??= import("skinview3d").catch((e) => { enginePromise = null; throw e; });
  return enginePromise;
};
if (canAnimate()) void loadEngine().catch(() => {});

// One shared download per player, so prefetching on hover and the viewer itself never fetch twice.
const skinImages = new Map<string, Promise<HTMLImageElement>>();
function loadSkinImage(name: string): Promise<HTMLImageElement> {
  const key = name.toLowerCase();
  let pending = skinImages.get(key);
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`No skin for ${name}`));
      img.src = `/api/skin/${encodeURIComponent(name)}`;
    });
    pending.catch(() => skinImages.delete(key)); // let a later visit retry
    skinImages.set(key, pending);
  }
  return pending;
}

// Creating a 3D context is the heavy part, and doing several in one go freezes the page and holds
// every model back until the last one is built. So they are built one at a time, most important
// first, with a frame in between so the browser can paint (and react to input) in the gaps.
const queue: { priority: number; run: () => Promise<void> }[] = [];
let building = false;
function scheduleBuild(priority: number, run: () => Promise<void>) {
  queue.push({ priority, run });
  queue.sort((a, b) => a.priority - b.priority);
  void drainQueue();
}
async function drainQueue() {
  if (building) return;
  building = true;
  for (let job = queue.shift(); job; job = queue.shift()) {
    try { await job.run(); } catch { /* a failed model falls back on its own */ }
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  building = false;
}

/** Start fetching a player's skin early (e.g. when their row is hovered), so their profile opens ready. */
export function prefetchSkin(name: string) {
  if (canAnimate()) void loadSkinImage(name).catch(() => {});
}

type Props = {
  player: { name: string; uuid?: string | undefined };
  pose?: Pose;
  /** Resting turn in radians (positive turns the player toward the viewer's right). */
  facing?: number;
  /** Lower numbers get their 3D model built first when several are on screen. */
  priority?: number;
  className?: string;
};

const TAU = Math.PI * 2;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (x: number) => x * x * (3 - 2 * x);

export function PlayerViewer({ player, pose = "calm", facing = 0, priority = 0, className }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    // Less motion or a data saver: the still crafty.gg render instead of a 3D model.
    if (!canAnimate()) { setStatus("fallback"); return; }
    setStatus("loading");

    let disposed = false;
    let viewer: SkinViewer | null = null;
    const cleanups: (() => void)[] = [];
    // WebGL unavailable, or no skin for this name: fall back to the crafty.gg render
    const fail = () => {
      if (disposed) return;
      viewer?.dispose();
      viewer = null;
      setStatus("fallback");
    };

    const start = async (engine: Engine, skinImage: HTMLImageElement) => {
      const { SkinViewer, FunctionAnimation } = engine;
      const rect = box.getBoundingClientRect();
      try {
        viewer = new SkinViewer({
          canvas,
          width: Math.max(1, Math.round(rect.width)),
          height: Math.max(1, Math.round(rect.height)),
          pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
          fov: 38,
          zoom: 0.88,
        });
      } catch {
        fail();
        return;
      }
      const v = viewer;
      v.globalLight.intensity = 2.6;
      v.cameraLight.intensity = 1.15;
      v.controls.enabled = false; // we handle drag ourselves (flick and spring back)

      try {
        await v.loadSkin(skinImage, { model: "auto-detect" });
      } catch {
        fail();
        return;
      }
      if (disposed) return;

      /* ---------------- interaction state ---------------- */
      let lookX = 0, lookY = 0; // smoothed, -1..1
      let targetX = 0, targetY = 0;
      let lastMove = -Infinity;
      let spin = 0; // extra yaw from dragging
      let dragging = false;
      let lastDragX = 0;
      let dragged = 0; // total pixels moved during the current press

      const onMove = (e: PointerEvent) => {
        const r = box.getBoundingClientRect();
        // distance from the model to the cursor, relative to the window, so the whole page counts
        targetX = clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth * 0.45), -1, 1);
        targetY = clamp(((r.top + r.height * 0.28) - e.clientY) / (window.innerHeight * 0.45), -1, 1);
        lastMove = performance.now();
      };
      const onDown = (e: PointerEvent) => {
        dragging = true;
        dragged = 0;
        lastDragX = e.clientX;
        canvas.setPointerCapture(e.pointerId);
      };
      const onDrag = (e: PointerEvent) => {
        if (!dragging) return;
        const dx = e.clientX - lastDragX;
        dragged += Math.abs(dx);
        spin += dx * 0.012;
        lastDragX = e.clientX;
      };
      // The player sits inside a link. Without these, a drag turns into the browser's native
      // "drag this link" gesture, and letting go after a flick would open the profile page.
      const link = box.closest("a");
      const noNativeDrag = (e: Event) => e.preventDefault();
      const swallowClickAfterDrag = (e: MouseEvent) => {
        if (dragged > 6) { e.preventDefault(); e.stopPropagation(); }
        dragged = 0;
      };
      link?.addEventListener("dragstart", noNativeDrag);
      box.addEventListener("click", swallowClickAfterDrag, true);
      const onUp = () => { dragging = false; };
      window.addEventListener("pointermove", onMove, { passive: true });
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onDrag);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onUp);
      cleanups.push(() => {
        window.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointermove", onDrag);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointercancel", onUp);
        link?.removeEventListener("dragstart", noNativeDrag);
        box.removeEventListener("click", swallowClickAfterDrag, true);
      });

      /* ---------------- the animation ---------------- */
      v.animation = new FunctionAnimation((p: PlayerObject, t: number, dt: number) => {
        const k = 1 - Math.exp(-dt * 5);
        const idle = performance.now() - lastMove > 3500;
        if (idle) { targetX = 0; targetY = 0; }
        lookX += (targetX - lookX) * k;
        lookY += (targetY - lookY) * k;

        // after a flick, ease back to the nearest full turn so the player faces front again
        if (!dragging) spin += (Math.round(spin / TAU) * TAU - spin) * (1 - Math.exp(-dt * 3.2));

        const s = p.skin;
        const breathe = Math.sin(t * 1.7);
        const sway = Math.sin(t * 0.55);

        // baseline: standing, arms relaxed, head follows the cursor
        s.head.rotation.set(-lookY * 0.35 - 0.03 + Math.sin(t * 1.1) * 0.025, lookX * 0.6 + Math.sin(t * 0.7) * 0.08, 0);
        s.body.rotation.set(0, lookX * 0.14, 0);
        s.leftArm.rotation.set(Math.sin(t * 1.2) * 0.05, 0, 0.07 + breathe * 0.025);
        s.rightArm.rotation.set(-Math.sin(t * 1.2) * 0.05, 0, -0.07 - breathe * 0.025);
        s.leftLeg.rotation.set(0, 0, 0.035);
        s.rightLeg.rotation.set(0, 0, -0.035);
        p.position.y = breathe * 0.12;

        let yaw = facing + sway * 0.1;

        if (pose === "champion") {
          // chest out, one hand on the hip, and a wave every few seconds
          s.head.rotation.x -= 0.06;
          s.leftArm.rotation.z = 0.42;
          const cycle = t % 7;
          const a = cycle < 2.6 ? smooth(clamp(Math.min(cycle, 2.6 - cycle) / 0.5, 0, 1)) : 0;
          s.rightArm.rotation.z = -0.07 - a * 2.55 + a * Math.sin(t * 9) * 0.22;
          s.rightArm.rotation.x = -a * 0.1;
        } else if (pose === "ready") {
          // weapon-ready stance: arms forward and out, weight shifting between the feet
          s.rightArm.rotation.set(-0.75 + breathe * 0.04, 0, -0.2);
          s.leftArm.rotation.set(-0.45 + breathe * 0.04, 0, 0.34);
          s.leftLeg.rotation.x = 0.12 * sway;
          s.rightLeg.rotation.x = -0.12 * sway;
          yaw += sway * 0.05;
        } else if (pose === "showcase") {
          // slow turntable sweep with the odd glance around
          yaw += Math.sin(t * 0.42) * 0.4;
          s.leftArm.rotation.z = 0.12 + breathe * 0.03;
          s.rightArm.rotation.z = -0.12 - breathe * 0.03;
        } else {
          // calm: relaxed, one foot back
          s.rightLeg.rotation.x = -0.08;
          s.leftLeg.rotation.x = 0.08;
          s.rightArm.rotation.z = -0.16 - breathe * 0.03;
        }

        v.playerWrapper.rotation.y = yaw + lookX * 0.3 + spin;
      });

      /* ---------------- housekeeping ---------------- */
      const ro = new ResizeObserver(() => {
        const r = box.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) v.setSize(Math.round(r.width), Math.round(r.height));
      });
      ro.observe(box);
      cleanups.push(() => ro.disconnect());

      // don't burn GPU while scrolled out of view
      const io = new IntersectionObserver(([entry]) => { v.renderPaused = !entry?.isIntersecting; });
      io.observe(box);
      cleanups.push(() => io.disconnect());

      // Don't hand over to the next model until this one has actually been shown: React commits the
      // state change a moment after this frame, and the next model's setup would block it.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => {
          if (!disposed) setStatus("ready");
          setTimeout(resolve, 80);
        }),
      );
    };

    // The skin file and the 3D engine download at the same time, rather than one after the other.
    Promise.all([loadEngine(), loadSkinImage(player.name)])
      .then(([engine, image]) => {
        if (!disposed) scheduleBuild(priority, () => (disposed ? Promise.resolve() : start(engine, image)));
      })
      .catch(fail);

    return () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
      viewer?.dispose();
      viewer = null;
    };
  }, [player.name, pose, facing, priority]);

  return (
    <div
      ref={boxRef}
      role="img"
      aria-label={`${player.name}'s skin`}
      data-ready={status === "ready"}
      data-status={status}
      className={cn("group/viewer relative select-none [-webkit-touch-callout:none]", className)}
    >
      {/* While the model loads, a soft silhouette holds its place. It fades out as the model fades in. */}
      <svg
        aria-hidden
        viewBox="0 0 16 32"
        preserveAspectRatio="xMidYMax meet"
        className="viewer-ghost pointer-events-none absolute inset-x-0 bottom-[7%] mx-auto h-[74%] w-full opacity-0 group-data-[status=loading]/viewer:opacity-100"
        style={{ color: "color-mix(in oklab, var(--tone, #ffffff) 55%, transparent)" }}
      >
        <g className="viewer-ghost-pulse">
          <g fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeOpacity=".4" strokeWidth=".3">
            <rect x="4" y="0" width="8" height="8" rx="1" />
            <rect x="4" y="8" width="8" height="12" rx=".8" />
            <rect x="0" y="8" width="4" height="12" rx=".8" />
            <rect x="12" y="8" width="4" height="12" rx=".8" />
            <rect x="4" y="20" width="4" height="12" rx=".8" />
            <rect x="8" y="20" width="4" height="12" rx=".8" />
          </g>
          <g fill="currentColor" fillOpacity=".5">
            <rect x="5.6" y="3.2" width="1.5" height="1.3" />
            <rect x="8.9" y="3.2" width="1.5" height="1.3" />
          </g>
        </g>
      </svg>
      {/* The crafty.gg render is only for players the 3D model can't show (no skin file, no WebGL, reduced motion). */}
      {status === "fallback" && (
        <PlayerImg
          player={player}
          kind="body"
          className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_14px_16px_rgba(0,0,0,0.5)] animate-in fade-in duration-500"
        />
      )}
      {/* ground shadow and pedestal ring that breathe with the model */}
      <div aria-hidden className="viewer-shadow pointer-events-none absolute inset-x-[14%] bottom-[1%] h-[10%] rounded-[50%]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[20%] bottom-[2.5%] h-[7%] rounded-[50%] border"
        style={{ borderColor: "color-mix(in oklab, var(--tone, #ffffff) 40%, transparent)" }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden
        className="viewer-canvas absolute inset-0 h-full w-full cursor-grab touch-pan-y opacity-0 active:cursor-grabbing group-data-[ready=true]/viewer:opacity-100"
      />
    </div>
  );
}
