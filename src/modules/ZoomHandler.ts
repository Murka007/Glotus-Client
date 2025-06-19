import { isActiveInput } from "../utility/Common";
import Hooker from "../utility/Hooker";

const resizeEvent = new Event("resize");
const ZoomHandler = new class ZoomHandler {
    readonly scale = {
        Default: {
            w: 1920,
            h: 1080,
        } as const,
        current: {
            w: 1920,
            h: 1080
        },
        smooth: {
            w: Hooker.linker(1920),
            h: Hooker.linker(1080)
        } as const
    };
    private wheels = 3;
    private readonly scaleFactor = 250;

    getScale() {
        const dpr = 1;//window.devicePixelRatio;
        return Math.max(
            innerWidth / this.scale.Default.w,
            innerHeight / this.scale.Default.h
        ) * dpr;
    }

    /**
     * Returns minimum possible width and height scale
     */
    private getMinScale(scale: number) {
        const { w, h } = this.scale.Default;
        const min = Math.min(w, h);
        const count = Math.floor(min / scale);
        return {
            w: w - scale * count,
            h: h - scale * count,
        }
    }

    handler(event: WheelEvent) {
        if (
            !(event.target instanceof HTMLCanvasElement) ||
            event.ctrlKey || event.shiftKey || event.altKey ||
            isActiveInput()
        ) return;

        const { Default, current, smooth } = this.scale;

        // When scale is default, make some gap so user could find it easily
        if (
            Default.w === current.w && Default.h === current.h &&
            (this.wheels = (this.wheels + 1) % 4) !== 0
        ) return;

        const { w, h } = this.getMinScale(this.scaleFactor);
        const zoom = Math.sign(event.deltaY) * -this.scaleFactor;
        current.w = Math.max(w, current.w + zoom);
        current.h = Math.max(h, current.h + zoom);
        
        smooth.w[0] = current.w;
        smooth.h[0] = current.h;
        window.dispatchEvent(resizeEvent);
    }
}

export default ZoomHandler;