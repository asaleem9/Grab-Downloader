<script lang="ts">
    import { onMount } from "svelte";

    import { t } from "$lib/i18n/translations";
    import cachedInfo from "$lib/state/server-info";
    import { getServerInfo } from "$lib/api/server-info";

    /*
        the supported-services popover, reimagined: service names
        drift by as a two-row lazy marquee under the omnibox. purely
        css-animated (compositor-only, and the reduce-motion
        kill-switch pauses it for free). screen readers get a plain
        list instead of the moving one.
    */

    let services: string[] = $state([]);

    onMount(async () => {
        await getServerInfo();
        if ($cachedInfo) {
            services = $cachedInfo.info.cobalt.services;
        }
    });

    const rowA = $derived(services.filter((_, i) => i % 2 === 0));
    const rowB = $derived(services.filter((_, i) => i % 2 === 1));
</script>

<div id="service-stream">
    <div class="stream-hint" title={$t("save.services.disclaimer")}>
        {$t("save.services.hint")} <span class="hint-arrow">→</span>
    </div>

    {#if services.length > 0}
        <div class="stream-rows" aria-hidden="true">
            <div class="stream-row">
                <div class="stream-track">
                    {#each [...rowA, ...rowA] as service}
                        <span class="service-chip mono">{service}</span>
                    {/each}
                </div>
            </div>
            <div class="stream-row reverse">
                <div class="stream-track">
                    {#each [...rowB, ...rowB] as service}
                        <span class="service-chip mono">{service}</span>
                    {/each}
                </div>
            </div>
        </div>

        <ul class="sr-only">
            {#each services as service}
                <li>{service}</li>
            {/each}
        </ul>
    {:else}
        <div class="stream-rows skeleton-row" aria-hidden="true">
            {#each { length: 6 } as _}
                <span class="service-chip skeleton-chip mono">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
            {/each}
        </div>
    {/if}
</div>

<style>
    #service-stream {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 7px;
        width: 100%;
        max-width: 640px;
        overflow: hidden;
    }

    .stream-hint {
        font-size: 12px;
        font-weight: 700;
        color: var(--ink-soft);
        cursor: help;
    }

    .hint-arrow {
        color: var(--tangerine);
    }

    .stream-rows {
        display: flex;
        flex-direction: column;
        gap: 5px;
        width: 100%;
        mask-image: linear-gradient(
            90deg,
            transparent 0%,
            black 12%,
            black 88%,
            transparent 100%
        );
        -webkit-mask-image: linear-gradient(
            90deg,
            transparent 0%,
            black 12%,
            black 88%,
            transparent 100%
        );
    }

    .stream-row {
        overflow: hidden;
        white-space: nowrap;
    }

    .stream-track {
        display: inline-flex;
        gap: 6px;
        padding-right: 6px;
        animation: stream-drift 46s linear infinite;
        will-change: transform;
    }

    .stream-row.reverse .stream-track {
        animation: stream-drift 58s linear infinite reverse;
    }

    @keyframes stream-drift {
        from {
            transform: translateX(0);
        }
        to {
            transform: translateX(-50%);
        }
    }

    .service-chip {
        display: inline-flex;
        padding: 3px 9px;
        font-size: 12px;
        color: var(--ink-soft);
        border: 2px solid transparent;
        border-radius: var(--blob-c);
        transition:
            transform 0.3s var(--ease-liquid),
            color 0.2s,
            background 0.2s,
            border-color 0.2s;
    }

    .service-chip:hover {
        transform: scale(1.18) rotate(-2deg);
        color: var(--ink);
        background: var(--milk-deep);
        border-color: var(--ink);
    }

    .skeleton-row {
        flex-direction: row;
        justify-content: center;
        gap: 6px;
    }

    .skeleton-chip {
        background: var(--milk-deep);
        border-color: transparent;
        animation: chip-shimmer 1.2s ease-in-out infinite alternate;
    }

    @keyframes chip-shimmer {
        from {
            opacity: 0.5;
        }
        to {
            opacity: 1;
        }
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
    }
</style>
