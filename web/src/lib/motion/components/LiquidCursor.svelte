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

        const q = {
            dot: [gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3" }),
                  gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3" })],
            f1: [gsap.quickTo(follower1, "x", { duration: 0.18, ease: "power3" }),
                 gsap.quickTo(follower1, "y", { duration: 0.18, ease: "power3" })],
            f2: [gsap.quickTo(follower2, "x", { duration: 0.3, ease: "power3" }),
                 gsap.quickTo(follower2, "y", { duration: 0.3, ease: "power3" })],
            ring: [gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3" }),
                   gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3" })],
        };

        let px = -100;
        let py = -100;
        let seen = false;

        const move = (e: PointerEvent) => {
            px = e.clientX;
            py = e.clientY;
            if (!seen) {
                seen = true;
                gsap.set([dot, follower1, follower2, ring], { x: px, y: py });
                gsap.to(root, { opacity: 1, duration: 0.2 });
            }
            q.dot[0](px); q.dot[1](py);
            q.f1[0](px); q.f1[1](py);
            q.f2[0](px); q.f2[1](py);
            q.ring[0](px); q.ring[1](py);
        };

        /* single shared tick: magnetic pull for the 8 nearest targets */
        const tick = () => {
            if (!seen) return;
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

        /* delegated cursor-state detection */
        const over = (e: PointerEvent) => {
            if (!(e.target instanceof Element)) return;

            const tagged = e.target.closest<HTMLElement>("[data-cursor]");
            if (tagged) {
                const value = tagged.dataset.cursor;
                if (value === "native") {
                    gsap.to(root, { opacity: 0, duration: 0.15 });
                    return;
                }
                gsap.to(root, { opacity: 1, duration: 0.15 });
                cursorState.set(value as CursorState);
                return;
            }

            gsap.to(root, { opacity: 1, duration: 0.15 });
            if (e.target.closest(TEXTUAL)) cursorState.set("text");
            else if (e.target.closest(INTERACTIVE)) cursorState.set("hover");
            else cursorState.set("default");
        };

        const down = () => {
            gsap.to(dot, { scale: 0.65, duration: 0.1, overwrite: "auto" });
        };
        const up = () => {
            gsap.to(dot, {
                scale: 1,
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

        /* react to cursor state */
        const unsubscribe = cursorState.subscribe((state) => {
            if (killed) return;
            switch (state) {
                case "hover":
                    gsap.to(ring, { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(2)" });
                    gsap.to(dot, { scaleX: 0.8, scaleY: 0.8, duration: 0.25, overwrite: "auto" });
                    gsap.to([follower1, follower2], { opacity: 0, duration: 0.15 });
                    break;
                case "text":
                    gsap.to(ring, { scale: 0, opacity: 0, duration: 0.2 });
                    gsap.to(dot, { scaleX: 0.32, scaleY: 2.2, duration: 0.2, overwrite: "auto" });
                    gsap.to([follower1, follower2], { opacity: 0, duration: 0.15 });
                    break;
                case "drag":
                    gsap.to(ring, { scale: 0, opacity: 0, duration: 0.2 });
                    gsap.to(dot, { scaleX: 1.7, scaleY: 0.9, duration: 0.2, overwrite: "auto" });
                    break;
                case "hidden":
                    gsap.to(root, { opacity: 0, duration: 0.2 });
                    break;
                default:
                    gsap.to(root, { opacity: seen ? 1 : 0, duration: 0.2 });
                    gsap.to(ring, { scale: 0, opacity: 0, duration: 0.2 });
                    gsap.to(dot, { scaleX: 1, scaleY: 1, duration: 0.3, ease: "back.out(1.5)", overwrite: "auto" });
                    gsap.to([follower1, follower2], { opacity: 1, duration: 0.15 });
            }
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
        <div class="cursor-goo">
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

    .cursor-goo {
        position: absolute;
        inset: 0;
        filter: url(#goo-cursor);
    }

    .cursor-dot,
    .cursor-follower,
    .cursor-ring {
        position: absolute;
        top: 0;
        left: 0;
        border-radius: 50%;
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
        border-radius: var(--blob-a);
        transform: scale(0);
        opacity: 0;
    }

    :global([data-fx-tier="low"]) .cursor-goo {
        filter: none;
    }
</style>
