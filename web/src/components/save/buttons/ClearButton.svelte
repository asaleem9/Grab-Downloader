<script>
    import { t } from "$lib/i18n/translations";
    import IconX from "@tabler/icons-svelte/IconX.svelte";

    export let click;
</script>

<button
    id="clear-button"
    class="button"
    on:click={click}
    aria-label={$t("a11y.save.clear_input")}
>
    <IconX />
</button>

<style>
    #clear-button {
        padding: 4px;
        border-radius: var(--blob-b);
        background: var(--milk-deep);
        border: 2px solid var(--ink);
    }

    #clear-button :global(svg) {
        width: 14px;
        height: 14px;
        stroke-width: 2.5px;
        stroke: var(--ink);
        will-change: transform;
    }
</style>
