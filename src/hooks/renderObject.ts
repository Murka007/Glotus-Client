import Glotus from "..";
import { Items, Projectiles } from "../constants/Items";
import myPlayer from "../data/ClientPlayer";
import { PlayerObject } from "../data/ObjectItem";
import Projectile from "../data/Projectile";
import ObjectManager from "../Managers/ObjectManager";
import PlayerManager from "../Managers/PlayerManager";
import Vector from "../modules/Vector";
import { TCTX } from "../types/Common";
import { EItem, ItemType } from "../types/Items";
import { clamp } from "../utility/Common";
import Logger from "../utility/Logger";
import Renderer from "../utility/Renderer";
import settings from "../utility/Settings";

/**
 * Called when game bundle rendering objects
 */
const renderObject = (ctx: TCTX) => {
    if (Renderer.objects.length === 0) return;
    
    for (const object of Renderer.objects) {
        const playerObject = ObjectManager.objects.get(object.sid);

        Renderer.renderMarker(ctx, object);
        if (playerObject instanceof PlayerObject) {
            const { position, type, angle, health, maxHealth, reload, maxReload } = playerObject;
            let scale = 0;

            if (
                settings.itemHealthBar &&
                playerObject.seenPlacement && 
                playerObject.isDestroyable()
            ) {
                const perc = clamp(health / maxHealth, 0, 1);
                const color = settings.itemHealthBarColor;
                scale += Renderer.circularBar(ctx, object, perc, angle, color);
            }

            if (type === EItem.TURRET) {
                if (settings.objectTurretReloadBar) {
                    const perc = clamp(reload / maxReload, 0, 1);
                    const color = settings.objectTurretReloadBarColor;
                    Renderer.circularBar(ctx, object, perc, angle, color, scale);
                }

                if (settings.turretHitbox) {

                    const canShootMyPlayer = ObjectManager.canTurretHitMyPlayer(playerObject);
                    Renderer.circle(ctx, object.x, object.y, 700, canShootMyPlayer ? "#73272d" : "#3e2773", 1, 1);
                }
            }

            const item = Items[object.id];
            if (item.itemType === ItemType.WINDMILL) {
                object.turnSpeed = settings.windmillRotation ? item.turnSpeed : 0;
            }
        }

        const item = ObjectManager.objects.get(object.sid);
        if (item !== undefined) {
            const x = object.x + object.xWiggle;
            const y = object.y + object.yWiggle;
            const radius = item.formatScale();
            if (settings.collisionHitbox) {
                Renderer.circle(ctx, x, y, radius, "#c7fff2", 1, 1);
            }
            if (settings.weaponHitbox) {
                Renderer.circle(ctx, x, y, item.hitScale, "#3f4ec4", 1, 1);
            }
            if (settings.placementHitbox) {
                Renderer.circle(ctx, x, y, item.placementScale, "#13d16f", 1, 1);
            }
        }
    }
    Renderer.objects.length = 0;
}

export default renderObject;