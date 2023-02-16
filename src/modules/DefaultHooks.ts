import myPlayer from "../data/ClientPlayer";
import Hooker from "./Hooker";
import Storage from "./Storage";

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
    )
}

export default DefaultHooks;