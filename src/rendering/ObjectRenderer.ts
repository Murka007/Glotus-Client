import { Items } from "../constants/Items";
import { PlayerObject, TObject } from "../data/ObjectItem";
import ObjectManager from "../Managers/ObjectManager";
import { TCTX } from "../types/Common";
import { EItem, ItemType } from "../types/Items";
import { IRenderObject } from "../types/RenderTargets";
import Renderer from "./Renderer";
import settings from "../utility/Settings";

/**
 * Called when game bundle rendering objects
 */
const ObjectRenderer = new class ObjectRenderer {

    private healthBar(ctx: TCTX, entity: IRenderObject, object: PlayerObject): number {
        if (!(settings.itemHealthBar &&
            object.seenPlacement &&
            object.isDestroyable
        )) return 0;

        const { health, maxHealth, angle } = object;
        const perc = health / maxHealth;
        const color = settings.itemHealthBarColor;
        return Renderer.circularBar(ctx, entity, perc, angle, color);
    }

    private renderTurret(ctx: TCTX, entity: IRenderObject, object: PlayerObject, scale: number) {
        if (object.type !== EItem.TURRET) return;

        if (settings.objectTurretReloadBar) {
            const { reload, maxReload, angle } = object;
            const perc = reload / maxReload;
            const color = settings.objectTurretReloadBarColor;
            Renderer.circularBar(ctx, entity, perc, angle, color, scale);
        }

        if (settings.turretHitbox) {
            const canShootMyPlayer = ObjectManager.canTurretHitMyPlayer(object);
            const color = canShootMyPlayer ? "#73272d" : "#3e2773";
            Renderer.circle(ctx, entity.x, entity.y, 700, color, 1, 1);
        }
    }

    private renderWindmill(entity: IRenderObject) {
        const item = Items[entity.id];
        if (item.itemType === ItemType.WINDMILL) {
            entity.turnSpeed = settings.windmillRotation ? item.turnSpeed : 0;
        }
    }

    private renderCollisions(ctx: TCTX, entity: IRenderObject, object: TObject) {
        const x = entity.x + entity.xWiggle;
        const y = entity.y + entity.yWiggle;
        if (settings.collisionHitbox) {
            Renderer.circle(ctx, x, y, object.collisionScale, "#c7fff2", 1, 1);
        }
        if (settings.weaponHitbox) {
            Renderer.circle(ctx, x, y, object.hitScale, "#3f4ec4", 1, 1);
        }
        if (settings.placementHitbox) {
            Renderer.circle(ctx, x, y, object.placementScale, "#13d16f", 1, 1);
        }
    }

    render(ctx: TCTX) {
        if (Renderer.objects.length === 0) return;
        for (const entity of Renderer.objects) {
            const object = ObjectManager.objects.get(entity.sid);
            if (object === undefined) continue;
            Renderer.renderMarker(ctx, entity);

            if (object instanceof PlayerObject) {
                const scale = this.healthBar(ctx, entity, object);
                this.renderTurret(ctx, entity, object, scale);
                this.renderWindmill(entity);
            }
            this.renderCollisions(ctx, entity, object);
        }
        Renderer.objects.length = 0;
    }
}

export default ObjectRenderer;