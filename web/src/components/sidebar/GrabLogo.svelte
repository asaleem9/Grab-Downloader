<script>
    import IconGrab from "$components/icons/Grab.svelte";
</script>

<div id="grab-logo">
    <IconGrab />
</div>

<style>
    #grab-logo {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: calc(var(--sidebar-tab-padding) * 2);

        /* accommodate space for scaling animation */
        padding-bottom: calc(var(--sidebar-tab-padding) * 2 - var(--sidebar-inner-padding));
    }

    #grab-logo :global(path) {
        fill: var(--sidebar-highlight);
    }

    @media screen and (max-width: 535px) {
        #grab-logo {
            display: none;
        }
    }
</style>
