<script lang="ts">
    import { onMount } from "svelte";

    import { t } from "$lib/i18n/translations";
    import { hapticSwitch } from "$lib/haptics";
    import settings, { updateSetting } from "$lib/state/settings";
    import type { DownloadModeOption } from "$lib/types/settings";

    import { gsap, EASE, motionOK } from "$lib/motion";

    import IconMute from "$components/icons/Mute.svelte";
    import IconMusic from "$components/icons/Music.svelte";
    import IconSparkles from "$components/icons/Sparkles.svelte";

    /*
        the mode molecule: three droplet nodes joined by an ink
        ligament. switching detaches a grape marble that stretches
        along the ligament and gets absorbed by the target node.
        j/k/l keyboard switching lives in Omnibox and just writes
        the same setting.
    */

    const modes = [
        { id: "auto" as DownloadModeOption, icon: IconSparkles, key: "J" },
        { id: "audio" as DownloadModeOption, icon: IconMusic, key: "K" },
        { id: "mute" as DownloadModeOption, icon: IconMute, key: "L" },
    ];

    let container: HTMLDivElement = $state()!;
    let marble: HTMLDivElement = $state()!;
    let nodeEls: HTMLElement[] = [];

    const active = $derived($settings.save.downloadMode);
    let prevMode: DownloadModeOption = $settings.save.downloadMode;

    const nodeCenter = (mode: DownloadModeOption) => {
        const i = modes.findIndex((m) => m.id === mode);
        const el = nodeEls[i];
        if (!el || !container) return 0;
        const box = el.getBoundingClientRect();
        const parent = container.getBoundingClientRect();
        return box.left - parent.left + box.width / 2;
    };

    const select = (mode: DownloadModeOption) => {
        if (mode === active) return;
        hapticSwitch();
        updateSetting({ save: { downloadMode: mode } });
    };

    /* marble travel on mode change (keyboard or click) */
    $effect(() => {
        const next = active;
        if (next === prevMode || !marble) return;

        const from = nodeCenter(prevMode);
        const to = nodeCenter(next);
        prevMode = next;

        if (!motionOK() || from === to) return;

        const dist = Math.abs(to - from);
        gsap.timeline()
            .set(marble, { x: from, opacity: 1, scaleX: 1, scaleY: 1 })
            .to(marble, {
                x: (from + to) / 2,
                scaleX: Math.min(2.4, 1 + dist / 90),
                scaleY: 0.7,
                duration: 0.16,
                ease: "power2.in",
            })
            .to(marble, {
                x: to,
                scaleX: 0.7,
                scaleY: 1.1,
                duration: 0.16,
                ease: "power2.out",
            })
            .to(marble, { opacity: 0, scale: 0.4, duration: 0.12 });

        /* target node inflates, others settle */
        const i = modes.findIndex((m) => m.id === next);
        if (nodeEls[i]) {
            gsap.fromTo(
                nodeEls[i],
                { scale: 0.85 },
                { scale: 1, duration: 0.6, ease: EASE.pop, delay: 0.22 }
            );
        }
    });

    onMount(() => {
        gsap.set(marble, { opacity: 0 });
    });
</script>

<div
    class="mode-molecule"
    bind:this={container}
    role="radiogroup"
    aria-label={$t("a11y.save.mode_switcher")}
>
    <div class="ligament" aria-hidden="true"></div>
    <div class="marble" bind:this={marble} aria-hidden="true"></div>

    {#each modes as mode, i}
        <button
            class="mode-node"
            class:active={active === mode.id}
            role="radio"
            aria-checked={active === mode.id}
            onclick={() => select(mode.id)}
            bind:this={nodeEls[i]}
        >
            <span class="droplet">
                <mode.icon />
            </span>
            <span class="node-label">
                {$t(`save.${mode.id}`)}
                <kbd class="mono">{mode.key}</kbd>
            </span>
        </button>
    {/each}
</div>

<style>
    .mode-molecule {
        position: relative;
        display: flex;
        align-items: flex-start;
        gap: 18px;
        padding: 2px 6px;
    }

    .ligament {
        position: absolute;
        top: 21px;
        left: 24px;
        right: 24px;
        height: 2.5px;
        border-radius: 2px;
        background: var(--ink);
        opacity: 0.35;
    }

    .marble {
        position: absolute;
        top: 14px;
        left: 0;
        width: 15px;
        height: 15px;
        margin-left: -7.5px;
        border-radius: 50%;
        background: var(--grape);
        opacity: 0;
        pointer-events: none;
        will-change: transform;
        z-index: 1;
    }

    .mode-node {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        padding: 0;
        background: none;
        box-shadow: none;
        border-radius: var(--border-radius);
        z-index: 2;
    }

    .mode-node:hover {
        background: none;
    }

    .mode-node:active {
        background: none;
    }

    .droplet {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: var(--blob-b);
        background: var(--milk);
        border: 2.5px solid var(--ink);
        transition:
            background 0.25s,
            border-color 0.25s,
            transform 0.35s var(--ease-liquid);
    }

    .droplet :global(svg) {
        width: 17px;
        height: 17px;
        color: var(--ink);
        transition: color 0.25s;
    }

    .mode-node.active .droplet {
        width: 42px;
        height: 42px;
        margin-top: -4px;
        background: var(--grape);
        border-color: var(--grape-deep);
        border-radius: var(--blob-a);
    }

    .mode-node.active .droplet :global(svg) {
        color: var(--white);
        width: 20px;
        height: 20px;
    }

    @media (hover: hover) {
        .mode-node:not(.active):hover .droplet {
            transform: scale(1.12);
            background: var(--grape-milk);
        }
    }

    .node-label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 700;
        color: var(--ink-soft);
        transition: color 0.25s;
    }

    .mode-node.active .node-label {
        color: var(--grape);
    }

    kbd {
        font-size: 9px;
        padding: 0 3px;
        border-radius: 4px;
        background: var(--milk-deep);
        color: var(--ink-soft);
        opacity: 0;
        transition: opacity 0.2s;
    }

    @media (hover: hover) {
        .mode-molecule:hover kbd {
            opacity: 1;
        }
    }

    @media (hover: none) {
        kbd {
            display: none;
        }
    }
</style>
