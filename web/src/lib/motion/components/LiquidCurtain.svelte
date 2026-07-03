<script lang="ts">
    import { onMount } from "svelte";

    import { gsap } from "../gsap";
    import { registerCurtain, type CurtainVariant } from "../transitions";

    /*
        the page-transition membrane: a grape sheet with a wavy
        leading edge that sweeps the content area (never the nav).
        cover() resolves when the screen is hidden so the router can
        swap pages behind it; reveal() peels it away.
    */

    let wrap: HTMLDivElement;

    /* wavy-edge sheet: drawn pointing down, rotated by direction */
    const SHEET =
        "M0,0 L0,86 C8,92 16,82 25,88 C34,94 42,84 50,90 C58,96 66,84 75,89 C84,94 92,86 100,90 L100,0 Z";

    onMount(() => {
        gsap.set(wrap, { yPercent: -115, visibility: "hidden" });

        const cover = (variant: CurtainVariant = "full") =>
            new Promise<void>((resolve) => {
                gsap.killTweensOf(wrap);
                gsap.set(wrap, {
                    visibility: "visible",
                    yPercent: -115,
                    scaleY: variant === "pane" ? 0.7 : 1,
                });
                gsap.to(wrap, {
                    yPercent: 0,
                    duration: variant === "pane" ? 0.25 : 0.35,
                    ease: "power3.in",
                    onComplete: resolve,
                });
            });

        const reveal = () =>
            new Promise<void>((resolve) => {
                gsap.to(wrap, {
                    yPercent: 115,
                    duration: 0.45,
                    ease: "power3.out",
                    onComplete: () => {
                        gsap.set(wrap, { visibility: "hidden", yPercent: -115 });
                        resolve();
                    },
                });
            });

        return registerCurtain({ cover, reveal });
    });
</script>

<div class="curtain" bind:this={wrap} aria-hidden="true">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d={SHEET} fill="var(--grape)" />
    </svg>
</div>

<style>
    .curtain {
        position: absolute;
        inset: -2% 0;
        z-index: 60;
        pointer-events: none;
        visibility: hidden;
        will-change: transform;
    }

    .curtain svg {
        width: 100%;
        height: 104%;
        display: block;
    }
</style>
