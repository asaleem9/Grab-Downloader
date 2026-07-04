<script lang="ts">
    import { onMount } from "svelte";

    import { gsap } from "../gsap";
    import { registerCurtain, type CurtainOptions } from "../transitions";

    /*
        the iris: an svg sheet with a circular hole punched through
        it (even-odd fill). covering shrinks the hole until the
        grape swallows the old page; revealing grows it again, so
        the new page appears through the expanding circle.
    */

    let wrap: HTMLDivElement;
    let sheet: SVGPathElement;
    let svg: SVGSVGElement;

    onMount(() => {
        gsap.set(wrap, { visibility: "hidden" });

        let w = 0;
        let h = 0;

        /* full rect minus a centered circle of radius r */
        const draw = (r: number) => {
            const cx = w / 2;
            const cy = h / 2;
            return (
                `M0,0 H${w} V${h} H0 Z ` +
                `M${cx - r},${cy} ` +
                `a${r},${r} 0 1,0 ${r * 2},0 ` +
                `a${r},${r} 0 1,0 ${-r * 2},0 Z`
            );
        };

        const iris = { r: 0 };
        const maxR = () => Math.hypot(w, h) / 2 + 8;

        const apply = () => sheet.setAttribute("d", draw(iris.r));

        const measure = () => {
            const rect = wrap.getBoundingClientRect();
            w = rect.width;
            h = rect.height;
            svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
        };

        let lastVariant: "full" | "pane" = "full";

        /* no closing animation: the sheet just appears, the page
           swaps behind it, and the single transition is the circle
           opening over the new content */
        const cover = ({ variant = "full" }: CurtainOptions = {}) =>
            new Promise<void>((resolve) => {
                gsap.killTweensOf(iris);
                measure();
                lastVariant = variant;

                iris.r = 0;
                apply();
                gsap.set(wrap, { visibility: "visible" });
                resolve();
            });

        const reveal = () =>
            new Promise<void>((resolve) => {
                gsap.to(iris, {
                    r: maxR(),
                    duration: lastVariant === "pane" ? 0.55 : 0.8,
                    ease: "power2.inOut",
                    onUpdate: apply,
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
    <svg bind:this={svg} preserveAspectRatio="none">
        <path bind:this={sheet} fill="var(--grape)" fill-rule="evenodd" />
    </svg>
</div>

<style>
    .curtain {
        position: absolute;
        inset: 0;
        z-index: 60;
        pointer-events: none;
        visibility: hidden;
    }

    .curtain svg {
        width: 100%;
        height: 100%;
        display: block;
    }
</style>
