import { browser } from "$app/environment";

import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { Observer } from "gsap/Observer";
import { SplitText } from "gsap/SplitText";
import { Draggable } from "gsap/Draggable";
import { CustomEase } from "gsap/CustomEase";
import { CustomBounce } from "gsap/CustomBounce";
import { CustomWiggle } from "gsap/CustomWiggle";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

/*
    the single gsap import point for the whole app. nothing else
    imports "gsap" directly - primitives all come through here, so
    plugin registration is guaranteed to happen before any tween.

    module-scope registration (not onMount) because children mount
    before the root layout: by the time any component runs, this
    module has already been evaluated.
*/
if (browser) {
    gsap.registerPlugin(
        Flip,
        Observer,
        SplitText,
        Draggable,
        CustomEase,
        CustomBounce,
        CustomWiggle,
        InertiaPlugin,
        MorphSVGPlugin,
        MotionPathPlugin,
        ScrambleTextPlugin,
    );
}

export {
    gsap,
    Flip,
    Observer,
    SplitText,
    Draggable,
    CustomEase,
    MorphSVGPlugin,
    MotionPathPlugin,
};
