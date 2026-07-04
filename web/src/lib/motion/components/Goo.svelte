<script lang="ts">
    /*
        parameterized metaball filter. consumers put
        `filter: url(#some-id)` on a CONTAINER and animate only the
        transforms of its children - merging emerges from proximity.

        hard rules (perf): containers stay under ~400x400px, filter
        params are never tweened, and [data-fx-tier="low"] disables
        goo entirely via css.
    */
    type Props = {
        id: string;
        blur?: number;
        contrast?: number;
        shift?: number;
        composite?: boolean;
        /* "atop" clips the source to the goo (classic metaball);
           "over" keeps the source always visible with goo beneath -
           use it when elements must never threshold away */
        operator?: "atop" | "over";
    };

    let {
        id,
        blur = 8,
        contrast = 19,
        shift = 9,
        composite = true,
        operator = "atop",
    }: Props = $props();
</script>

<svg class="goo-defs" aria-hidden="true" focusable="false">
    <defs>
        <filter {id} x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
            <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 {contrast} -{shift}"
                result="goo"
            />
            {#if composite}
                <feComposite in="SourceGraphic" in2="goo" {operator} />
            {/if}
        </filter>
    </defs>
</svg>

<style>
    .goo-defs {
        position: absolute;
        width: 0;
        height: 0;
        overflow: hidden;
        pointer-events: none;
    }
</style>
