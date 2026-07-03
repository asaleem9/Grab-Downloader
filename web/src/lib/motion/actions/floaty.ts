import type { Action } from "svelte/action";

import { gsap } from "../gsap";
import { motionLevel } from "../stores";

export type FloatyOptions = {
    x?: number;
    y?: number;
    rotation?: number;
    minDuration?: number;
    maxDuration?: number;
};

const floatyTweens = new Set<gsap.core.Tween>();

/* bulk control for the perf guard: slow every drift loop at once */
export function setFloatyTimeScale(scale: number) {
    for (const tween of floatyTweens) tween.timeScale(scale);
}

/*
    decorative infinite drift. repeatRefresh re-rolls the randoms
    each cycle so it never reads as a loop.
*/
export const floaty: Action<HTMLElement, FloatyOptions | undefined> = (
    node,
    options
) => {
    let tween: gsap.core.Tween | null = null;

    const start = (opts?: FloatyOptions) => {
        const ax = opts?.x ?? 10;
        const ay = opts?.y ?? 14;
        const rot = opts?.rotation ?? 4;
        const d0 = opts?.minDuration ?? 3.5;
        const d1 = opts?.maxDuration ?? 6;

        tween = gsap.to(node, {
            x: `random(-${ax}, ${ax})`,
            y: `random(-${ay}, ${ay})`,
            rotation: `random(-${rot}, ${rot})`,
            duration: `random(${d0}, ${d1})`,
            repeat: -1,
            yoyo: true,
            repeatRefresh: true,
            ease: "sine.inOut",
            delay: "random(0, 2)",
        });
        floatyTweens.add(tween);
    };

    const stop = () => {
        if (tween) {
            floatyTweens.delete(tween);
            tween.kill();
            tween = null;
        }
        gsap.set(node, { x: 0, y: 0, rotation: 0 });
    };

    let opts = options;
    const unsubscribe = motionLevel.subscribe((level) => {
        stop();
        if (level === "full") start(opts);
    });

    return {
        update(next) {
            opts = next;
            if (tween) {
                stop();
                start(opts);
            }
        },
        destroy() {
            unsubscribe();
            stop();
        },
    };
};
