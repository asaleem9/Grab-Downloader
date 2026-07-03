<script lang="ts">
    import { onMount } from "svelte";

    import { gsap } from "../gsap";
    import { registerCurtain, type CurtainOptions } from "../transitions";

    /*
        the page-transition membrane: a grape sheet with a wavy
        leading edge that sweeps the content area (never the nav).
        cover() resolves when the screen is hidden so the router can
        swap pages behind it; reveal() peels it away, continuing in
        the same direction it arrived from.
    */

    let wrap: HTMLDivElement;
    let vSheet: SVGPathElement;
    let hSheet: SVGPathElement;

    /* wave on the bottom edge (vertical sweeps) */
    const SHEET_V =
        "M0,0 L0,86 C8,92 16,82 25,88 C34,94 42,84 50,90 C58,96 66,84 75,89 C84,94 92,86 100,90 L100,0 Z";
    /* wave on the right edge (horizontal sweeps) */
    const SHEET_H =
        "M0,0 L86,0 C92,8 82,16 88,25 C94,34 84,42 90,50 C96,58 84,66 89,75 C94,84 86,92 90,100 L0,100 Z";

    onMount(() => {
        gsap.set(wrap, { visibility: "hidden" });

        let axis: "x" | "y" = "y";
        let sign = 1;

        const cover = ({ variant = "full", direction = "down" }: CurtainOptions = {}) =>
            new Promise<void>((resolve) => {
                gsap.killTweensOf(wrap);

                axis = direction === "left" || direction === "right" ? "x" : "y";
                sign = direction === "up" || direction === "left" ? 1 : -1;

                gsap.set(vSheet, { autoAlpha: axis === "y" ? 1 : 0 });
                gsap.set(hSheet, { autoAlpha: axis === "x" ? 1 : 0 });
                /* horizontal sheet is drawn waving right; flip when
                   sweeping the other way */
                gsap.set(hSheet, { scaleX: sign === 1 ? -1 : 1, transformOrigin: "50% 50%" });
                gsap.set(vSheet, { scaleY: sign === 1 ? -1 : 1, transformOrigin: "50% 50%" });

                gsap.set(wrap, {
                    visibility: "visible",
                    x: 0,
                    y: 0,
                    [axis === "x" ? "xPercent" : "yPercent"]: sign * 115,
                    [axis === "x" ? "yPercent" : "xPercent"]: 0,
                    scaleY: variant === "pane" && axis === "y" ? 0.7 : 1,
                });
                gsap.to(wrap, {
                    [axis === "x" ? "xPercent" : "yPercent"]: 0,
                    duration: variant === "pane" ? 0.25 : 0.34,
                    ease: "power3.in",
                    onComplete: resolve,
                });
            });

        const reveal = () =>
            new Promise<void>((resolve) => {
                gsap.to(wrap, {
                    [axis === "x" ? "xPercent" : "yPercent"]: sign * -115,
                    duration: 0.45,
                    ease: "power3.out",
                    onComplete: () => {
                        gsap.set(wrap, { visibility: "hidden" });
                        resolve();
                    },
                });
            });

        return registerCurtain({ cover, reveal });
    });
</script>

<div class="curtain" bind:this={wrap} aria-hidden="true">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <path bind:this={vSheet} d={SHEET_V} fill="var(--grape)" />
        <path bind:this={hSheet} d={SHEET_H} fill="var(--grape)" />
    </svg>
</div>

<style>
    .curtain {
        position: absolute;
        inset: -2%;
        z-index: 60;
        pointer-events: none;
        visibility: hidden;
        will-change: transform;
    }

    .curtain svg {
        width: 100%;
        height: 100%;
        display: block;
    }
</style>
