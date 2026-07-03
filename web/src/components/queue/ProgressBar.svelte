<script lang="ts">
    import Skeleton from "$components/misc/Skeleton.svelte";
    import type { CobaltQueueItemRunning, UUID } from "$lib/types/queue";

    type Props = {
        percentage?: number;
        workerId: UUID;
        pipelineResults: CobaltQueueItemRunning['pipelineResults'];
    }

    let { percentage = 0, workerId, pipelineResults }: Props = $props();

    const done = $derived(!percentage && !!pipelineResults[workerId]);
</script>

<div class="liquid-tube" class:done>
    {#if percentage || done}
        <div
            class="tube-fill"
            class:full={done || percentage >= 100}
            style="width: {done ? 100 : Math.min(100, percentage)}%"
        ></div>
    {:else}
        <Skeleton
            height="8px"
            width="100%"
            class="elevated indeterminate-progress"
        />
    {/if}
</div>

<style>
    .liquid-tube {
        width: 100%;
        height: 8px;
        background-color: var(--milk-deep);
        border: 2px solid var(--ink);
        border-radius: 8px;
        overflow: hidden;
        box-sizing: border-box;
    }

    .liquid-tube :global(.indeterminate-progress) {
        display: block;
        border-radius: 0;
    }

    .tube-fill {
        height: 100%;
        border-radius: 0 6px 6px 0;
        background-color: var(--grape);
        /* the meniscus: a bright leading edge on the liquid */
        box-shadow: inset -2.5px 0 0 var(--grape-milk);
        transition: width 0.15s;
    }

    .tube-fill.full {
        background-color: var(--green);
        box-shadow: inset -2.5px 0 0 var(--lime);
    }
</style>
