<script lang="ts">
    import { onDestroy } from "svelte";
    import type { DialogButton } from "$lib/types/dialog";

    export let button: DialogButton;
    export let closeFunc: () => void;

    let disabled = false;
    let seconds = 0;

    if (button.timeout) {
        disabled = true;
        seconds = Math.round(button.timeout / 1000);

        let interval = setInterval(() => {
            seconds--;
            if (seconds <= 0) {
                clearInterval(interval);
                disabled = false;
            }
        }, 1000);

        onDestroy(() => clearInterval(interval));
    }
</script>
{#if button.link}
    <a
        class="button elevated link-button"
        class:color={button.color}
        class:active={button.main}
        href={button.link}
    >
        {button.text}
    </a>
{:else}
    <button
        class="button elevated popup-button {button.color}"
        class:color={button.color}
        class:active={button.main}
        {disabled}
        on:click={async () => {
            await button.action();
            closeFunc();
        }}
    >
        {button.text}{seconds ? ` (${seconds})` : ""}
    </button>
{/if}
<style>
    .link-button {
        text-decoration: none;
        font-weight: 500;
        width: 100%;
    }

    .popup-button {
        width: 100%;
        height: 42px;
        border-radius: var(--blob-c);
        font-weight: 700;
        transition: 0.2s opacity;
    }

    .link-button {
        border-radius: var(--blob-c);
    }

    .popup-button.red {
        background-color: var(--splat);
        color: var(--ink);
    }

    .popup-button[disabled] {
        opacity: 0.6;
    }
</style>
