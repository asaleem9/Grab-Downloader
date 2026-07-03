import type { Action } from "svelte/action";

import { gsap } from "../gsap";
import { EASE } from "../eases";
import { motionOK } from "../stores";

export type SquishOptions = {
    intensity?: number;
    origin?: string;
    disabled?: boolean;
};

const press = (node: HTMLElement, intensity: number, origin: string) => {
    gsap.to(node, {
        scaleX: 1 + 0.08 * intensity,
        scaleY: 1 - 0.12 * intensity,
        transformOrigin: origin,
        duration: 0.1,
        ease: "power2.out",
        overwrite: "auto",
    });
};

const release = (node: HTMLElement) => {
    gsap.to(node, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.65,
        ease: EASE.pop,
        overwrite: "auto",
    });
};

/*
    squash-and-stretch on press. components that adopt this must not
    keep their own :active { transform } css - inline gsap transforms
    and css transforms fight each other.
*/
export const squish: Action<HTMLElement, SquishOptions | undefined> = (
    node,
    options
) => {
    let opts = options ?? {};

    // the global delegate skips nodes that manage their own squish
    node.dataset.squish = "own";

    const down = () => {
        if (opts.disabled || !motionOK()) return;
        press(node, opts.intensity ?? 1, opts.origin ?? "50% 60%");
    };

    const up = () => {
        if (opts.disabled) return;
        release(node);
    };

    node.addEventListener("pointerdown", down);
    node.addEventListener("pointerup", up);
    node.addEventListener("pointerleave", up);
    node.addEventListener("pointercancel", up);

    return {
        update(next) {
            opts = next ?? {};
        },
        destroy() {
            node.removeEventListener("pointerdown", down);
            node.removeEventListener("pointerup", up);
            node.removeEventListener("pointerleave", up);
            node.removeEventListener("pointercancel", up);
            gsap.killTweensOf(node);
        },
    };
};

/*
    one delegated squisher for every button in the app - legacy
    components get tactility with zero per-component edits. explicit
    use:squish (data-squish="own") and data-no-squish opt out.
*/
export function initGlobalSquish() {
    const SELECTOR = "button, .button, [role=\"button\"]";
    let active: HTMLElement | null = null;

    const find = (target: EventTarget | null): HTMLElement | null => {
        if (!(target instanceof Element)) return null;
        const el = target.closest<HTMLElement>(SELECTOR);
        if (!el || el.dataset.squish === "own" || el.hasAttribute("data-no-squish")) {
            return null;
        }
        return el;
    };

    const down = (e: PointerEvent) => {
        const el = find(e.target);
        if (!el || !motionOK()) return;
        active = el;
        press(el, 1, "50% 60%");
    };

    const up = () => {
        if (!active) return;
        release(active);
        active = null;
    };

    document.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("pointerup", up, { passive: true });
    document.addEventListener("pointercancel", up, { passive: true });
    window.addEventListener("blur", up);

    return () => {
        document.removeEventListener("pointerdown", down);
        document.removeEventListener("pointerup", up);
        document.removeEventListener("pointercancel", up);
        window.removeEventListener("blur", up);
    };
}
