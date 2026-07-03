import type { Action } from "svelte/action";

import { gsap } from "../gsap";

export type MagneticOptions = {
    strength?: number;
    radius?: number;
};

export type MagneticEntry = {
    el: HTMLElement;
    strength: number;
    radius: number;
    rect: DOMRect | null;
    qx: (value: number) => void;
    qy: (value: number) => void;
    pulled: boolean;
};

/*
    registry consumed by LiquidCursor's single ticker callback - the
    action itself adds zero listeners. on coarse pointers the cursor
    never mounts, so entries just sit inert.
*/
export const magneticRegistry = new Map<HTMLElement, MagneticEntry>();

export function refreshMagneticRects() {
    for (const entry of magneticRegistry.values()) {
        entry.rect = entry.el.getBoundingClientRect();
    }
}

export const magnetic: Action<HTMLElement, MagneticOptions | undefined> = (
    node,
    options
) => {
    const register = (opts?: MagneticOptions) => {
        magneticRegistry.set(node, {
            el: node,
            strength: opts?.strength ?? 0.3,
            radius: opts?.radius ?? 90,
            rect: null,
            qx: gsap.quickTo(node, "x", { duration: 0.4, ease: "power3.out" }),
            qy: gsap.quickTo(node, "y", { duration: 0.4, ease: "power3.out" }),
            pulled: false,
        });
    };

    register(options);

    return {
        update(next) {
            magneticRegistry.delete(node);
            register(next);
        },
        destroy() {
            magneticRegistry.delete(node);
            gsap.killTweensOf(node);
        },
    };
};
