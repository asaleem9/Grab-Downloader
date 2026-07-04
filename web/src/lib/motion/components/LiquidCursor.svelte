<script lang="ts">
    import { onMount } from "svelte";

    import { gsap } from "../gsap";
    import { cursorState, type CursorState } from "../stores";
    import { magneticRegistry, refreshMagneticRects } from "../actions/magnetic";

    /*
        the liquid ink cursor: a dot with two staggered followers
        melted through a dedicated goo filter, so velocity literally
        stretches the tail. one pointermove listener + one ticker
        callback total (magnetics ride the same tick).

        opt-in per element via data-cursor="hover|text|native";
        interactive elements are also auto-detected so legacy
        components need zero edits.
    */

    const INTERACTIVE = 'a, button, .button, [role="button"], select, summary, label';
    const TEXTUAL = 'input, textarea, [contenteditable="true"]';

    let root: HTMLDivElement = $state()!;
    let gooBox: HTMLDivElement = $state()!;
    let dot: HTMLDivElement = $state()!;
    let follower1: HTMLDivElement = $state()!;
    let follower2: HTMLDivElement = $state()!;
    let ring: HTMLDivElement = $state()!;

    let killed = $state(false);

    onMount(() => {
        const finePointer = window.matchMedia("(pointer: fine)");
        if (!finePointer.matches) {
            killed = true;
            return;
        }

        document.documentElement.classList.add("liquid-cursor");

        /*
            perf-critical: the goo filter must never cover a large
            area (it re-rasterizes every frame). so the filtered box
            is a small square that travels with the cursor, and the
            tail dots are positioned locally inside it. everything
            moves in the one shared ticker below.
        */
        const setBox = gsap.quickSetter(gooBox, "css") as (v: object) => void;
        const setF1 = gsap.quickSetter(follower1, "css") as (v: object) => void;
        const setF2 = gsap.quickSetter(follower2, "css") as (v: object) => void;
        const qRing = [
            gsap.quickTo(ring, "x", { duration: 0.12, ease: "power2.out" }),
            gsap.quickTo(ring, "y", { duration: 0.12, ease: "power2.out" }),
        ];

        let px = -100;
        let py = -100;
        /* virtual global positions: dot leads, tail lerps behind */
        const pos = {
            dot: { x: -100, y: -100 },
            f1: { x: -100, y: -100 },
            f2: { x: -100, y: -100 },
        };
        let seen = false;

        const move = (e: PointerEvent) => {
            px = e.clientX;
            py = e.clientY;
            if (!seen) {
                seen = true;
                pos.dot.x = pos.f1.x = pos.f2.x = px;
                pos.dot.y = pos.f1.y = pos.f2.y = py;
                gsap.set(ring, { x: px, y: py });
                gsap.to(root, { opacity: 1, duration: 0.2 });
            }
            qRing[0](px);
            qRing[1](py);
        };

        /* single shared tick: cursor movement + magnetic pull */
        const tick = (_t: number, dt: number) => {
            if (!seen) return;

            /* frame-rate independent lerp factors */
            const kDot = 1 - Math.exp(-dt * 0.045);
            const kF1 = 1 - Math.exp(-dt * 0.016);
            const kF2 = 1 - Math.exp(-dt * 0.009);

            pos.dot.x += (px - pos.dot.x) * kDot;
            pos.dot.y += (py - pos.dot.y) * kDot;
            pos.f1.x += (pos.dot.x - pos.f1.x) * kF1;
            pos.f1.y += (pos.dot.y - pos.f1.y) * kF1;
            pos.f2.x += (pos.f1.x - pos.f2.x) * kF2;
            pos.f2.y += (pos.f1.y - pos.f2.y) * kF2;

            /* the goo box rides the dot; the tail renders locally */
            setBox({ x: pos.dot.x, y: pos.dot.y });
            setF1({ x: pos.f1.x - pos.dot.x, y: pos.f1.y - pos.dot.y });
            setF2({ x: pos.f2.x - pos.dot.x, y: pos.f2.y - pos.dot.y });

            let driven = 0;
            for (const entry of magneticRegistry.values()) {
                if (!entry.rect) entry.rect = entry.el.getBoundingClientRect();
                const cx = entry.rect.left + entry.rect.width / 2;
                const cy = entry.rect.top + entry.rect.height / 2;
                const dx = px - cx;
                const dy = py - cy;
                const dist = Math.hypot(dx, dy);

                if (dist < entry.radius && driven < 8) {
                    driven++;
                    entry.pulled = true;
                    entry.qx(dx * entry.strength);
                    entry.qy(dy * entry.strength);
                } else if (entry.pulled) {
                    entry.pulled = false;
                    entry.qx(0);
                    entry.qy(0);
                }
            }
        };
        gsap.ticker.add(tick);

        const rectRefresh = () => refreshMagneticRects();
        window.addEventListener("scroll", rectRefresh, { capture: true, passive: true });
        window.addEventListener("resize", rectRefresh);

        /*
            state application: every tween overwrites its own
            properties, and states are deduped - pointerover fires on
            every element boundary, so without both, fast mouse travel
            stacks dozens of fighting tweens and the cursor "sticks"
            mid-shape.
        */
        let currentState: CursorState = "default";
        let pressed = false;

        const dotShape = (state: CursorState) => {
            switch (state) {
                case "hover":
                    return { scaleX: 0.8, scaleY: 0.8 };
                case "text":
                    return { scaleX: 0.32, scaleY: 2.2 };
                case "drag":
                    return { scaleX: 1.7, scaleY: 0.9 };
                default:
                    return { scaleX: 1, scaleY: 1 };
            }
        };

        const applyState = (state: CursorState) => {
            if (state === "hidden") {
                gsap.to(root, { opacity: 0, duration: 0.2, overwrite: "auto" });
                return;
            }

            gsap.to(root, { opacity: seen ? 1 : 0, duration: 0.2, overwrite: "auto" });

            if (state === "hover") {
                gsap.to(ring, {
                    scale: 1,
                    opacity: 1,
                    duration: 0.25,
                    ease: "back.out(2)",
                    overwrite: "auto",
                });
            } else {
                gsap.to(ring, { scale: 0, opacity: 0, duration: 0.2, overwrite: "auto" });
            }

            if (!pressed) {
                gsap.to(dot, {
                    ...dotShape(state),
                    duration: 0.25,
                    ease: "back.out(1.5)",
                    overwrite: "auto",
                });
            }

            gsap.to([follower1, follower2], {
                opacity: state === "default" ? 1 : 0,
                duration: 0.15,
                overwrite: "auto",
            });
        };

        /* delegated cursor-state detection */
        const over = (e: PointerEvent) => {
            if (!(e.target instanceof Element)) return;

            const tagged = e.target.closest<HTMLElement>("[data-cursor]");
            let next: CursorState;

            if (tagged) {
                next = tagged.dataset.cursor === "native"
                    ? "hidden"
                    : (tagged.dataset.cursor as CursorState);
            } else if (e.target.closest(TEXTUAL)) {
                next = "text";
            } else if (e.target.closest(INTERACTIVE)) {
                next = "hover";
            } else {
                next = "default";
            }

            cursorState.set(next);
        };

        const down = () => {
            pressed = true;
            const shape = dotShape(currentState);
            gsap.to(dot, {
                scaleX: shape.scaleX * 0.7,
                scaleY: shape.scaleY * 0.7,
                duration: 0.1,
                overwrite: "auto",
            });
        };
        const up = () => {
            pressed = false;
            gsap.to(dot, {
                ...dotShape(currentState),
                duration: 0.5,
                ease: "elastic.out(1.2, 0.4)",
                overwrite: "auto",
            });
        };

        const leave = () => cursorState.set("hidden");
        const enter = () => cursorState.set("default");

        /* hybrid devices: first touch permanently restores the native cursor */
        const touch = () => {
            killed = true;
            document.documentElement.classList.remove("liquid-cursor");
        };

        document.addEventListener("pointermove", move, { passive: true });
        document.addEventListener("pointerover", over, { passive: true });
        document.addEventListener("pointerdown", down, { passive: true });
        document.addEventListener("pointerup", up, { passive: true });
        document.documentElement.addEventListener("pointerleave", leave);
        document.documentElement.addEventListener("pointerenter", enter);
        window.addEventListener("touchstart", touch, { passive: true, once: true });

        /* react to cursor state changes only */
        const unsubscribe = cursorState.subscribe((state) => {
            if (killed) return;
            if (state === currentState) return;
            currentState = state;
            applyState(state);
        });

        return () => {
            unsubscribe();
            gsap.ticker.remove(tick);
            document.removeEventListener("pointermove", move);
            document.removeEventListener("pointerover", over);
            document.removeEventListener("pointerdown", down);
            document.removeEventListener("pointerup", up);
            document.documentElement.removeEventListener("pointerleave", leave);
            document.documentElement.removeEventListener("pointerenter", enter);
            window.removeEventListener("touchstart", touch);
            window.removeEventListener("scroll", rectRefresh, { capture: true });
            window.removeEventListener("resize", rectRefresh);
            document.documentElement.classList.remove("liquid-cursor");
            gsap.killTweensOf([dot, follower1, follower2, ring, root]);
        };
    });
</script>

{#if !killed}
    <div class="cursor-root" bind:this={root} aria-hidden="true">
        <div class="cursor-goo" bind:this={gooBox}>
            <div class="cursor-dot" bind:this={dot}></div>
            <div class="cursor-follower f1" bind:this={follower1}></div>
            <div class="cursor-follower f2" bind:this={follower2}></div>
        </div>
        <div class="cursor-ring" bind:this={ring}></div>
    </div>
{/if}

<style>
    .cursor-root {
        position: fixed;
        inset: 0;
        z-index: 999;
        pointer-events: none;
        opacity: 0;
    }

    /* small filtered region that rides the pointer - a goo filter
       over anything bigger re-rasterizes the world every frame */
    .cursor-goo {
        position: absolute;
        top: -80px;
        left: -80px;
        width: 160px;
        height: 160px;
        filter: url(#goo-cursor);
        will-change: transform;
    }

    .cursor-dot,
    .cursor-follower {
        position: absolute;
        top: 80px;
        left: 80px;
        border-radius: 50%;
        will-change: transform;
    }

    .cursor-ring {
        position: absolute;
        top: 0;
        left: 0;
        border-radius: var(--blob-a);
        will-change: transform;
    }

    .cursor-dot {
        width: 10px;
        height: 10px;
        margin: -5px 0 0 -5px;
        background: var(--ink);
    }

    .cursor-follower {
        background: var(--ink);
    }

    .f1 {
        width: 8px;
        height: 8px;
        margin: -4px 0 0 -4px;
    }

    .f2 {
        width: 6px;
        height: 6px;
        margin: -3px 0 0 -3px;
    }

    .cursor-ring {
        width: 26px;
        height: 26px;
        margin: -13px 0 0 -13px;
        border: 2.5px solid var(--grape);
        transform: scale(0);
        opacity: 0;
    }

    :global([data-fx-tier="low"]) .cursor-goo {
        filter: none;
    }
</style>
