import Glotus from "..";
import myPlayer from "../data/ClientPlayer";
import { PlayerObject } from "../data/ObjectItem";
import ObjectManager from "../Managers/ObjectManager";
import { TCTX } from "../types/Common";
import { EItem } from "../types/Items";
import { clamp } from "../utility/Common";
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

        if (
            playerObject instanceof PlayerObject &&
            playerObject.isDestroyable()
        ) {
            let scale = 0;
            if (settings.itemHealthBar && playerObject.seenPlacement) {
                const perc = clamp(playerObject.health / playerObject.maxHealth, 0, 1);
                scale += Renderer.circularBar(ctx, object, perc, settings.itemHealthBarColor);
            }

            if (settings.objectTurretReloadBar && playerObject.type === EItem.TURRET) {
                const perc = clamp(playerObject.reload / playerObject.maxReload, 0, 1);
                Renderer.circularBar(ctx, object, perc, settings.objectTurretReloadBarColor, scale);
                Renderer.circle(ctx, object.x, object.y, 700, "red", 0.5);
            }
        }
        // const obj = ObjectManager.objects.get(object.sid);
        // if (obj !== undefined) {
        //     ctx.save();
        //     const x = object.x + object.xWiggle - myPlayer.offset.x;
        //     const y = object.y + object.yWiggle - myPlayer.offset.y;
        //     ctx.strokeStyle = "red";
        //     ctx.lineWidth = 3;
        //     ctx.beginPath();
        //     ctx.arc(x, y, obj.formatScale(), 0, 2 * Math.PI);
        //     ctx.stroke();
        //     ctx.closePath();
        //     ctx.restore();
        // }
    }
    Renderer.objects.length = 0;
}

export default renderObject;