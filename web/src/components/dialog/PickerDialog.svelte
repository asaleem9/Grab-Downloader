<script lang="ts">
    import { device } from "$lib/device";
    import { t } from "$lib/i18n/translations";

    import type { Optional } from "$lib/types/generic";
    import type { DialogButton } from "$lib/types/dialog";
    import type { DialogPickerItem } from "$lib/types/dialog";

    import DialogContainer from "$components/dialog/DialogContainer.svelte";

    import PickerItem from "$components/dialog/PickerItem.svelte";
    import DialogButtons from "$components/dialog/DialogButtons.svelte";

    import IconBoxMultiple from "@tabler/icons-svelte/IconBoxMultiple.svelte";

    export let id: string;
    export let items: Optional<DialogPickerItem[]> = undefined;
    export let buttons: Optional<DialogButton[]> = undefined;
    export let dismissable = true;

    let dialogDescription = "dialog.picker.description.";

    if (device.is.iOS) {
        dialogDescription += "ios";
    } else if (device.is.mobile) {
        dialogDescription += "phone";
    } else {
        dialogDescription += "desktop";
    }

    let close: () => void;
</script>

<DialogContainer {id} {dismissable} bind:close>
    <div
        class="dialog-body picker-dialog"
        class:three-columns={items && items.length <= 3}
    >
        <div class="popup-header">
            <div class="popup-title-container">
                <IconBoxMultiple />
                <h2 class="popup-title" tabindex="-1">
                    {$t("dialog.picker.title")}
                </h2>
            </div>
            <div class="subtext popup-description">
                {$t(dialogDescription)}
            </div>
        </div>
        <div class="picker-body">
            {#if items}
                {#each items as item, i}
                    {#if item?.url}
                        <div class="picker-blob blob-{i % 3}" style="animation-delay: {Math.min(i * 40, 400)}ms">
                            <PickerItem {item} number={i + 1} />
                        </div>
                    {/if}
                {/each}
            {/if}
        </div>
        {#if buttons}
            <DialogButtons {buttons} closeFunc={close} />
        {/if}
    </div>
</DialogContainer>

<style>
    .picker-dialog {
        --picker-item-size: 120px;
        --picker-item-gap: 4px;
        --picker-item-area: calc(var(--picker-item-size) + var(--picker-item-gap));

        gap: var(--padding);
        max-height: calc(
            90% - env(safe-area-inset-bottom) - env(safe-area-inset-top)
        );
        width: auto;
    }

    .popup-header {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 3px;
        max-width: calc(var(--picker-item-area) * 4);
    }

    .popup-title-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: calc(var(--padding) / 2);
        color: var(--secondary);
    }

    .popup-title-container :global(svg) {
        height: 21px;
        width: 21px;
    }

    .popup-title {
        font-size: 18px;
        line-height: 1.1;
    }

    .popup-description {
        font-size: 13px;
        padding: 0;
    }

    .picker-body {
        overflow-y: scroll;
        display: grid;
        justify-items: center;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        gap: var(--picker-item-gap);
    }

    .three-columns .picker-body {
        grid-template-columns: 1fr 1fr 1fr;
    }

    .three-columns .popup-header {
        max-width: calc(var(--picker-item-area) * 3);
    }

    :global(.picker-item) {
        width: var(--picker-item-size);
        height: var(--picker-item-size);
    }

    /* every item is an organic sticker with a rotating shape seed */
    .picker-blob {
        overflow: hidden;
        border: 2.5px solid var(--ink);
        animation: picker-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
        transition: transform 0.3s var(--ease-liquid);
    }

    .picker-blob.blob-0 {
        border-radius: var(--blob-a);
    }

    .picker-blob.blob-1 {
        border-radius: var(--blob-b);
    }

    .picker-blob.blob-2 {
        border-radius: var(--blob-c);
    }

    @media (hover: hover) {
        .picker-blob:hover {
            transform: scale(1.05) rotate(-1.5deg);
        }
    }

    @keyframes picker-pop {
        from {
            transform: scale(0.4);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }

    @media screen and (max-width: 535px) {
        .picker-body {
            grid-template-columns: 1fr 1fr 1fr;
        }

        .popup-header {
            max-width: calc(var(--picker-item-area) * 3);
        }
    }

    @media screen and (max-width: 410px) {
        .picker-dialog {
            --picker-item-size: 118px;
        }
    }

    @media screen and (max-width: 405px) {
        .picker-dialog {
            --picker-item-size: 116px;
        }
    }

    @media screen and (max-width: 398px) {
        .picker-dialog {
            --picker-item-size: 115px;
        }
    }

    @media screen and (max-width: 388px) {
        .picker-dialog {
            --picker-item-size: 110px;
        }
    }

    @media screen and (max-width: 378px) {
        .picker-dialog {
            --picker-item-size: 105px;
        }
    }

    @media screen and (max-width: 365px) {
        .picker-dialog {
            --picker-item-size: 100px;
        }
    }

    @media screen and (max-width: 352px) {
        .picker-dialog {
            --picker-item-size: 95px;
        }
    }

    @media screen and (max-width: 334px) {
        .picker-dialog {
            --picker-item-size: 130px;
        }

        .picker-body,
        .three-columns .picker-body {
            grid-template-columns: 1fr 1fr;
        }
    }

    @media screen and (max-width: 300px) {
        .picker-dialog {
            --picker-item-size: 120px;
        }
    }

    @media screen and (max-width: 280px) {
        .picker-dialog {
            --picker-item-size: 110px;
        }
    }

    @media screen and (max-width: 255px) {
        .picker-dialog {
            --picker-item-size: 140px;
        }

        .picker-body,
        .three-columns .picker-body {
            grid-template-columns: 1fr;
        }
    }
</style>
