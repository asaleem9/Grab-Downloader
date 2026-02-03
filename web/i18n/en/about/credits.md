<script lang="ts">
    import { t } from "$lib/i18n/translations";

    import SectionHeading from "$components/misc/SectionHeading.svelte";
</script>

<section id="licenses">
<SectionHeading
    title={$t("about.heading.licenses")}
    sectionId="licenses"
/>

Grab is based on [cobalt](https://github.com/imputnet/cobalt), an open source media downloader. huge thanks to the cobalt team for their amazing work!

cobalt's api code is licensed under [AGPL-3.0](https://github.com/imputnet/cobalt/blob/main/LICENSE) and the frontend is licensed under [CC-BY-NC-SA 4.0](https://github.com/imputnet/cobalt/blob/main/web/LICENSE).
</section>
