<script lang="ts">
    import { onMount } from "svelte";

    import { gsap, EASE, floaty, motionOK } from "$lib/motion";
    import MorphBlob from "$lib/motion/components/MorphBlob.svelte";

    import { downloadButtonState } from "$lib/state/omnibox";
    import type { CobaltDownloadButtonState } from "$lib/types/omnibox";

    import GrabPixel from "$components/icons/GrabPixel.svelte";

    /*
        the app's one actor: a living blob that reacts to the
        download lifecycle. it boils while thinking, peeks while
        verifying, gulps on success (and spits a droplet at the
        queue flask), and splats flat on errors.
    */

    type Props = {
        size?: number;
    };

    let { size = 180 }: Props = $props();

    let wrap: HTMLDivElement = $state()!;
    let bubbleLayer: HTMLDivElement = $state()!;
    let ripple: HTMLDivElement = $state()!;

    let fill = $state("var(--grape)");

    let boilLoop: gsap.core.Tween | null = null;
    let bubbleTimer: ReturnType<typeof setInterval> | null = null;

    const spawnBubble = () => {
        if (!bubbleLayer) return;
        const b = document.createElement("div");
        const s = 8 + Math.random() * 10;
        b.style.cssText = `
            position: absolute;
            width: ${s}px; height: ${s}px;
            left: ${20 + Math.random() * 60}%;
            bottom: 40%;
            border-radius: 50%;
            background: var(--grape);
        `;
        bubbleLayer.appendChild(b);
        gsap.to(b, {
            y: -(size * 0.55 + Math.random() * 30),
            scale: 0,
            duration: 0.9 + Math.random() * 0.4,
            ease: "power1.out",
            onComplete: () => b.remove(),
        });
    };

    const startBoil = () => {
        boilLoop = gsap.to(wrap, {
            scale: 1.045,
            duration: 0.16,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
        });
        bubbleTimer = setInterval(spawnBubble, 220);
    };

    const stopBoil = () => {
        boilLoop?.kill();
        boilLoop = null;
        if (bubbleTimer) clearInterval(bubbleTimer);
        bubbleTimer = null;
        gsap.to(wrap, { scale: 1, duration: 0.3, ease: "power2.out" });
    };

    const rippleBurst = () => {
        gsap.fromTo(
            ripple,
            { scale: 0.4, opacity: 1 },
            { scale: 1.6, opacity: 0, duration: 0.7, ease: "power2.out" }
        );
    };

    /* on success, a droplet detaches and flies to the queue flask */
    const flyDroplet = () => {
        const rect = wrap.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const flask = document
            .querySelector("#processing-status")
            ?.getBoundingClientRect();
        const tx = flask ? flask.left + flask.width / 2 : window.innerWidth - 44;
        const ty = flask ? flask.top + flask.height / 2 : 32;

        const d = document.createElement("div");
        d.style.cssText = `
            position: fixed;
            left: ${cx}px; top: ${cy}px;
            width: 16px; height: 16px;
            margin: -8px 0 0 -8px;
            border-radius: var(--blob-b);
            background: var(--lime);
            box-shadow: 0 0 0 2px var(--ink);
            z-index: 100;
            pointer-events: none;
        `;
        document.body.appendChild(d);

        gsap.to(d, {
            motionPath: {
                path: [
                    { x: 0, y: 0 },
                    { x: (tx - cx) * 0.45, y: Math.min(ty - cy, 0) - 130 },
                    { x: tx - cx, y: ty - cy },
                ],
                curviness: 1.4,
            },
            scale: 0.55,
            duration: 0.85,
            ease: "power2.in",
            onComplete: () => d.remove(),
        });
    };

    onMount(() => {
        let prev: CobaltDownloadButtonState = "idle";

        const unsubscribe = downloadButtonState.subscribe((state) => {
            if (!wrap) return;

            fill = {
                idle: "var(--grape)",
                think: "var(--grape)",
                check: "var(--grape)",
                done: "var(--lime)",
                error: "var(--splat)",
            }[state];

            if (!motionOK()) {
                prev = state;
                return;
            }

            if (prev === "think" && state !== "think") stopBoil();

            switch (state) {
                case "think":
                    startBoil();
                    break;

                case "check": {
                    /* periscope: stretch up and peer around */
                    gsap.timeline()
                        .to(wrap, {
                            scaleY: 1.12,
                            scaleX: 0.94,
                            transformOrigin: "50% 100%",
                            duration: 0.3,
                            ease: "back.out(2)",
                        })
                        .to(wrap, { rotation: -7, duration: 0.22, ease: "power1.inOut" })
                        .to(wrap, { rotation: 7, duration: 0.32, ease: "power1.inOut" })
                        .to(wrap, { rotation: 0, duration: 0.22, ease: "power1.inOut" })
                        .to(wrap, {
                            scaleY: 1,
                            scaleX: 1,
                            duration: 0.5,
                            ease: EASE.settle,
                        }, "-=0.1");
                    break;
                }

                case "done": {
                    /* the gulp */
                    gsap.timeline()
                        .to(wrap, {
                            scaleX: 1.22,
                            scaleY: 0.72,
                            transformOrigin: "50% 80%",
                            duration: 0.16,
                            ease: "power3.in",
                        })
                        .add(() => rippleBurst())
                        .to(wrap, {
                            scaleX: 1,
                            scaleY: 1,
                            duration: 0.85,
                            ease: EASE.pop,
                        })
                        .add(() => flyDroplet(), 0.35);
                    break;
                }

                case "error": {
                    /* the splat: flatten against the glass */
                    gsap.timeline()
                        .to(wrap, {
                            scaleX: 1.4,
                            scaleY: 0.5,
                            transformOrigin: "50% 100%",
                            duration: 0.14,
                            ease: "power3.in",
                        })
                        .to(wrap, {
                            scaleX: 1,
                            scaleY: 1,
                            duration: 1,
                            ease: EASE.settle,
                        });
                    break;
                }
            }

            prev = state;
        });

        return () => {
            unsubscribe();
            stopBoil();
            gsap.killTweensOf(wrap);
        };
    });
</script>

<div id="grabber" bind:this={wrap} style="width: {size}px; height: {size}px;">
    <div class="grabber-goo goo-group">
        <div class="bubble-layer" bind:this={bubbleLayer}></div>
        <MorphBlob idle idlePeriod={5} {size} {fill} />
    </div>
    <div class="grabber-icon" use:floaty={{ x: 4, y: 6, rotation: 3, minDuration: 3, maxDuration: 5 }}>
        <GrabPixel size={Math.round(size * 0.34)} />
    </div>
    <div class="gulp-ripple" bind:this={ripple}></div>
</div>

<style>
    #grabber {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        will-change: transform;
    }

    .grabber-goo {
        position: absolute;
        inset: 0;
        filter: url(#goo-ui);
    }

    .bubble-layer {
        position: absolute;
        inset: 0;
        pointer-events: none;
    }

    .grabber-icon {
        position: relative;
        z-index: 1;
        display: flex;
        color: var(--milk);
    }

    .gulp-ripple {
        position: absolute;
        inset: 8%;
        border: 3px solid var(--lime);
        border-radius: var(--blob-a);
        opacity: 0;
        pointer-events: none;
    }
</style>
