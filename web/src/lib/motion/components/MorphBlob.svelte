<script lang="ts" module>
    /* hand-drawn organic presets on a 200x200 box; morph targets */
    export const BLOB_PATHS = [
        "M100,15 C140,10 178,38 184,80 C190,122 168,164 128,178 C88,192 44,178 26,142 C8,106 14,60 44,36 C66,18 76,18 100,15 Z",
        "M104,12 C146,16 184,48 182,92 C180,136 148,172 106,180 C64,188 28,160 20,118 C12,76 30,38 66,22 C80,16 90,11 104,12 Z",
        "M96,20 C128,6 172,22 186,58 C200,94 184,140 152,164 C120,188 72,190 44,164 C16,138 10,92 30,60 C50,28 72,30 96,20 Z",
        "M100,10 C132,18 150,40 168,70 C186,100 190,140 164,164 C138,188 94,192 60,176 C26,160 6,124 16,88 C26,52 68,2 100,10 Z",
        "M92,16 C130,8 170,30 182,66 C194,102 180,148 148,170 C116,192 66,188 40,160 C14,132 12,84 34,54 C56,24 64,22 92,16 Z",
        "M108,14 C150,20 180,54 178,96 C176,138 142,168 104,176 C66,184 30,166 18,128 C6,90 22,48 56,28 C74,18 88,12 108,14 Z",
    ];
</script>

<script lang="ts">
    import { onMount } from "svelte";

    import { gsap } from "../gsap";
    import { EASE } from "../eases";
    import { motionLevel, motionOK } from "../stores";

    type Props = {
        /* controlled morph target - drives state choreography */
        state?: number;
        /* slow ambient cycling through the preset library */
        idle?: boolean;
        idlePeriod?: number;
        morphDuration?: number;
        paths?: string[];
        fill?: string;
        size?: number;
        class?: string;
    };

    let {
        state = undefined,
        idle = false,
        idlePeriod = 4,
        morphDuration = 1.1,
        paths = BLOB_PATHS,
        fill = "var(--grape)",
        size = 180,
        class: className = "",
    }: Props = $props();

    let pathEl: SVGPathElement;
    let idleTween: gsap.core.Tween | null = null;
    let idleIndex = 0;

    const startIdle = () => {
        if (idleTween || !idle) return;
        const next = () => {
            idleIndex = (idleIndex + 1) % paths.length;
            idleTween = gsap.to(pathEl, {
                morphSVG: { shape: paths[idleIndex], shapeIndex: "auto" },
                duration: idlePeriod,
                ease: "sine.inOut",
                onComplete: next,
            });
        };
        next();
    };

    const stopIdle = () => {
        idleTween?.kill();
        idleTween = null;
    };

    onMount(() => {
        const unsubscribe = motionLevel.subscribe((level) => {
            if (level === "full") startIdle();
            else stopIdle();
        });

        return () => {
            unsubscribe();
            stopIdle();
            gsap.killTweensOf(pathEl);
        };
    });

    $effect(() => {
        if (state === undefined || !pathEl) return;
        const target = paths[state % paths.length];

        stopIdle();

        if (!motionOK()) {
            /* reduced: crossfade instead of morphing */
            gsap.set(pathEl, { attr: { d: target } });
            gsap.fromTo(pathEl, { opacity: 0.6 }, { opacity: 1, duration: 0.15 });
            return;
        }

        gsap.to(pathEl, {
            morphSVG: { shape: target, shapeIndex: "auto" },
            duration: morphDuration,
            ease: EASE.liquid,
            onComplete: () => {
                if (idle && motionOK()) startIdle();
            },
        });
    });
</script>

<svg
    class="morph-blob {className}"
    width={size}
    height={size}
    viewBox="0 0 200 200"
    aria-hidden="true"
    focusable="false"
>
    <path bind:this={pathEl} d={paths[state ?? 0]} {fill} />
</svg>

<style>
    .morph-blob {
        display: block;
        overflow: visible;
    }
</style>
