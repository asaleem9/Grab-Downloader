import type { Action } from "svelte/action";

import { gsap, Draggable } from "../gsap";
import { EASE } from "../eases";
import { motionOK, cursorState } from "../stores";

export type LiquidDragOptions = {
    bounds?: HTMLElement | string;
    onDrop?: (node: HTMLElement, drag: Draggable) => void;
    disabled?: boolean;
};

/*
    draggable with inertia and squish baked in: press squashes,
    throws overshoot-settle, bounds impacts jelly-wiggle.
*/
export const liquidDrag: Action<HTMLElement, LiquidDragOptions | undefined> = (
    node,
    options
) => {
    let opts = options ?? {};
    let instance: Draggable | null = null;

    const create = () => {
        [instance] = Draggable.create(node, {
            type: "x,y",
            inertia: true,
            bounds: opts.bounds ?? node.parentElement ?? undefined,
            edgeResistance: 0.65,
            dragResistance: 0.05,
            onPress() {
                cursorState.set("drag");
                if (motionOK()) {
                    gsap.to(node, {
                        scaleX: 1.06,
                        scaleY: 0.94,
                        duration: 0.15,
                        ease: "power2.out",
                        overwrite: "auto",
                    });
                }
            },
            onRelease() {
                cursorState.set("default");
                gsap.to(node, {
                    scaleX: 1,
                    scaleY: 1,
                    duration: 0.6,
                    ease: EASE.settle,
                    overwrite: "auto",
                });
            },
            onThrowComplete() {
                if (motionOK()) {
                    gsap.to(node, {
                        rotation: "+=0",
                        scaleX: 1,
                        scaleY: 1,
                        duration: 0.5,
                        ease: EASE.jelly,
                        overwrite: "auto",
                    });
                }
                opts.onDrop?.(node, this as Draggable);
            },
        });

        if (opts.disabled) instance?.disable();
    };

    create();

    return {
        update(next) {
            opts = next ?? {};
            if (opts.disabled) instance?.disable();
            else instance?.enable();
        },
        destroy() {
            instance?.kill();
            gsap.killTweensOf(node);
        },
    };
};
