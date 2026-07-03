import { onNavigate } from "$app/navigation";

import { motionOK } from "./stores";

export type CurtainVariant = "full" | "pane";
export type CurtainDirection = "up" | "down" | "left" | "right";

export type CurtainOptions = {
    variant?: CurtainVariant;
    direction?: CurtainDirection;
};

export type Curtain = {
    cover: (options?: CurtainOptions) => Promise<void>;
    reveal: () => Promise<void>;
};

let curtain: Curtain | null = null;

export function registerCurtain(c: Curtain) {
    curtain = c;
    return () => {
        if (curtain === c) curtain = null;
    };
}

/* tab order drives wipe direction: save -> settings -> about */
const SECTION_ORDER = ["", "settings", "about"];

/*
    liquid page transitions. must be called during root layout
    component init (onNavigate requires component context). the
    returned promise delays the dom swap until the curtain covers;
    navigation.complete triggers the reveal over the new page.

    only client-side navigations hit this - initial load and
    hydration are untouched by construction. reduced motion returns
    undefined for stock instant navigation.
*/
export function initPageTransitions() {
    onNavigate((navigation) => {
        if (!motionOK() || !curtain) return;

        const from = navigation.from?.url.pathname;
        const to = navigation.to?.url.pathname;
        if (!from || !to || from === to) return;

        const fromSection = from.split("/")[1];
        const toSection = to.split("/")[1];

        /* subnav moves (settings/a -> settings/b) get a light
           vertical pane sweep; section changes wipe horizontally
           in tab order */
        let options: CurtainOptions;

        if (fromSection === toSection) {
            options = { variant: "pane", direction: "down" };
        } else {
            const fromIndex = SECTION_ORDER.indexOf(fromSection);
            const toIndex = SECTION_ORDER.indexOf(toSection);
            options = {
                variant: "full",
                direction: toIndex >= fromIndex ? "right" : "left",
            };
        }

        return new Promise<void>((resolve) => {
            curtain!.cover(options).then(resolve);
            navigation.complete.then(() => curtain?.reveal()).catch(() => {});
        });
    });
}
