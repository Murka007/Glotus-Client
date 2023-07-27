import Hooker from "../utility/Hooker";
import Storage from "../utility/Storage";
import ZoomHandler from "./ZoomHandler";

const DefaultHooks = () => {

    // Makes you to have 100 of each resources on spawn
    Storage.set("moofoll", 1);

    Object.defineProperty(window, "onbeforeunload", {
        writable: false,
        value: null
    });

    type TListener = [type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions];

    // Removes default keydown and keyup handlers
    window.addEventListener = new Proxy(window.addEventListener, {
        apply(target, _this, args: TListener) {
            if (["keydown", "keyup"].includes(args[0])) {
                if (args[0] === "keyup") {
                    window.addEventListener = target;
                }
                return null;
            }

            return target.apply(_this, args);
        }
    });

    // Removes setInterval, which sends ping packet
    window.setInterval = new Proxy(setInterval, {
        apply(target, _this, args: [(args: void) => void, number | undefined]) {
            if (args[1] === 2500) {
                window.setInterval = target;
                return null;
            }
            return target.apply(_this, args);
        }
    });

    // Removes all isTrusted checks from the bundle
    Hooker.createRecursiveHook(
        Object.prototype, "checkTrusted",
        (that) => {
            that.checkTrusted = (event: Event) => event;
            return true;
        }
    );

    // Force connect. It is now possible to bypass 40 players limit
    Hooker.createRecursiveHook(
        Object.prototype, "maxPlayers",
        (that, value) => {
            that.maxPlayers = value + 10;
            return true; 
        }
    )

    // Removes default mouse handlers
    const proto = HTMLCanvasElement.prototype;
    proto.addEventListener = new Proxy(proto.addEventListener, {
        apply(target, _this, args: [string, EventListenerOrEventListenerObject, boolean | AddEventListenerOptions | undefined]) {
            if (/^mouse/.test(args[0]) && args[2] === false) {
                if (/up$/.test(args[0])) {
                    proto.addEventListener = target;
                }
                return null;
            }
            return target.apply(_this, args);
        }
    })

    // Replaces properties with linker. Allows to change zoom in the game
    Hooker.createRecursiveHook(
        Object.prototype, "maxScreenHeight",
        (that) => {
            that.maxScreenWidth = ZoomHandler.scale.smooth.w;
            that.maxScreenHeight = ZoomHandler.scale.smooth.h;
            return true;
        }
    )

    Hooker.createRecursiveHook(
        Object.prototype, "skinColors",
        (that, value) => {
            that.skinColors = [...value, "#91B2DB"];
            return true;
        }
    )

    Hooker.createRecursiveHook(
        window, "selectSkinColor",
        (that, callback) => {
            that.selectSkinColor = (skin: number) => {
                callback(skin === 10 ? "toString" : skin);

                Storage.set("skin_color", skin);
                if (skin === 10) {
                    const cyanSkin = document.querySelector<HTMLDivElement>("#skinColorHolder > *:last-child")!;
                    cyanSkin.classList.add("activeSkin");
                }
            }
            return true;
        }
    )
}

export default DefaultHooks;