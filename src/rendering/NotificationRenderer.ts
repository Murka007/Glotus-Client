import { TObject } from "../data/ObjectItem";
import { TCTX } from "../types/Common";
import { IRenderEntity } from "../types/RenderTargets";
import EntityRenderer from "./EntityRenderer";
import Renderer from "./Renderer";

export class Notification {
    readonly x: number;
    readonly y: number;
    private readonly timeout = {
        value: 0,
        max: 1500
    }

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    private animate() {
        const { value, max } = this.timeout;
        if (value >= max) {
            NotificationRenderer.remove(this);
            return;
        }

        this.timeout.value += EntityRenderer.step;
    }

    render(ctx: TCTX, player: IRenderEntity) {
        this.animate();
        Renderer.renderTracer(ctx, this, player);
    }
}

const NotificationRenderer = new class NotificationRenderer {
    private readonly notifications = new Set<Notification>();

    remove(notify: Notification) {
        this.notifications.delete(notify);
    }

    add(object: TObject) {
        const { x, y } = object.position.current;
        const notify = new Notification(x, y);
        this.notifications.add(notify);
    }

    render(ctx: TCTX, player: IRenderEntity) {
        for (const notification of this.notifications) {
            notification.render(ctx, player);
        }
    }
}

export default NotificationRenderer;