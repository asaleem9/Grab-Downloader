<script lang="ts">
    import dialogs from "$lib/state/dialogs";

    import SmallDialog from "$components/dialog/SmallDialog.svelte";
    import PickerDialog from "$components/dialog/PickerDialog.svelte";
    import SavingDialog from "$components/dialog/SavingDialog.svelte";
    import NoScriptDialog from "$components/dialog/NoScriptDialog.svelte";

    $: backdropVisible = $dialogs.length > 0;
</script>

<!--
    this is the cleanest way of passing props without typescript throwing a fit.
    more info here: https://github.com/microsoft/TypeScript/issues/46680
-->
<div id="dialog-holder">
    <NoScriptDialog />
    {#each $dialogs as dialog}
        {#if dialog.type === "small"}
            <SmallDialog {...dialog} />
        {:else if dialog.type === "picker"}
            <PickerDialog {...dialog} />
        {:else if dialog.type === "saving"}
            <SavingDialog {...dialog} />
        {/if}
    {/each}
    <div id="dialog-backdrop" class:visible={backdropVisible}></div>
</div>

<style>
    :global(dialog) {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: none;

        max-height: 100%;
        max-width: 100%;
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        border: none;
        pointer-events: all;

        inset-inline-start: unset;
        inset-inline-end: unset;

        overflow: hidden;
    }

    :global(dialog:modal) {
        inset-block-start: 0;
        inset-block-end: 0;
    }

    :global(dialog:modal::backdrop) {
        display: none;
    }

    #dialog-holder {
        position: fixed;
        padding-top: env(safe-area-inset-top);
        height: 100%;
        width: 100%;
        z-index: 99;

        display: flex;
        justify-content: center;
        align-items: center;

        pointer-events: none;
    }

    #dialog-backdrop, :global(#nojs-dialog-backdrop) {
        position: absolute;
        height: 100%;
        width: 100%;
        z-index: -1;

        background-color: var(--dialog-backdrop);
        overflow: hidden;

        opacity: 0;

        will-change: opacity;
        transition: opacity 0.25s;
    }

    /* giant still blob silhouettes floating in the plum wash */
    #dialog-backdrop::before,
    #dialog-backdrop::after {
        content: "";
        position: absolute;
        border-radius: var(--blob-a);
        background: var(--grape-milk);
        opacity: 0.12;
    }

    #dialog-backdrop::before {
        width: 44vmax;
        height: 44vmax;
        top: -18vmax;
        left: -14vmax;
    }

    #dialog-backdrop::after {
        width: 36vmax;
        height: 36vmax;
        border-radius: var(--blob-c);
        bottom: -16vmax;
        right: -10vmax;
    }

    #dialog-backdrop.visible {
        opacity: 1;
    }

    :global(.dialog-body) {
        --dialog-padding: 18px;

        display: flex;
        flex-direction: column;
        align-items: center;

        background: var(--popup-bg);
        border: 2.5px solid var(--ink);
        border-radius: var(--radius-card);
        box-shadow: var(--shadow-pop);

        padding: var(--dialog-padding);

        position: relative;
        will-change: transform, opacity;
    }

    :global(dialog.open .dialog-body) {
        animation: modal-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        animation-delay: 0.06s;
        animation-fill-mode: backwards;
    }

    :global(dialog.closing .dialog-body) {
        animation: modal-out 0.2s ease-in;
        opacity: 0;
    }

    @media screen and (max-width: 535px) {
        :global(dialog) {
            justify-content: flex-end;
        }

        :global(dialog.open .dialog-body) {
            animation: modal-in-mobile 0.4s;
        }

        :global(dialog .dialog-body) {
            margin-bottom: calc(
                var(--padding) + calc(
                    env(safe-area-inset-bottom) - 15px * sign(
                        env(safe-area-inset-bottom)
                    )
                )
            ) !important;
            box-shadow: 0 0 0 2px var(--popup-stroke) inset;
        }
    }

    /* blobIn: the dialog arrives as a droplet and settles into a card */
    @keyframes modal-in {
        from {
            transform: scale(0.55);
            border-radius: 46% 54% 50% 50% / 52% 48% 52% 48%;
            opacity: 0;
        }
        35% {
            opacity: 1;
        }
        70% {
            border-radius: var(--radius-card);
        }
        100% {
            transform: scale(1);
            border-radius: var(--radius-card);
        }
    }

    @keyframes modal-out {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
            transform: scale(0.85) translateY(10px);
            visibility: hidden;
        }
    }

    @keyframes modal-in-mobile {
        0% {
            transform: translateY(0);
            opacity: 0;
        }
        1% {
            transform: translateY(240px);
        }
        35% {
            opacity: 1;
        }
        55% {
            transform: translateY(-9px) scaleY(0.96);
        }
        75% {
            transform: translateY(3px) scaleY(1.01);
        }
        100% {
            transform: translateY(0px);
        }
    }
</style>
