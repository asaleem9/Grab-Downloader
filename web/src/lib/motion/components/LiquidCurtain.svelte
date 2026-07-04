<script lang="ts">
    import { onMount } from "svelte";

    import { gsap } from "../gsap";
    import { registerCurtain, type CurtainOptions } from "../transitions";

    /*
        the page-transition membrane: a grape blob that swells from
        the middle of the content area until it swallows the screen,
        then shrinks away over the new page. transform-only, so the
        whole thing lives on the compositor.
    */

    let wrap: HTMLDivElement;
    let blob: HTMLDivElement;

    const BASE = 100; // blob's unscaled diameter in px

    onMount(() => {
        gsap.set(wrap, { visibility: "hidden" });

        const coverScale = () => {
            const rect = wrap.getBoundingClientRect();
            /* enough to swallow the farthest corner, blob lumps included */
            return (Math.hypot(rect.width, rect.height) / BASE) * 1.3;
        };

        const cover = ({ variant = "full" }: CurtainOptions = {}) =>
            new Promise<void>((resolve) => {
                gsap.killTweensOf([wrap, blob]);
                gsap.set(wrap, { visibility: "visible" });
                gsap.set(blob, { scale: 0, opacity: 0.75, rotation: 0 });
                gsap.to(blob, {
                    scale: coverScale(),
                    opacity: 1,
                    rotation: 40,
                    duration: variant === "pane" ? 0.3 : 0.38,
                    ease: "power2.in",
                    onComplete: resolve,
                });
            });

        const reveal = () =>
            new Promise<void>((resolve) => {
                gsap.to(blob, {
                    scale: 0,
                    opacity: 0.7,
                    rotation: 90,
                    duration: 0.45,
                    ease: "power2.inOut",
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
    <div class="curtain-blob" bind:this={blob}></div>
</div>

<style>
    .curtain {
        position: absolute;
        inset: 0;
        z-index: 60;
        pointer-events: none;
        visibility: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    .curtain-blob {
        width: 100px;
        height: 100px;
        background: var(--grape);
        border-radius: var(--blob-a);
        will-change: transform;
    }
</style>
