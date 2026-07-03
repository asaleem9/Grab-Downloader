<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";

    import { gsap } from "../gsap";
    import { floaty, setFloatyTimeScale } from "../actions/floaty";
    import { motionLevel, ambientDim, fxTier } from "../stores";

    import MorphBlob from "./MorphBlob.svelte";

    /*
        the always-alive background: 3 mega flat-fill washes + 4
        solid satellite droplets. zero blur, zero filters here - a
        full-viewport filter is the canonical way to kill the frame
        rate. washes morph shape on a slow cycle, satellites drift on
        floaty transforms; everything is compositor-only.

        dims itself while ffmpeg runs (ambientDim) and on non-home
        routes so settings/about read calmer.
    */

    let layer: HTMLDivElement = $state()!;
    let washWrap1: HTMLDivElement = $state()!;
    let washWrap2: HTMLDivElement = $state()!;
    let washWrap3: HTMLDivElement | undefined = $state();

    const isHome = $derived($page.url.pathname === "/");
    const full = $derived($motionLevel === "full");
    const washCount = $derived($fxTier === "high" ? 3 : 2);
    const satellites = $derived(
        $fxTier === "high"
            ? [
                  { size: 22, color: "var(--grape)", top: "18%", left: "12%" },
                  { size: 14, color: "var(--tangerine)", top: "68%", left: "84%" },
                  { size: 18, color: "var(--lime)", top: "80%", left: "22%" },
                  { size: 8, color: "var(--ink)", top: "30%", left: "78%" },
              ]
            : [
                  { size: 18, color: "var(--grape)", top: "20%", left: "12%" },
                  { size: 12, color: "var(--tangerine)", top: "72%", left: "82%" },
              ]
    );

    /* dim when processing or off the save screen */
    $effect(() => {
        if (!layer) return;
        const dim = $ambientDim || !isHome;
        gsap.to(layer, { opacity: dim ? 0.45 : 1, duration: 0.6, ease: "power2.out" });
        setFloatyTimeScale($ambientDim ? 0.4 : 1);
    });

    onMount(() => {
        if (!full) return;

        /* very slow drift for the big washes - deliberately below
           attention threshold, the room just breathes */
        const wraps = [washWrap1, washWrap2, washWrap3].filter(
            (w): w is HTMLDivElement => !!w
        );
        const drifts = wraps.map((wrap, i) =>
            gsap.to(wrap, {
                x: `random(-${28 + i * 8}, ${28 + i * 8})`,
                y: `random(-${22 + i * 6}, ${22 + i * 6})`,
                duration: `random(14, 26)`,
                repeat: -1,
                yoyo: true,
                repeatRefresh: true,
                ease: "sine.inOut",
            })
        );

        /* pointer parallax, desktop only */
        let qx: Array<(v: number) => void> = [];
        let qy: Array<(v: number) => void> = [];
        let parallax: ((e: PointerEvent) => void) | null = null;

        if (window.matchMedia("(pointer: fine)").matches) {
            qx = wraps.map((w) => gsap.quickTo(w, "xPercent", { duration: 1.2, ease: "power2.out" }));
            qy = wraps.map((w) => gsap.quickTo(w, "yPercent", { duration: 1.2, ease: "power2.out" }));

            parallax = (e: PointerEvent) => {
                const nx = e.clientX / window.innerWidth - 0.5;
                const ny = e.clientY / window.innerHeight - 0.5;
                wraps.forEach((_, i) => {
                    const depth = (i + 1) * 1.4;
                    qx[i](nx * depth);
                    qy[i](ny * depth);
                });
            };
            window.addEventListener("pointermove", parallax, { passive: true });
        }

        return () => {
            drifts.forEach((d) => d.kill());
            if (parallax) window.removeEventListener("pointermove", parallax);
        };
    });
</script>

<div class="ambient-layer" bind:this={layer} aria-hidden="true">
    <div class="wash wash-grape" bind:this={washWrap1}>
        <MorphBlob idle={full} idlePeriod={34} size={0} class="wash-svg" fill="var(--grape-milk)" state={0} />
    </div>
    <div class="wash wash-tangerine" bind:this={washWrap2}>
        <MorphBlob idle={full} idlePeriod={42} size={0} class="wash-svg" fill="var(--tangerine-milk)" state={2} />
    </div>
    {#if washCount > 2}
        <div class="wash wash-lime" bind:this={washWrap3}>
            <MorphBlob idle={full} idlePeriod={38} size={0} class="wash-svg" fill="var(--lime-milk)" state={4} />
        </div>
    {/if}

    {#each satellites as sat}
        <div
            class="satellite"
            style="width: {sat.size}px; height: {sat.size}px; background: {sat.color}; top: {sat.top}; left: {sat.left};"
            use:floaty={{ x: 18, y: 26, rotation: 8, minDuration: 5, maxDuration: 9 }}
        ></div>
    {/each}
</div>

<style>
    .ambient-layer {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        /* negative z-index paints behind in-flow page content
           while staying above #content's background */
        z-index: -1;
    }

    .wash {
        position: absolute;
        will-change: transform;
    }

    .wash :global(.wash-svg) {
        width: 100%;
        height: 100%;
    }

    .wash-grape {
        width: 68vw;
        height: 68vw;
        top: -24vw;
        left: -18vw;
    }

    .wash-tangerine {
        width: 54vw;
        height: 54vw;
        bottom: -22vw;
        right: -14vw;
    }

    .wash-lime {
        width: 40vw;
        height: 40vw;
        top: 42%;
        left: -16vw;
    }

    .satellite {
        position: absolute;
        border-radius: var(--blob-b);
        will-change: transform;
        opacity: 0.85;
    }

    @media screen and (max-width: 535px) {
        .wash-grape {
            width: 110vw;
            height: 110vw;
            top: -40vw;
            left: -30vw;
        }

        .wash-tangerine {
            width: 90vw;
            height: 90vw;
            bottom: -35vw;
            right: -25vw;
        }
    }
</style>
