<script lang="ts">
    type Props = {
        size?: number;
    };

    const { size = 48 }: Props = $props();
</script>

<svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    class="pixel-logo"
>
    <!-- Pixelated download arrow -->
    <!-- Top of arrow (single pixel) -->
    <rect x="7" y="1" width="2" height="2" />

    <!-- Arrow shaft -->
    <rect x="7" y="3" width="2" height="2" />
    <rect x="7" y="5" width="2" height="2" />
    <rect x="7" y="7" width="2" height="2" />

    <!-- Arrow wings -->
    <rect x="5" y="7" width="2" height="2" />
    <rect x="9" y="7" width="2" height="2" />
    <rect x="3" y="9" width="2" height="2" />
    <rect x="11" y="9" width="2" height="2" />

    <!-- Arrow point -->
    <rect x="5" y="9" width="2" height="2" />
    <rect x="9" y="9" width="2" height="2" />
    <rect x="7" y="9" width="2" height="2" />
    <rect x="7" y="11" width="2" height="2" />

    <!-- Base line -->
    <rect x="2" y="13" width="12" height="2" />
</svg>

<style>
    .pixel-logo {
        image-rendering: pixelated;
        image-rendering: crisp-edges;
    }
</style>
