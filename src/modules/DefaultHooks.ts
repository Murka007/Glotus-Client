import Hooker from "../utility/Hooker";
import Storage from "../utility/Storage";
import ZoomHandler from "./ZoomHandler";

const DefaultHooks = () => {

    Storage.set("moofoll", 1);

    Object.defineProperty(window, "onbeforeunload", {
        writable: false,
        value: null
    });

    type TListener = [type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions];
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

    window.setInterval = new Proxy(setInterval, {
        apply(target, _this, args: [(args: void) => void, number | undefined]) {
            if (args[1] === 2500) {
                window.setInterval = target;
                return null;
            }
            return target.apply(_this, args);
        }
    });

    Hooker.createRecursiveHook(
        Object.prototype, "checkTrusted",
        () => true,
        (that) => {
            that.checkTrusted = (event: Event) => event;
            return true;
        }
    );

    Hooker.createRecursiveHook(
        Object.prototype, "maxPlayers",
        () => true,
        (that, value) => {
            that.maxPlayers = value + 10;
            return true; 
        }
    )

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

    Hooker.createRecursiveHook(
        Object.prototype, "maxScreenHeight",
        () => true,
        (that) => {
            that.maxScreenWidth = ZoomHandler.scale.current.w;
            that.maxScreenHeight = ZoomHandler.scale.current.h;
            return true;
        }
    )
}

export default DefaultHooks;