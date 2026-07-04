<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { t } from "$lib/i18n/translations";
    import { hapticSwitch } from "$lib/haptics";
    import { savingHandler } from "$lib/api/saving-handler";
    import { downloadButtonState } from "$lib/state/omnibox";

    import { gsap, EASE, magnetic, squish, motionOK } from "$lib/motion";

    import type { CobaltDownloadButtonState } from "$lib/types/omnibox";

    export let url: string;
    export let disabled = false;
    export let loading = false;

    let button: HTMLButtonElement;
    let currentState: CobaltDownloadButtonState = "idle";

    $: buttonAltText = $t("a11y.save.download");
    $: label = $t("save.grab");

    let radiusLoop: gsap.core.Tween | null = null;

    const unsubscribe = downloadButtonState.subscribe(
        (state: CobaltDownloadButtonState) => {
            currentState = state;
            disabled = state !== "idle";
            loading = state === "think" || state === "check";

            label = $t(
                {
                    idle: "save.grab",
                    think: "save.state.think",
                    check: "save.state.check",
                    done: "save.state.done",
                    error: "save.state.error",
                }[state]
            );

            buttonAltText = $t(
                {
                    idle: "a11y.save.download",
                    think: "a11y.save.download.think",
                    check: "a11y.save.download.check",
                    done: "a11y.save.download.done",
                    error: "a11y.save.download.error",
                }[state]
            );

            if (button && motionOK()) {
                switch (state) {
                    case "think":
                        gsap.to(button, {
                            scaleY: 0.92,
                            scaleX: 1.05,
                            duration: 0.5,
                            ease: EASE.jelly,
                        });
                        break;
                    case "done":
                        gsap.to(button, {
                            scale: 1.12,
                            duration: 0.4,
                            ease: EASE.pop,
                        });
                        gsap.to(button, { scale: 1, delay: 0.5, duration: 0.4 });
                        break;
                    case "error":
                        gsap.fromTo(
                            button,
                            { x: 0 },
                            { x: 7, duration: 0.6, ease: EASE.wobble }
                        );
                        break;
                    default:
                        gsap.to(button, {
                            scale: 1,
                            scaleX: 1,
                            scaleY: 1,
                            x: 0,
                            duration: 0.4,
                            ease: "power2.out",
                        });
                }
            }

            // states that don't wait for anything, and thus can
            // transition back to idle after some period of time.
            const final: CobaltDownloadButtonState[] = ["done", "error"];
            if (final.includes(state)) {
                setTimeout(() => downloadButtonState.set("idle"), 1500);
            }
        }
    );

    onMount(() => {
        /* idle breath: the blob outline slowly cycles between seeds */
        radiusLoop = gsap.to(button, {
            borderRadius: "45% 55% 48% 52% / 55% 44% 56% 45%",
            duration: 3.2,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
        });

        return () => radiusLoop?.kill();
    });

    onDestroy(() => unsubscribe());
</script>

<button
    id="grab-button"
    class="state-{currentState}"
    bind:this={button}
    {disabled}
    use:squish={{ intensity: 1.4 }}
    use:magnetic={{ strength: 0.25, radius: 70 }}
    on:click={() => {
        hapticSwitch();
        savingHandler({ url });
    }}
    aria-label={buttonAltText}
>
    <span id="grab-label">{label}</span>
</button>

<style>
    #grab-button {
        display: flex;
        align-items: center;
        justify-content: center;

        min-width: 104px;
        padding: 12px 20px;
        margin-left: -14px;

        border-radius: var(--blob-a);
        background: var(--grape);
        color: var(--white);
        box-shadow: none;

        will-change: transform, border-radius;
    }

    #grab-button:dir(rtl) {
        margin-left: 0;
        margin-right: -14px;
    }

    #grab-label {
        font-family: var(--font-liquid);
        font-size: 17px;
        font-weight: 800;
        letter-spacing: 0.3px;
        line-height: 1;
        pointer-events: none;
    }

    @media (hover: hover) {
        #grab-button:hover:not(:disabled) {
            background: var(--grape-deep);
        }
    }

    #grab-button:active:not(:disabled) {
        background: var(--grape-deep);
    }

    #grab-button.state-done {
        background: var(--lime);
        color: var(--ink);
    }

    #grab-button.state-error {
        background: var(--splat);
        color: var(--ink);
    }

    #grab-button:disabled {
        cursor: wait;
    }

    #grab-button.state-done:disabled,
    #grab-button.state-error:disabled {
        cursor: default;
    }
</style>
