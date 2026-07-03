<script lang="ts">
    import { t } from "$lib/i18n/translations";
    import { floaty } from "$lib/motion";
</script>

<div class="queue-stub">
    <div
        class="lonely-bubble"
        use:floaty={{ x: 8, y: 10, rotation: 6, minDuration: 4, maxDuration: 7 }}
    ></div>
    <span class="subtext stub-text">
        {$t("queue.stub", {
            value: $t("queue.stub"),
        })}
    </span>
</div>

<style>
    .queue-stub {
        --base-padding: calc(var(--padding) * 1.5);
        font-size: 13px;
        font-weight: 500;
        color: var(--gray);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--base-padding);
        padding-bottom: calc(var(--base-padding) + 16px);
        text-align: center;
        gap: var(--padding);
    }

    .lonely-bubble {
        width: 16px;
        height: 16px;
        border-radius: var(--blob-a);
        background: var(--grape-milk);
        border: 2px solid var(--ink-soft);
    }

    .stub-text {
        padding: 0;
    }
</style>
