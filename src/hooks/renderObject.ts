import Glotus from "..";
import myPlayer from "../data/ClientPlayer";
import ObjectManager from "../Managers/ObjectManager";
import { TCTX } from "../types/Common";
import Renderer from "../utility/Renderer";

const renderObject = (ctx: TCTX) => {
    if (Renderer.objects.length === 0) return;
    
    for (const object of Renderer.objects) {
        Renderer.renderMarker(ctx, object);
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