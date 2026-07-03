<script lang="ts">
    import { t } from "$lib/i18n/translations";
    import { gsap, EASE, motionOK } from "$lib/motion";
    import IconArrowDown from "@tabler/icons-svelte/IconArrowDown.svelte";

    /*
        the flask: queue progress as liquid level. the wave surface
        drifts sideways forever (compositor-only), sloshes while
        indeterminate, and the whole flask burps when everything
        is done.
    */

    type Props = {
        indeterminate?: boolean;
        progress?: number;
        expandAction: () => void;
    }

    let {
        indeterminate = false,
        progress = $bindable(0),
        expandAction
    }: Props = $props();

    let button: HTMLButtonElement | undefined = $state();

    const completed = $derived(progress >= 100);

    /* liquid level in viewbox units: empty sits below the clip */
    const level = $derived(
        indeterminate ? 27 : 42 - (Math.min(100, progress) / 100) * 42
    );

    let ariaState = $derived(
        progress > 0 && progress < 100
        ? "ongoing"
        : progress >= 100
            ? "completed"
            : "default"
    )

    /* burp on completion */
    let wasCompleted = false;
    $effect(() => {
        if (completed && !wasCompleted && button && motionOK()) {
            gsap.fromTo(
                button,
                { scaleX: 1.15, scaleY: 0.82 },
                { scaleX: 1, scaleY: 1, duration: 0.7, ease: EASE.pop }
            );
        }
        wasCompleted = completed;
    });
</script>

<button
    id="processing-status"
    bind:this={button}
    onclick={expandAction}
    class="button"
    class:completed
    class:filling={progress > 0 || indeterminate}
    aria-label={$t(`a11y.queue.status.${ariaState}`)}
>
    <svg id="flask" viewBox="0 0 42 42" aria-hidden="true">
        <defs>
            <clipPath id="flask-clip">
                <path
                    d="M21,2.5 C30,1 38,7 39.5,16 C41,25 37,34 28,38.5 C19,43 8,39 4.5,30 C1,21 3,10 10,5.5 C14,3 17,3.2 21,2.5 Z"
                />
            </clipPath>
        </defs>
        <g clip-path="url(#flask-clip)">
            <g class="liquid" style="transform: translateY({level}px)">
                <g class="slosh" class:sloshing={indeterminate}>
                    <path
                        class="liquid-fill"
                        d="M-42,3 Q-36,0 -31,3 T-21,3 T-10,3 T0,3 T10,3 T21,3 T31,3 T42,3 T52,3 T63,3 T73,3 T84,3 L84,60 L-42,60 Z"
                    />
                </g>
            </g>
        </g>
        <path
            class="flask-outline"
            d="M21,2.5 C30,1 38,7 39.5,16 C41,25 37,34 28,38.5 C19,43 8,39 4.5,30 C1,21 3,10 10,5.5 C14,3 17,3.2 21,2.5 Z"
        />
    </svg>
    <div class="icon-holder">
        <IconArrowDown />
    </div>
</button>

<style>
    #processing-status {
        pointer-events: all;
        position: relative;
        width: 48px;
        height: 48px;
        padding: 0;
        border-radius: var(--blob-b);
        background: var(--milk);
        will-change: transform;
    }

    #processing-status:focus-visible {
        outline: var(--focus-ring);
        outline-offset: var(--focus-ring-offset);
    }

    #flask {
        position: absolute;
        inset: 3px;
        width: 42px;
        height: 42px;
        overflow: visible;
    }

    .flask-outline {
        fill: none;
        stroke: var(--ink);
        stroke-width: 2.5;
    }

    .liquid {
        transition: transform 0.4s var(--ease-liquid);
        will-change: transform;
    }

    .liquid-fill {
        fill: var(--grape);
        animation: wave-drift 2.6s linear infinite;
        will-change: transform;
    }

    .completed .liquid-fill {
        fill: var(--lime);
    }

    .slosh {
        transform-origin: 21px 21px;
    }

    .slosh.sloshing {
        animation: flask-slosh 1.7s ease-in-out infinite alternate;
    }

    @keyframes wave-drift {
        from {
            transform: translateX(0);
        }
        to {
            transform: translateX(-42px);
        }
    }

    @keyframes flask-slosh {
        from {
            transform: rotate(-7deg);
        }
        to {
            transform: rotate(7deg);
        }
    }

    .icon-holder {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1;
    }

    .icon-holder :global(svg) {
        height: 20px;
        width: 20px;
        stroke: var(--ink);
        stroke-width: 2.5px;
        transition: stroke 0.2s;
    }

    .filling:not(.completed) .icon-holder :global(svg) {
        stroke: var(--milk);
        filter: drop-shadow(0 1px 0 var(--ink));
    }

    .completed .icon-holder :global(svg) {
        stroke: var(--ink);
    }
</style>
