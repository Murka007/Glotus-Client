import { ISocket } from "../types/Socket";
import Hooker from "../utility/Hooker";
import Storage from "../utility/Storage";
import ZoomHandler from "./ZoomHandler";

const DefaultHooks = () => {

    // Makes you to have 100 of each resources on spawn
    Storage.set("moofoll", 1);

    // Removes default keydown and keyup handlers
    window.addEventListener = new Proxy(window.addEventListener, {
        apply(target, _this, args: Parameters<typeof addEventListener>) {
            if (["keydown", "keyup"].includes(args[0]) && args[2] === undefined) {
                if (args[0] === "keyup") {
                    window.addEventListener = target;
                }
                return null;
            }

            return target.apply(_this, args);
        }
    });

    // Removes default mouse handlers
    const proto = HTMLCanvasElement.prototype;
    proto.addEventListener = new Proxy(proto.addEventListener, {
        apply(target, _this, args: Parameters<typeof addEventListener>) {
            if (/^mouse/.test(args[0]) && args[2] === false) {
                if (/up$/.test(args[0])) {
                    proto.addEventListener = target;
                }
                return null;
            }
            return target.apply(_this, args);
        }
    });

    window.setInterval = new Proxy(setInterval, {
        apply(target, _this, args: Parameters<typeof setInterval>) {
            if (/cordova/.test(args[0].toString()) && args[1] === 1000) {
                window.setInterval = target;
                return null;
            }
            return target.apply(_this, args);
        }
    });

    // Hooker.createRecursiveHook(
    //     Object.prototype, "list",
    //     (that) => {
    //         that.list.forEach((item: any) => (item.pre = null))
    //         return true; 
    //     }
    // )

    Hooker.createRecursiveHook(
        window, "config",
        (that, config) => {
            // config.skinColors.push("#91B2DB");
            config.maxScreenWidth = ZoomHandler.scale.smooth.w;
            config.maxScreenHeight = ZoomHandler.scale.smooth.h;
            return true;
        }
    );

    Hooker.createRecursiveHook(
        window, "bundleUtility",
        (that, utility) => {
            utility.checkTrusted = (event: Event) => event;
            return true;
        }
    );

    Hooker.createRecursiveHook(
        window, "selectSkinColor",
        (that, callback) => {
            that.selectSkinColor = (skin: number) => {
                callback(skin === 10 ? "toString" : skin);
                Storage.set("skin_color", skin);
            }
            return true;
        }
    );

    const blockProperty = (target: any, key: string) => {
        Object.defineProperty(target, key, {
            value: undefined,
            configurable: false,
            writable: false,
        })
    }

    blockProperty(window, "onbeforeunload");
    // blockProperty(window, "__FRVR");
    // blockProperty(window, "FRVR");
    // blockProperty(window, "FRVRSDK");
    // blockProperty(window, "adsbygoogle");
    // blockProperty(window, "google_reactive_ads_global_state");
    // blockProperty(window, "GoogleAnalyticsObject");

    const connection: ISocket = {
        socket: undefined,
        Encoder: null,
        Decoder: null,
    };

    window.WebSocket = new Proxy(WebSocket, {
        construct(target, args: ConstructorParameters<typeof WebSocket>) {
            const ws = new target(...args);
            connection.socket = ws;
            window.WebSocket = target;
            return ws;
        }
    });

    Hooker.createRecursiveHook(
        Object.prototype, "initialBufferSize",
        (_this) => {
            connection.Encoder = _this;
            return true;
        }
    );

    Hooker.createRecursiveHook(
        Object.prototype, "maxExtLength",
        (_this) => {
            connection.Decoder = _this;
            return true;
        }
    );

    // Hooker.createRecursiveHook(
    //     Object.prototype, "server",
    //     (_this, value) => {
    //         if (typeof value === "object") {
    //             console.log(value);
    //             return true;
    //         }
    //         return false;
    //     }
    // );

    return connection;
}

export default DefaultHooks;