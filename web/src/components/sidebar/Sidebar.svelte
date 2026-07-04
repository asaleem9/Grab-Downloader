<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";

    import { t } from "$lib/i18n/translations";
    import { defaultNavPage } from "$lib/subnav";
    import { gsap, motionOK } from "$lib/motion";

    import GrabLogo from "$components/sidebar/GrabLogo.svelte";
    import SidebarTab from "$components/sidebar/SidebarTab.svelte";

    import IconDownload from "@tabler/icons-svelte/IconDownload.svelte";
    import IconSettings from "@tabler/icons-svelte/IconSettings.svelte";
    import IconInfoCircle from "@tabler/icons-svelte/IconInfoCircle.svelte";

    let screenWidth: number;
    let settingsLink = defaultNavPage("settings");
    let aboutLink = defaultNavPage("about");

    $: screenWidth,
        (settingsLink = defaultNavPage("settings")),
        (aboutLink = defaultNavPage("about"));

    /*
        the marble: a grape bead that swims between tabs when the
        section changes. it leads, the target droplet inflates after.
    */
    let nav: HTMLElement;
    let marble: HTMLDivElement;
    let mounted = false;
    let prevSection: string | null = null;

    const swim = (section: string) => {
        const tabNames: Record<string, string> = {
            "": "save",
            settings: "settings",
            about: "about",
        };
        const target = nav?.querySelector(
            `#sidebar-tab-${tabNames[section] ?? section}`
        );

        if (!target || !marble || !motionOK()) return;
        if (prevSection === null) return;

        const from = nav
            .querySelector(`#sidebar-tab-${tabNames[prevSection] ?? prevSection}`)
            ?.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        const base = nav.getBoundingClientRect();
        if (!from) return;

        const horizontal = screenWidth <= 535;
        const fx = from.left - base.left + from.width / 2;
        const fy = from.top - base.top + from.height / 2;
        const tx = to.left - base.left + to.width / 2;
        const ty = to.top - base.top + to.height / 2;

        gsap.timeline()
            .set(marble, { x: fx, y: fy, opacity: 1, scale: 1 })
            .to(marble, {
                x: (fx + tx) / 2,
                y: (fy + ty) / 2,
                scaleX: horizontal ? 2.2 : 0.7,
                scaleY: horizontal ? 0.7 : 2.2,
                duration: 0.16,
                ease: "power2.in",
            })
            .to(marble, {
                x: tx,
                y: ty,
                scaleX: 1,
                scaleY: 1,
                duration: 0.16,
                ease: "power2.out",
            })
            .to(marble, { opacity: 0, scale: 0.3, duration: 0.14 });
    };

    $: section = $page.url.pathname.split("/")[1];

    $: if (mounted && section !== prevSection) {
        swim(section);
        prevSection = section;
    }

    onMount(() => {
        prevSection = $page.url.pathname.split("/")[1];
        mounted = true;
    });
</script>

<svelte:window bind:innerWidth={screenWidth} />

<nav id="sidebar" aria-label={$t("a11y.tabs.tab_panel")} bind:this={nav}>
    <div class="shelf-wave" aria-hidden="true">
        <svg viewBox="0 0 100 12" preserveAspectRatio="none">
            <path
                d="M0,12 L0,7 C10,3 22,9 34,6 C46,3 58,9 70,5 C82,2 92,7 100,5 L100,12 Z"
                fill="var(--milk-deep)"
            />
            <path
                d="M0,7 C10,3 22,9 34,6 C46,3 58,9 70,5 C82,2 92,7 100,5"
                fill="none"
                stroke="var(--ink)"
                stroke-width="1"
            />
        </svg>
    </div>
    <div class="dock-marble" bind:this={marble} aria-hidden="true"></div>
    <GrabLogo />
    <div id="sidebar-tabs" role="tablist">
        <div id="sidebar-actions" class="sidebar-inner-container">
            <SidebarTab name="save" path="/" icon={IconDownload} />
        </div>
        <div id="sidebar-info" class="sidebar-inner-container">
            <SidebarTab name="settings" path={settingsLink} icon={IconSettings} />
            <SidebarTab name="about" path={aboutLink} icon={IconInfoCircle} />
        </div>
    </div>
</nav>

<style>
    #sidebar,
    #sidebar-tabs,
    .sidebar-inner-container {
        display: flex;
        flex-direction: column;
    }

    #sidebar {
        background: var(--sidebar-bg);
        height: 100vh;
        width: calc(var(--sidebar-width) + var(--sidebar-inner-padding) * 2);
        position: sticky;
    }

    .shelf-wave {
        display: none;
    }

    .dock-marble {
        position: absolute;
        top: 0;
        left: 0;
        width: 14px;
        height: 14px;
        margin: -7px 0 0 -7px;
        border-radius: 50%;
        background: var(--grape);
        opacity: 0;
        pointer-events: none;
        will-change: transform;
        z-index: 5;
    }

    #sidebar-tabs {
        height: 100%;
        justify-content: space-between;
        padding: var(--sidebar-inner-padding);
        padding-bottom: var(--sidebar-tab-padding);
        overflow-y: scroll;
    }

    .sidebar-inner-container {
        gap: 10px;
    }

    @media screen and (max-width: 535px) {
        #sidebar,
        #sidebar-tabs,
        .sidebar-inner-container {
            flex-direction: row;
        }

        #sidebar {
            width: 100%;
            height: var(--sidebar-height-mobile);
            position: fixed;
            bottom: 0;
            justify-content: center;
            align-items: flex-start;
            z-index: 3;
            padding: var(--sidebar-inner-padding) 0;
            padding-top: 8px;
            background: var(--milk-deep);
        }

        /* the shelf: a wavy liquid surface the tabs ride on */
        .shelf-wave {
            display: block;
            position: absolute;
            top: -9px;
            left: 0;
            width: 100%;
            height: 10px;
            pointer-events: none;
        }

        .shelf-wave svg {
            width: 100%;
            height: 100%;
            display: block;
        }

        #sidebar-tabs {
            overflow-y: visible;
            overflow-x: scroll;
            padding: 0;
            /*
                overflow-x: scroll forces overflow-y to compute to auto,
                which clips the active droplet's -10px pop-above. carve
                that zone into the scrollport instead of losing it.
            */
            padding-top: 10px;
            margin-top: -10px;
            height: fit-content;
            justify-content: center;
            gap: 12px;
        }

        .sidebar-inner-container {
            gap: 12px;
        }

        #sidebar :global(.sidebar-inner-container:first-child) {
            padding-left: calc(var(--border-radius) * 1.5);
        }

        #sidebar :global(.sidebar-inner-container:last-child) {
            padding-right: calc(var(--border-radius) * 1.5);
        }

        #sidebar :global(.sidebar-inner-container:first-child:dir(rtl)) {
            padding-left: 0;
            padding-right: calc(var(--border-radius) * 1.5);
        }

        #sidebar :global(.sidebar-inner-container:last-child:dir(rtl)) {
            padding-right: 0;
            padding-left: calc(var(--border-radius) * 1.5);
        }
    }

    /* add padding for notch / dynamic island in landscape */
    @media screen and (orientation: landscape) {
        :global([data-iphone="true"]) #sidebar {
            padding-left: env(safe-area-inset-left);
        }
    }
</style>
