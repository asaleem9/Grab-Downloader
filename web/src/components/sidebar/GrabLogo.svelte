<script lang="ts">
    import { onMount } from "svelte";
    import { gsap, motionOK } from "$lib/motion";

    import IconGrab from "$components/icons/Grab.svelte";

    let blob: HTMLDivElement;

    /* the idle signature: once in a while the logo sheds a bead */
    onMount(() => {
        let timer: ReturnType<typeof setTimeout>;

        const drip = () => {
            if (!blob || !motionOK()) return schedule();

            const rect = blob.getBoundingClientRect();
            const bead = document.createElement("div");
            bead.style.cssText = `
                position: fixed;
                left: ${rect.left + rect.width / 2 - 4}px;
                top: ${rect.bottom - 6}px;
                width: 8px; height: 11px;
                border-radius: 50% 50% 60% 60% / 40% 40% 70% 70%;
                background: var(--grape);
                z-index: 20; pointer-events: none;
            `;
            document.body.appendChild(bead);

            gsap.timeline({ onComplete: () => { bead.remove(); schedule(); } })
                .from(bead, { scaleY: 0.3, transformOrigin: "50% 0%", duration: 0.4 })
                .to(bead, { y: 26, duration: 0.35, ease: "power2.in" })
                .to(bead, { scale: 0, duration: 0.12 });
        };

        const schedule = () => {
            timer = setTimeout(drip, 30000 + Math.random() * 40000);
        };
        schedule();

        return () => clearTimeout(timer);
    });
</script>

<div id="grab-logo">
    <div class="logo-blob" bind:this={blob}>
        <IconGrab />
    </div>
</div>

<style>
    #grab-logo {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: calc(var(--sidebar-tab-padding) * 1.5);
        padding-bottom: calc(var(--sidebar-tab-padding) * 1.5 - var(--sidebar-inner-padding));
    }

    .logo-blob {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 46px;
        height: 46px;
        background: var(--grape);
        border-radius: var(--blob-a);
    }

    .logo-blob :global(svg) {
        width: 26px;
        height: 26px;
    }

    #grab-logo :global(path) {
        fill: var(--milk);
    }

    @media screen and (max-width: 535px) {
        #grab-logo {
            display: none;
        }
    }
</style>
