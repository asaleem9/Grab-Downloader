import type { Action } from "svelte/action";

import { gsap, SplitText } from "../gsap";
import { EASE } from "../eases";
import { motionOK, fxTier } from "../stores";
import { get } from "svelte/store";

export type SplitRevealOptions = {
    type?: "chars" | "words" | "chars,words" | "lines";
    stagger?: number;
    duration?: number;
    delay?: number;
    /* re-split key: pass the translated string so locale switches re-run */
    key?: string;
};

/*
    staggered text entrance. autoSplit handles font-load reflow (the
    app self-hosts fonts, so late swaps happen); `key` re-splits on
    locale change. aria: "auto" keeps screen readers reading whole
    strings. char-level splitting is for short headings - the mobile
    tier forces words to avoid layout thrash.
*/
export const splitReveal: Action<HTMLElement, SplitRevealOptions | undefined> = (
    node,
    options
) => {
    let split: SplitText | null = null;

    const run = (opts?: SplitRevealOptions) => {
        split?.revert();
        split = null;

        if (!motionOK()) {
            gsap.fromTo(node, { opacity: 0 }, { opacity: 1, duration: 0.15 });
            return;
        }

        const requested = opts?.type ?? "chars,words";
        const type = get(fxTier) === "high" ? requested : "words";

        split = SplitText.create(node, {
            type,
            autoSplit: true,
            aria: "auto",
            onSplit: (self: SplitText) =>
                gsap.from(type.includes("chars") ? self.chars : self.words, {
                    yPercent: 115,
                    opacity: 0,
                    stagger: opts?.stagger ?? 0.018,
                    duration: opts?.duration ?? 0.7,
                    delay: opts?.delay ?? 0,
                    ease: EASE.liquid,
                }),
        });
    };

    run(options);
    let lastKey = options?.key;

    return {
        update(next) {
            if (next?.key !== lastKey) {
                lastKey = next?.key;
                run(next);
            }
        },
        destroy() {
            split?.revert();
            gsap.killTweensOf(node);
        },
    };
};
