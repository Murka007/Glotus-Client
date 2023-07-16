import myPlayer from "../data/ClientPlayer";
import { isActiveInput, lerp } from "../utility/Common";
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
    private wheels = 0;
    private readonly scaleFactor = 100;
    // private animationLife = 1500;
    // private start = Date.now();
    // private animating = false;

    constructor() {
        // this.animate = this.animate.bind(this);
        // setInterval(this.animate, 8);
    }

    /**
     * Returns minimum possible width and height scale
     */
    private getMinScale(scale: number) {
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

    // private animate() {

    //     // const delta = Date.now() - this.start;
    //     // if (delta >= this.animationLife) {
    //     //     this.animating = false;
    //     //     return;
    //     // }
    //     // setTimeout(this.animate, 0);

    //     const progress = 0.07;//Math.min(1, delta / this.animationLife);
    //     const { current, smooth } = this.scale;
    //     smooth.w[0] = lerp(smooth.w[0], current.w, progress);
    //     smooth.h[0] = lerp(smooth.h[0], current.h, progress);
    //     window.dispatchEvent(resizeEvent);
    // }

    // private startAnimation() {
    //     this.start = Date.now();
    //     if (!this.animating) {
    //         this.animating = true;
    //         this.animate();
    //     }
    // }

    handler(event: WheelEvent) {
        if (
            myPlayer.inGame && !(event.target instanceof HTMLCanvasElement) ||
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
        const zoom = event.deltaY > 0 ? -this.scaleFactor : this.scaleFactor;
        current.w = Math.max(w, current.w + zoom);
        current.h = Math.max(h, current.h + zoom);
        
        smooth.w[0] = current.w;
        smooth.h[0] = current.h;
        window.dispatchEvent(resizeEvent);
    }
}

export default ZoomHandler;