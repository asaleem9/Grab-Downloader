<script lang="ts">
    import settings from "$lib/state/settings";

    import { t, locales } from "$lib/i18n/translations";

    import SettingsToggle from "$components/buttons/SettingsToggle.svelte";
    import SettingsCategory from "$components/settings/SettingsCategory.svelte";
    import SettingsDropdown from "$components/settings/SettingsDropdown.svelte";

    const dropdownItems = () => {
        return $locales.reduce((obj, lang) => {
            return {
                ...obj,
                [lang]: $t(`languages.${lang}`),
            };
        }, {});
    };
</script>

<SettingsCategory sectionId="language" title={$t("settings.language")}>
    <SettingsToggle
        settingContext="appearance"
        settingId="autoLanguage"
        title={$t("settings.language.auto.title")}
        description={$t("settings.language.auto.description")}
    />

    <SettingsDropdown
        title={$t("settings.language.preferred.title")}
        description={$t("settings.language.preferred.description")}
        items={dropdownItems()}
        settingContext="appearance"
        settingId="language"
        selectedOption={$settings.appearance.language}
        selectedTitle={$t(`languages.${$settings.appearance.language}`)}
        disabled={$settings.appearance.autoLanguage}
    />
</SettingsCategory>
