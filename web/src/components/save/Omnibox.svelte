<script lang="ts">
    import { tick, onMount } from "svelte";
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { browser } from "$app/environment";

    import { t } from "$lib/i18n/translations";

    import dialogs from "$lib/state/dialogs";
    import { link, downloadButtonState } from "$lib/state/omnibox";
    import { hapticSwitch } from "$lib/haptics";
    import { updateSetting } from "$lib/state/settings";
    import { savingHandler } from "$lib/api/saving-handler";
    import { pasteLinkFromClipboard } from "$lib/clipboard";
    import { turnstileEnabled, turnstileSolved } from "$lib/state/turnstile";

    import { gsap, EASE, motionLevel, motionOK } from "$lib/motion";

    import type { Optional } from "$lib/types/generic";
    import type { DownloadModeOption } from "$lib/types/settings";

    import ClearButton from "$components/save/buttons/ClearButton.svelte";
    import DownloadButton from "$components/save/buttons/DownloadButton.svelte";

    import ModeMolecule from "$components/save/ModeMolecule.svelte";
    import OmniboxIcon from "$components/save/OmniboxIcon.svelte";
    import ActionButton from "$components/buttons/ActionButton.svelte";
    import CaptchaTooltip from "$components/save/CaptchaTooltip.svelte";

    import IconClipboard from "$components/icons/Clipboard.svelte";

    let linkInput: Optional<HTMLInputElement>;
    let vessel: HTMLDivElement | undefined = $state();
    let vesselRow: HTMLDivElement | undefined = $state();

    const validLink = (url: string) => {
        try {
            return /^https?\:/i.test(new URL(url).protocol);
        } catch {}
    };

    let isFocused = $state(false);
    let isDisabled = $state(false);
    let isLoading = $state(false);

    let isHovered = $state(false);

    let isBotCheckOngoing = $derived($turnstileEnabled && !$turnstileSolved);

    let linkPrefill = $derived(
        page.url.hash.replace("#", "")
        || (browser ? page.url.searchParams.get("u") : "")
        || ""
    );

    let downloadable = $derived(validLink($link));
    let clearVisible = $derived($link && !isLoading);

    $effect (() => {
        if (linkPrefill) {
            // prefilled link may be uri encoded
            linkPrefill = decodeURIComponent(linkPrefill);

            if (validLink(linkPrefill)) {
                $link = linkPrefill;
            }

            // clear hash and query to prevent bookmarking unwanted links
            if (browser) goto("/", { replaceState: true });

            // clear link prefill to avoid extra effects
            linkPrefill = "";

            savingHandler({ url: $link });
        }
    });

    /*
        the character effects: on a successful grab the url's chars
        get sucked left into the grabber; clearing drops them out of
        the vessel. built on a throwaway overlay so the real input
        can be cleared immediately.
    */
    const flyChars = (direction: "grab" | "fall") => {
        const text = $link.slice(0, 42);
        if (!motionOK() || !linkInput || !text) return;

        const rect = linkInput.getBoundingClientRect();
        const fx = document.createElement("div");
        fx.className = "mono";
        fx.style.cssText = `
            position: fixed;
            left: ${rect.left}px; top: ${rect.top}px;
            height: ${rect.height}px;
            display: flex; align-items: center;
            font-size: 14px; font-weight: 500;
            color: var(--ink);
            z-index: 90; pointer-events: none;
        `;
        for (const ch of text) {
            const span = document.createElement("span");
            span.textContent = ch;
            span.style.whiteSpace = "pre";
            span.style.display = "inline-block";
            fx.appendChild(span);
        }
        document.body.appendChild(fx);

        const spans = Array.from(fx.children) as HTMLElement[];

        if (direction === "grab") {
            const grabber = document.querySelector("#grabber")?.getBoundingClientRect();
            const gx = grabber ? grabber.left + grabber.width / 2 : rect.left;
            const gy = grabber ? grabber.top + grabber.height / 2 : rect.top - 120;

            gsap.to(spans, {
                x: (_, el: HTMLElement) => gx - el.getBoundingClientRect().left,
                y: gy - rect.top,
                opacity: 0,
                scale: 0.3,
                stagger: { each: 0.012, from: "end" },
                duration: 0.55,
                ease: "power3.in",
                onComplete: () => fx.remove(),
            });
        } else {
            gsap.to(spans, {
                y: 90,
                opacity: 0,
                rotation: () => gsap.utils.random(-80, 80),
                stagger: { each: 0.008, from: "random" },
                duration: 0.45,
                ease: "power2.in",
                onComplete: () => fx.remove(),
            });
        }
    };

    const clearInput = () => {
        flyChars("fall");
        $link = "";
    };

    const pasteClipboard = async () => {
        if ($dialogs.length > 0 || isDisabled || isLoading) {
            return;
        }

        hapticSwitch();

        const pastedData = await pasteLinkFromClipboard();
        if (!pastedData) return;

        const linkMatch = pastedData.match(/https?\:\/\/[^\s]+/g);

        if (linkMatch) {
            $link = linkMatch[0].split('，')[0];

            /* the slurp: vessel gulps the pasted link in */
            if (vessel && motionOK()) {
                gsap.fromTo(
                    vessel,
                    { scaleX: 1.03, scaleY: 0.92 },
                    { scaleX: 1, scaleY: 1, duration: 0.6, ease: EASE.pop }
                );
            }

            await tick(); // wait for button to render
            savingHandler({ url: $link });
        }
    };

    const changeDownloadMode = (mode: DownloadModeOption) => {
        updateSetting({ save: { downloadMode: mode } });
    };

    const handleKeydown = (e: KeyboardEvent) => {
        if (!linkInput || $dialogs.length > 0 || isDisabled || isLoading) {
            return;
        }

        if (e.metaKey || e.ctrlKey || e.key === "/") {
            linkInput.focus();
        }

        if (e.key === "Enter" && validLink($link) && isFocused) {
            savingHandler({ url: $link });
        }

        if (["Escape", "Clear"].includes(e.key) && isFocused) {
            clearInput();
        }

        if (e.target === linkInput) {
            return;
        }

        switch (e.key) {
            case "D":
                pasteClipboard();
                break;
            case "J":
                changeDownloadMode("auto");
                break;
            case "K":
                changeDownloadMode("audio");
                break;
            case "L":
                changeDownloadMode("mute");
                break;
            default:
                break;
        }
    };

    onMount(() => {
        let breath: gsap.core.Tween | null = null;

        /* the vessel idly breathes between blob seeds */
        const unsubMotion = motionLevel.subscribe((level) => {
            breath?.kill();
            breath = null;
            if (level === "full" && vessel) {
                breath = gsap.to(vessel, {
                    borderRadius: "36px 44px 40px 46px / 42px 38px 46px 40px",
                    duration: 4.5,
                    yoyo: true,
                    repeat: -1,
                    ease: "sine.inOut",
                });
            } else if (vessel) {
                gsap.set(vessel, { clearProps: "borderRadius" });
            }
        });

        /* act out download states on the vessel itself. the input
           clear is functional and always happens - only the
           theatrics are gated on motion */
        const unsubState = downloadButtonState.subscribe((state) => {
            if (state === "error" && vesselRow && motionOK()) {
                gsap.fromTo(
                    vesselRow,
                    { x: 0 },
                    { x: 8, duration: 0.55, ease: EASE.wobble }
                );
            }

            if (state === "done") {
                if (vesselRow && motionOK()) flyChars("grab");
                $link = "";
            }
        });

        return () => {
            breath?.kill();
            unsubMotion();
            unsubState();
        };
    });
</script>

<svelte:window onkeydown={handleKeydown} />

<div id="omnibox">
    {#if $turnstileEnabled}
        <CaptchaTooltip
            visible={isBotCheckOngoing && (isHovered || isFocused)}
        />
    {/if}

    <div
        id="vessel-row"
        class="goo-group"
        bind:this={vesselRow}
        class:downloadable
    >
        <div
            id="input-container"
            bind:this={vessel}
            class:focused={isFocused}
            class:clear-visible={clearVisible}
        >
            <OmniboxIcon loading={isLoading || isBotCheckOngoing} />

            <input
                id="link-area"
                bind:value={$link}
                bind:this={linkInput}
                oninput={() => (isFocused = true)}
                onfocus={() => (isFocused = true)}
                onblur={() => (isFocused = false)}
                onmouseover={() => (isHovered = true)}
                onmouseleave={() => (isHovered = false)}
                spellcheck="false"
                autocomplete="off"
                autocapitalize="off"
                maxlength="512"
                placeholder={$t("save.input.placeholder")}
                aria-label={isBotCheckOngoing
                    ? $t("a11y.save.link_area.turnstile")
                    : $t("a11y.save.link_area")}
                data-form-type="other"
                data-cursor="native"
                disabled={isDisabled}
            />

            <ClearButton click={clearInput} />
        </div>

        <DownloadButton
            url={$link}
            bind:disabled={isDisabled}
            bind:loading={isLoading}
        />
    </div>

    <div id="action-container">
        <ModeMolecule />

        <ActionButton id="paste" click={pasteClipboard}>
            <IconClipboard />
            <span id="paste-desktop-text">{$t("save.paste")}</span>
            <span id="paste-mobile-text">{$t("save.paste.long")}</span>
        </ActionButton>
    </div>
</div>

<style>
    #omnibox {
        display: flex;
        flex-direction: column;
        max-width: 640px;
        width: 100%;
        gap: 14px;
        position: relative;
    }

    #vessel-row {
        display: flex;
        align-items: stretch;
        width: 100%;
        filter: url(#goo-ui);
    }

    :global([data-fx-tier="low"]) #vessel-row {
        filter: none;
    }

    #vessel-row:not(.downloadable) :global(#grab-button) {
        display: none;
    }

    #input-container {
        --input-padding: 12px;
        display: flex;
        position: relative;
        align-items: center;
        gap: var(--input-padding);
        flex: 1;

        background: var(--milk);
        border: 2.5px solid var(--ink);
        border-radius: 40px 38px 44px 36px / 38px 46px 38px 44px;

        font-size: 14px;
        transition: border-color 0.25s;
        will-change: border-radius;
    }

    #input-container.focused {
        border-color: var(--grape);
    }

    #input-container:not(.clear-visible) :global(#clear-button) {
        display: none;
    }

    #input-container.clear-visible {
        padding-right: var(--input-padding);
    }

    :global([dir="rtl"]) #input-container.clear-visible {
        padding-right: unset;
        padding-left: var(--input-padding);
    }

    #input-container.focused :global(#input-icons svg),
    #vessel-row.downloadable :global(#input-icons svg) {
        stroke: var(--grape);
    }

    #link-area {
        display: flex;
        width: 100%;
        margin: 0;
        padding: 13px 0;
        padding-left: calc(var(--input-padding) + 28px);
        height: 18px;

        align-items: center;

        border: none;
        outline: none;
        background-color: transparent;
        color: var(--ink);

        -webkit-tap-highlight-color: transparent;
        flex: 1;

        font-weight: 500;

        /* workaround for safari */
        font-size: inherit;

        /* prevents input from poking outside of rounded corners */
        border-radius: var(--border-radius);
    }

    :global([dir="rtl"]) #link-area {
        padding-left: unset;
        padding-right: calc(var(--input-padding) + 28px);
    }

    #link-area::placeholder {
        color: var(--ink-soft);
        /* fix for firefox */
        opacity: 1;
    }

    /* fix for safari */
    input:disabled {
        opacity: 1;
    }

    #action-container {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-between;
    }

    #action-container :global(#button-paste) {
        border: 2.5px solid var(--ink);
        border-radius: var(--blob-c);
        background: var(--tangerine);
        color: var(--ink);
        font-weight: 700;
        padding: 8px 16px;
    }

    @media (hover: hover) {
        #action-container :global(#button-paste:hover) {
            background: var(--tangerine-milk);
        }
    }

    #paste-mobile-text {
        display: none;
    }

    @media screen and (max-width: 440px) {
        #action-container {
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }

        #action-container :global(#paste) {
            width: 100%;
        }

        #paste-mobile-text {
            display: block;
        }

        #paste-desktop-text {
            display: none;
        }
    }
</style>
