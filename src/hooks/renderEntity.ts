import Glotus from "..";
import myPlayer from "../data/ClientPlayer";
import PlayerManager from "../Managers/PlayerManager";
import Controller from "../modules/Controller";
import settings from "../modules/Settings";
import { TCTX } from "../types/Common";
import { IRenderEntity } from "../types/RenderTargets";
import Renderer from "../utility/Renderer";

const renderEntity = (
    ctx: TCTX,
    entity: IRenderEntity,
    player: IRenderEntity,
) => {
    const isMyPlayer = entity === player;
    if (isMyPlayer) {
        Renderer.updateHSL();
        const nearest = PlayerManager.getNearestEntity(myPlayer);
        if (nearest !== null) {
            const pos1 = myPlayer.position.future.copy().sub(myPlayer.offset);
            const pos2 = nearest.position.future.copy().sub(myPlayer.offset);
            Renderer.line(ctx, pos1.x, pos1.y, pos2.x, pos2.y, "red");
        }
    }

    if (entity.isPlayer) {
        Renderer.renderBar(ctx, entity);
    }

    if (isMyPlayer) return;
    Renderer.renderTracer(ctx, entity, player);
}

export default renderEntity;