<script lang="ts" module>
    /* hand-drawn organic presets on a 200x200 box; morph targets.
       deliberately lumpy - a blob that reads as a circle is a
       wasted blob */
    export const BLOB_PATHS = [
        "M104,22 C144,6 182,36 184,74 C186,106 158,118 162,146 C166,176 136,192 104,184 C76,177 74,196 48,180 C18,162 26,128 22,100 C18,68 34,52 58,40 C78,30 82,31 104,22 Z",
        "M96,14 C126,10 140,34 166,44 C192,54 196,90 184,118 C172,146 178,168 150,180 C122,192 100,172 72,178 C44,184 20,164 22,132 C24,104 8,86 20,60 C32,32 66,18 96,14 Z",
        "M108,18 C138,26 178,20 188,54 C198,86 168,102 170,132 C172,162 152,186 120,186 C90,186 82,168 54,166 C26,164 8,138 14,108 C20,80 36,74 46,50 C58,22 78,10 108,18 Z",
        "M92,20 C122,4 158,16 172,44 C188,74 210,96 192,126 C176,152 148,146 128,166 C108,186 76,196 50,178 C24,160 30,130 24,104 C18,76 26,54 48,40 C64,30 72,30 92,20 Z",
        "M100,12 C134,14 152,42 176,58 C198,74 194,108 180,134 C166,160 142,158 118,174 C94,190 60,188 42,162 C24,138 34,116 26,90 C18,60 40,44 62,32 C76,24 84,11 100,12 Z",
        "M110,24 C146,16 172,44 178,78 C184,110 202,134 182,158 C162,182 130,172 102,180 C74,188 44,182 30,154 C16,128 30,108 26,80 C22,52 44,34 72,28 C86,25 96,27 110,24 Z",
    ];
</script>

<script lang="ts">
    import { onMount, untrack } from "svelte";

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

    /* captured once: svelte must never rewrite `d` mid-morph */
    const initialD = untrack(() => paths[state ?? 0]);

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
    <path bind:this={pathEl} d={initialD} {fill} />
</svg>

<style>
    .morph-blob {
        display: block;
        overflow: visible;
    }

    .morph-blob path {
        transition: fill 0.35s;
    }
</style>
