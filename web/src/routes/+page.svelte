<script lang="ts">
    import { onMount } from "svelte";
    import { browser } from "$app/environment";

    import { t } from "$lib/i18n/translations";
    import { gsap, EASE, splitReveal, motionOK } from "$lib/motion";

    import Grabber from "$components/save/Grabber.svelte";
    import Omnibox from "$components/save/Omnibox.svelte";
    import ServiceStream from "$components/save/ServiceStream.svelte";

    /* the scene scales with the window */
    let innerWidth = $state(browser ? window.innerWidth : 1200);
    const grabberSize = $derived(
        innerWidth <= 535
            ? 130
            : Math.round(Math.min(250, Math.max(170, innerWidth * 0.13)))
    );

    onMount(() => {
        /* the entrance: once per session, skipped for reduced motion
           and share-target prefills (those go straight to work) */
        const prefilled =
            location.hash.length > 1 ||
            new URLSearchParams(location.search).has("u");

        if (!motionOK() || sessionStorage.getItem("grab-intro") || prefilled) {
            return;
        }
        sessionStorage.setItem("grab-intro", "1");

        const tl = gsap.timeline();
        const grabber = document.querySelector<HTMLElement>("#grabber");

        if (grabber) {
            /* a grape droplet falls from the top edge and splats
               into being the grabber */
            const rect = grabber.getBoundingClientRect();
            const droplet = document.createElement("div");
            droplet.style.cssText = `
                position: fixed;
                left: ${rect.left + rect.width / 2 - 10}px; top: -34px;
                width: 20px; height: 27px;
                border-radius: 50% 50% 60% 60% / 40% 40% 70% 70%;
                background: var(--grape);
                z-index: 100; pointer-events: none;
            `;
            document.body.appendChild(droplet);

            tl.set(grabber, { scale: 0, transformOrigin: "50% 60%" })
                .to(droplet, {
                    y: rect.top + rect.height / 2 + 34,
                    duration: 0.5,
                    ease: "power2.in",
                })
                .set(droplet, { opacity: 0, onComplete: () => droplet.remove() })
                .to(grabber, { scale: 1, duration: 0.85, ease: EASE.pop }, "<");
        }

        tl.from(
            "#vessel-row",
            { scaleX: 0.15, opacity: 0, duration: 0.9, ease: "elastic.out(1, 0.6)" },
            "-=0.55"
        )
            .from(
                "#action-container > *",
                { scale: 0, opacity: 0, stagger: 0.09, duration: 0.6, ease: EASE.pop },
                "-=0.7"
            )
            .from("#service-stream", { opacity: 0, y: 12, duration: 0.5 }, "-=0.4")
            .from("#terms-note", { opacity: 0, duration: 0.5 }, "<");

        return () => tl.kill();
    });
</script>

<svelte:window bind:innerWidth />

<svelte:head>
    <title>{$t("general.cobalt")}</title>
    <meta property="og:title" content={$t("general.cobalt")} />
</svelte:head>

<div id="save-container" class="center-column-container">
    <main id="save-scene" tabindex="-1" data-first-focus>
        <div id="hero">
            <Grabber size={grabberSize} />
            <h1 id="tagline">
                <span
                    use:splitReveal={{
                        key: $t("save.tagline"),
                        delay: 0.45,
                        stagger: 0.024,
                    }}>{$t("save.tagline")}</span
                ><span class="tagline-dot">.</span>
            </h1>
        </div>
        <Omnibox />
    </main>

    <div id="save-footer">
        <ServiceStream />
        <div id="terms-note" class="mono">
            {$t("save.terms.note.agreement")}
            <a href="/about/terms">{$t("save.terms.note.link")}</a>
        </div>
    </div>
</div>

<style>
    #save-container {
        padding: var(--padding);
        overflow: hidden;
        position: relative;
        justify-content: space-between;
    }

    #save-scene {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        flex: 1;
        gap: 26px;
        outline: none;
    }

    #hero {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
    }

    #tagline {
        font-size: clamp(30px, 2.6vw, 48px);
        font-weight: 800;
        letter-spacing: -0.5px;
        color: var(--ink);
        margin-top: -10px;
        /* splittext children need room to slide in from below */
        overflow: hidden;
        padding-bottom: 4px;
    }

    .tagline-dot {
        color: var(--tangerine);
    }

    #save-footer {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding-bottom: 4px;
    }

    #terms-note {
        color: var(--ink-soft);
        font-size: 12px;
        text-align: center;
        font-weight: 500;
    }

    #terms-note a {
        color: var(--grape);
    }

    @media screen and (max-width: 535px) {
        #save-container {
            padding-top: calc(var(--padding) / 2);
        }

        #tagline {
            font-size: 25px;
        }

        #terms-note {
            font-size: 11px;
        }
    }
</style>
