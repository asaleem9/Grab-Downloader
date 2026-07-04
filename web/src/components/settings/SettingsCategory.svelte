<script lang="ts">
    import { page } from "$app/stores";
    import SectionHeading from "$components/misc/SectionHeading.svelte";

    export let title: string;
    export let sectionId: string;

    export let disabled = false;
    export let beta = false;

    let focus = false;
    let copied = false;

    $: hash = $page.url.hash.replace("#", "");

    $: if (hash === sectionId) {
        focus = true;
    }

    $: if (copied) {
        setTimeout(() => {
            copied = false;
        }, 1500);
    }
</script>

<section
    id={sectionId}
    class="settings-content"
    class:focus
    class:disabled
    aria-hidden={disabled}
>
    <SectionHeading {title} {sectionId} {beta} />
    <slot></slot>
</section>

<style>
    /* every category is a puddle: a sticker card that pops in */
    .settings-content {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: var(--padding);
        border-radius: var(--radius-card);
        background: var(--milk-deep);
        border: 2.5px solid var(--ink);
        box-shadow: var(--shadow-pop);
        transition: opacity 0.2s;
        animation: puddle-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
    }

    section:nth-child(2) {
        animation-delay: 60ms;
    }

    section:nth-child(3) {
        animation-delay: 120ms;
    }

    section:nth-child(4) {
        animation-delay: 180ms;
    }

    @keyframes puddle-in {
        from {
            transform: translateY(14px) scale(0.97);
            opacity: 0;
        }
        to {
            transform: translateY(0) scale(1);
            opacity: 1;
        }
    }

    .settings-content.disabled {
        opacity: 0.5;
        pointer-events: none;
    }

    /*
        for some weird reason parent's transition
        breaks final opacity of children on ios
    */
    :global([data-iphone="true"]) .settings-content {
        transition: none;
    }

    .settings-content.focus {
        animation: highlight 2s;
    }

    :global([data-reduce-motion="true"]) .settings-content.focus {
        animation: highlight-lite 2s !important;
    }

    @keyframes highlight {
        0% {
            box-shadow: none;
        }
        10% {
            box-shadow: 0 0 0 3.5px var(--blue) inset;
        }
        20%, 50% {
            box-shadow: 0 0 0 3px var(--blue) inset;
        }
        100% {
            box-shadow: none;
        }
    }

    @keyframes highlight-lite {
        0% {
            box-shadow: none;
        }
        10%, 50% {
            box-shadow: 0 0 0 3px var(--blue) inset;
        }
        100% {
            box-shadow: none;
        }
    }

    @media screen and (max-width: 750px) {
        .settings-content {
            padding: var(--padding);
        }
    }
</style>
