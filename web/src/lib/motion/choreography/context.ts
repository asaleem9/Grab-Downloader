import { tick } from "svelte";

import { gsap, Flip } from "../gsap";
import { EASE } from "../eases";
import { motionOK } from "../stores";

/* gsap.context wrapper: run fn scoped to root, get back one revert */
export function scoped(fn: () => void, root?: Element) {
    const ctx = gsap.context(fn, root ?? undefined);
    return () => ctx.revert();
}

export type TimelineBuilder = (tl: gsap.core.Timeline) => void;

/*
    state-machine choreography: timelines keyed "from->to" with a
    plain "to" fallback. go() kills the in-flight timeline first so
    rapid state changes never stack. under reduced motion the
    timeline is built then jumped to its end state - transitions are
    never *skipped*, so the ui can't get stuck mid-state.

    note: builders must not contain infinite repeats (idle loops
    live outside transition maps) or the reduced jump can't land.
*/
export function transitionMap<S extends string>(
    defs: Partial<Record<`${S}->${S}` | S, TimelineBuilder>>
) {
    let current: gsap.core.Timeline | null = null;

    return {
        go(from: S, to: S): gsap.core.Timeline | null {
            current?.kill();
            current = null;

            const builder =
                defs[`${from}->${to}` as `${S}->${S}`] ?? defs[to as S];
            if (!builder) return null;

            const tl = gsap.timeline();
            builder(tl);

            if (!motionOK()) {
                tl.progress(1, false);
            }

            current = tl;
            return tl;
        },
        destroy() {
            current?.kill();
            current = null;
        },
    };
}

/*
    the Flip bridge for keyed lists: capture state, let svelte mutate
    the dom, then animate the diff. enters pop, leavers shrink away.
*/
export async function flipList(
    container: HTMLElement,
    selector: string,
    mutate: () => void | Promise<void>
) {
    if (!motionOK()) {
        await mutate();
        await tick();
        return;
    }

    const state = Flip.getState(container.querySelectorAll(selector));
    await mutate();
    await tick();

    Flip.from(state, {
        duration: 0.5,
        ease: EASE.liquid,
        absolute: true,
        onEnter: (els) =>
            gsap.from(els, { scale: 0, opacity: 0, ease: EASE.pop, duration: 0.6 }),
        onLeave: (els) =>
            gsap.to(els, { scale: 0, opacity: 0, ease: "back.in(2)", duration: 0.25 }),
    });
}
