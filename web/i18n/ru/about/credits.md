<script lang="ts">
    import { contacts, docs, partners } from "$lib/env";
    import { t } from "$lib/i18n/translations";

    import SectionHeading from "$components/misc/SectionHeading.svelte";
    import BetaTesters from "$components/misc/BetaTesters.svelte";
</script>

<section id="imput">
<SectionHeading
    title="imput"
    sectionId="imput"
/>

Grab сделан с любовью и заботой руками [imput](https://imput.net/) ❤️

мы маленькая команда из двух человек, но мы очень усердно работаем, чтобы делать
классный софт, который приносит пользу всем. если тебе нравится то, что мы
делаем, поддержи нас на [странице донатов](/donate)!
</section>

<section id="testers">
<SectionHeading
    title={$t("about.heading.testers")}
    sectionId="testers"
/>

огромное спасибо нашим тестерам за то, что они тестировали обновления заранее и
следили за их стабильностью. они ещё помогли нам выпустить cobalt 10!
<BetaTesters />

все ссылки внешние и ведут на их личные сайты или соцсети.
</section>

<section id="partners">
<SectionHeading
    title={$t("about.heading.partners")}
    sectionId="partners"
/>

часть инфраструктуры Grabа предоставлена нашим давним партнёром,
[royalehosting.net]({partners.royalehosting})!
</section>

<section id="licenses">
<SectionHeading
    title={$t("about.heading.licenses")}
    sectionId="licenses"
/>

код api (сервера обработки) Grabа — open source и распространяется по
лицензии [AGPL-3.0]({docs.apiLicense}).

код фронтенда Grabа — [source first](https://sourcefirst.com/) и
распространяется по лицензии [CC-BY-NC-SA 4.0]({docs.webLicense}).

нам пришлось сделать фронтенд source first, чтобы грифтеры не наживались на
нашем труде и не создавали вредоносные клоны для обмана людей и порче нашей
репутации. кроме коммерческого использования, у этого типа лицензии те же
принципы, что и у многих open source лицензий.

мы используем много опенсорсных библиотек, но также создаём и распространяем
свои собственные. полный список зависимостей можно посмотреть на
[github]({contacts.github})!
</section>
