<script lang="ts">
    export let id: string;
    export let click: () => void;
    export let danger = false;
</script>

<button {id} class="button data-button" class:danger on:click={click}>
    <slot></slot>
</button>

<style>
    .data-button {
        padding: 8px 14px;
        width: max-content;
        text-align: start;
    }

    .data-button :global(svg) {
        stroke-width: 1.8px;
        height: 21px;
        width: 21px;
    }

    .data-button.danger {
        background-color: var(--splat-milk);
        color: var(--ink);
        border: 2px solid var(--splat);
        border-radius: var(--blob-c);
    }

    .data-button.danger :global(svg) {
        stroke: var(--splat);
    }

    /* a warning wobble before you commit to destruction */
    @media (hover: hover) {
        .data-button.danger:hover {
            background-color: var(--splat);
            color: var(--white);
            animation: danger-wobble 0.45s;
        }

        .data-button.danger:hover :global(svg) {
            stroke: var(--white);
        }
    }

    @keyframes danger-wobble {
        0%, 100% {
            transform: rotate(0);
        }
        25% {
            transform: rotate(-2.5deg);
        }
        60% {
            transform: rotate(2deg);
        }
    }
</style>
