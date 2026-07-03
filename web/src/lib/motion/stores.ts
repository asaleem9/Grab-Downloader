import { readable, writable, derived, get } from "svelte/store";
import { browser } from "$app/environment";

import settings from "$lib/state/settings";
import { queue } from "$lib/state/task-manager/queue";

/*
    the single motion gate. device.ts samples prefers-reduced-motion
    once at load; this store listens live, so flipping the OS setting
    (or the in-app toggle) takes effect without a reload.
*/
const osReducedMotion = writable(false);

if (browser) {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    osReducedMotion.set(mq.matches);
    mq.addEventListener?.("change", () => osReducedMotion.set(mq.matches));
}

export type MotionLevel = "full" | "reduced";

export const motionLevel = derived(
    [settings, osReducedMotion],
    ([$settings, $os]): MotionLevel =>
        $settings.accessibility.reduceMotion || $os ? "reduced" : "full"
);

export const motionOK = () => get(motionLevel) === "full";

/*
    effect tier for degrading heavy visuals: goo filters and the
    cursor need a fine pointer and some headroom; small/coarse/weak
    devices get the calm versions via [data-fx-tier] css gates.
*/
export type FxTier = "high" | "mid" | "low";

const computeTier = (): FxTier => {
    if (!browser) return "high";

    const fine = window.matchMedia("(pointer: fine)").matches;
    const wide = window.innerWidth > 535;
    const cores = navigator.hardwareConcurrency ?? 8;

    if (fine && wide && cores > 4) return "high";
    if (!wide && cores <= 4) return "low";
    return "mid";
};

export const fxTier = readable<FxTier>(computeTier(), (set) => {
    if (!browser) return;

    const update = () => set(computeTier());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
});

export type CursorState = "default" | "hover" | "text" | "drag" | "hidden";

export const cursorState = writable<CursorState>("default");

/*
    decorative motion sheds load while the in-browser ffmpeg queue is
    busy: the compositor and wasm workers share cores, and ambient
    blobs aren't worth dropped frames on a real download.
*/
export const ambientDim = derived(queue, ($queue) =>
    Object.values($queue).some((item) => item.state === "running")
);
