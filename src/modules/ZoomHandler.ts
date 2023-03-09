import myPlayer from "../data/ClientPlayer";
import { isActiveInput } from "../utility/Common";
import Hooker from "../utility/Hooker";

class ZoomHandler {
    static readonly scale = {
        Default: {
            w: 1920,
            h: 1080,
        },
        current: {
            w: Hooker.linker(1920),
            h: Hooker.linker(1080)
        }
    } as const;
    private static wheels = 0;
    private static readonly scaleFactor = 200;

    private static getMinScale(scale: number) {
        let w = this.scale.Default.w;
        let h = this.scale.Default.h;
        while (w > scale && h > scale) {
            w -= scale;
            h -= scale;
        }
        return {
            w,
            h
        } as const;
    }

    static handler(event: WheelEvent) {
        if (
            myPlayer.inGame && !(event.target instanceof HTMLCanvasElement) ||
            event.ctrlKey || event.shiftKey || event.altKey ||
            isActiveInput()
        ) return;

        const { Default, current } = this.scale;
        if (
            Default.w === current.w[0] && Default.h === current.h[0] &&
            (this.wheels = (this.wheels + 1) % 5) !== 0
        ) return;

        const { w, h } = this.getMinScale(this.scaleFactor);
        const zoom = event.deltaY > 0 ? -this.scaleFactor : this.scaleFactor;
        current.w[0] = Math.max(w, current.w[0] + zoom);
        current.h[0] = Math.max(h, current.h[0] + zoom);
        window.dispatchEvent(new Event("resize"));
    }
}

export default ZoomHandler;