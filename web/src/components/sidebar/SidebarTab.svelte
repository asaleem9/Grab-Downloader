<script lang="ts">
    import { page } from "$app/stores";

    import { t } from "$lib/i18n/translations";
    import { squish, magnetic } from "$lib/motion";

    export let name: string;
    export let path: string;
    export let icon: ConstructorOfATypedSvelteComponent;

    export let beta = false;

    const firstTabPage = ["save", "remux", "settings"];

    let tab: HTMLElement;

    $: currentTab = $page.url.pathname.split("/")[1];
    $: baseTabPath = path.split("/")[1];

    $: isTabActive = currentTab === baseTabPath;

    const showTab = (e: HTMLElement) => {
        if (e) {
            e.scrollIntoView({
                inline: firstTabPage.includes(name) ? "end" : "start",
                block: "nearest",
                behavior: "smooth",
            });
        }
    };

    $: if (isTabActive && tab) {
        showTab(tab);
    }
</script>

<a
    id="sidebar-tab-{name}"
    class="sidebar-tab"
    class:active={isTabActive}
    href={path}
    bind:this={tab}
    on:focus={() => showTab(tab)}
    role="tab"
    aria-selected={isTabActive}
    use:squish={{ intensity: 0.8 }}
    use:magnetic={{ strength: 0.2, radius: 60 }}
>
    {#if beta}
        <div class="beta-sign" aria-label={$t("general.beta")}>β</div>
    {/if}

    <span class="tab-droplet">
        <svelte:component this={icon} />
    </span>
    <span class="tab-title">{$t(`tabs.${name}`)}</span>
</a>

<style>
    .sidebar-tab {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 4px;
        padding: calc(var(--sidebar-tab-padding) / 2) 3px;
        color: var(--ink-soft);
        font-size: var(--sidebar-font-size);
        height: fit-content;
        border-radius: var(--border-radius);

        text-decoration: none;
        text-decoration-line: none;
        position: relative;
        scroll-behavior: smooth;
        will-change: transform;

        cursor: pointer;
    }

    .tab-droplet {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;

        background: var(--milk);
        border: 2.5px solid var(--ink);
        border-radius: var(--blob-b);

        transition:
            width 0.35s var(--ease-liquid),
            height 0.35s var(--ease-liquid),
            background 0.25s,
            border-color 0.25s,
            border-radius 0.35s var(--ease-liquid);
    }

    .sidebar-tab :global(svg) {
        stroke-width: 1.8px;
        height: 20px;
        width: 20px;
        stroke: var(--ink);
        transition: stroke 0.25s;
    }

    .sidebar-tab.active .tab-droplet {
        width: 50px;
        height: 50px;
        background: var(--grape);
        border-color: var(--grape-deep);
        border-radius: var(--blob-a);
    }

    .sidebar-tab.active :global(svg) {
        stroke: var(--white);
        height: 23px;
        width: 23px;
    }

    .tab-title {
        white-space: nowrap;
        font-weight: 700;
        transition: color 0.25s;
    }

    .sidebar-tab.active .tab-title {
        color: var(--grape);
    }

    @media (hover: hover) {
        .sidebar-tab:hover:not(.active) .tab-droplet {
            background: var(--grape-milk);
        }
    }

    .sidebar-tab:focus-visible {
        outline: var(--focus-ring);
        outline-offset: 2px;
        border-radius: var(--border-radius);
    }

    .beta-sign {
        position: absolute;
        transform: translateX(20px) translateY(-4px);
        opacity: 0.7;
        z-index: 2;
    }

    @media screen and (max-width: 535px) {
        .sidebar-tab {
            padding: 0 var(--padding);
            gap: 2px;
            min-width: calc(var(--sidebar-width) / 2);
            font-size: 10px;
        }

        .tab-droplet {
            width: 30px;
            height: 30px;
            border-width: 2px;
        }

        .sidebar-tab :global(svg) {
            height: 17px;
            width: 17px;
        }

        .sidebar-tab.active .tab-droplet {
            width: 38px;
            height: 38px;
            margin-top: -10px;
        }

        .sidebar-tab.active :global(svg) {
            height: 19px;
            width: 19px;
        }

        .sidebar-tab.active {
            z-index: 2;
        }
    }
</style>
