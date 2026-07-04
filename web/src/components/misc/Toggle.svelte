<script lang="ts">
    export let enabled: boolean;
</script>

<div class="toggle" class:enabled>
    <div class="toggle-switcher"></div>
</div>

<style>
    /* the goo bean: an organic track with a droplet that snaps
       across and squishes while pressed */
    .toggle {
        --base-size: 20px;
        --ratio-factor: 0.9;
        --enabled-pos: calc(100% * var(--ratio-factor));

        display: flex;
        justify-content: start;
        align-items: center;
        min-width: calc(var(--base-size) * (1 + var(--ratio-factor)));
        padding: 3px;
        aspect-ratio: 2/1;
        border-radius: 55% 45% 52% 48% / 60% 55% 45% 40%;
        border: 2px solid var(--ink);
        background: var(--toggle-bg);
        transition:
            background 0.25s,
            border-radius 0.4s var(--ease-liquid);
        box-sizing: border-box;
    }

    .toggle:dir(rtl) {
        --enabled-pos: calc(-100% * var(--ratio-factor));
    }

    .toggle-switcher {
        height: var(--base-size);
        width: var(--base-size);
        background: var(--milk);
        border: 2px solid var(--ink);
        box-sizing: border-box;
        border-radius: 58% 42% 55% 45% / 48% 55% 45% 52%;
        transform: translateX(0%);
        transition:
            transform 0.4s cubic-bezier(0.53, 0.05, 0.02, 1.35),
            border-radius 0.4s var(--ease-liquid);
        will-change: transform;
    }

    .toggle.enabled {
        background: var(--toggle-bg-enabled);
        border-radius: 45% 55% 48% 52% / 40% 45% 55% 60%;
    }

    .toggle.enabled .toggle-switcher {
        transform: translateX(var(--enabled-pos));
        border-radius: 45% 55% 48% 52% / 55% 44% 56% 45%;
    }

    /* squash while held */
    :global(button:active) .toggle .toggle-switcher {
        transform: translateX(0%) scaleX(1.25) scaleY(0.85);
    }

    :global(button:active) .toggle.enabled .toggle-switcher {
        transform: translateX(var(--enabled-pos)) scaleX(1.25) scaleY(0.85);
    }
</style>
