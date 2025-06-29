import { ISocket } from "../types/Socket";
import Hooker from "../utility/Hooker";
import Logger from "../utility/Logger";
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

    // EventTarget.prototype.addEventListener = new Proxy(EventTarget.prototype.addEventListener, {
    //     apply(target, _this, args: any) {
    //         // if (args[0] === "statechange") {
    //         //     const copy = args[1];
    //         //     args[1] = function(event: any) {
    //         //         console.log("statechange", event);
    //         //         return copy(event);
    //         //     }
    //         //     console.log("found", args);
    //         // }
    //         console.log(_this, args);
    //         return target.apply(_this, args);
    //     }
    // })
    // window.CustomEvent = new Proxy(CustomEvent, {
    //     construct(target, args: ConstructorParameters<typeof CustomEvent>) {
    //         const event = new target(...args);
    //         console.log(args);
    //         return event;
    //     }
    // })

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
            get(){},
            set(){},
            configurable: false
        })
    }

    //blockProperty(window, "onbeforeunload");
    // blockProperty(window, "__FRVR");
    // blockProperty(window, "FRVR");
    // blockProperty(window, "FRVRSDK");
    blockProperty(window, "adsbygoogle");
    blockProperty(window, "google_reactive_ads_global_state");
    blockProperty(window, "GoogleAnalyticsObject");

    const connection: ISocket = {
        socket: undefined,
        Encoder: null,
        Decoder: null,
    };

    window.WebSocket = new Proxy(WebSocket, {
        construct(target, args: ConstructorParameters<typeof WebSocket>) {
            // args[0] = `
// wss://sgs-wctwk-vnn5q.frankfurt.moomoo.io/?token=alt%3AeyJhbGdvcml0aG0iOiJTSEEtMjU2IiwiY2hhbGxlbmdlIjoiZjJlOGZlOTBjYWQ0YzFmYmNkZTgzMTcyNTQ0NDk0NzU5YzczNzg2Mzg4MGY2MzU4YTRiOGIxZDI2ZGY1YTRmNSIsIm51bWJlciI6MzIyNTQsInNhbHQiOiI5OWQ0NGQ2MjQzNDY2NGU3ZGZkOGNhYzMiLCJzaWduYXR1cmUiOiIxOTc5NTI5OTYyY2JkNmM0ZDkzNDVjNjEzMGE3NDA0YmZjYjY3YjU2MDIwYTg2ZTM5Yjg0YTZiN2U2NDcwODlhIiwidG9vayI6MjQ2NX0%3D`;
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

    const text = atob("R2xvdHVz");
    const renderText = (ctx: any) => {
        ctx.save();
        ctx.font = "600 20px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const scale = ZoomHandler.getScale();
        ctx.scale(scale, scale);
        ctx.fillStyle = "#f1f1f1";
        ctx.strokeStyle = "#1c1c1c";
        ctx.lineWidth = 8;
        ctx.globalAlpha = 0.8;
        ctx.letterSpacing = "4px";
        ctx.strokeText(text, 5, 5);
        ctx.fillText(text, 5, 5);
        ctx.restore();
    }

    const frame = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback: FrameRequestCallback) {
        const value = frame.call(this, callback);
        const canvas = document.querySelector<HTMLCanvasElement>("#gameCanvas")!;
        const ctx = canvas.getContext("2d")!;
        renderText(ctx);
        return value;
    }

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