import { browser } from "$app/environment";
import { CustomEase } from "./gsap";
import { CustomWiggle } from "gsap/CustomWiggle";
import { CustomBounce } from "gsap/CustomBounce";

/*
    the liquid ease family, registered once. everything consumes
    EASE.* instead of raw strings so the app's feel can be retuned
    from this one file.

    "liquid" is the app's original signature curve promoted from
    cubic-bezier(0.53, 0.05, 0.23, 1.15).
*/
if (browser) {
    CustomEase.create("liquid", "0.53, 0.05, 0.23, 1.15");
    CustomEase.create("liquid-in", "0.7, 0, 0.3, 1.4");
    CustomWiggle.create("wobble", { wiggles: 5, type: "easeOut" });
    CustomWiggle.create("jelly", { wiggles: 3, type: "anticipate" });
    CustomBounce.create("splat", { strength: 0.55, squash: 3, squashID: "splat-squash" });
}

export const EASE = {
    liquid: "liquid",
    liquidIn: "liquid-in",
    wobble: "wobble",
    jelly: "jelly",
    splat: "splat",
    splatSquash: "splat-squash",
    pop: "elastic.out(1.1, 0.4)",
    settle: "elastic.out(1, 0.3)",
} as const;
