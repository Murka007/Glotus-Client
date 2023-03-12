import myPlayer from "../data/ClientPlayer";
import PlayerManager from "../Managers/PlayerManager";
import Controller from "../modules/Controller";
import { TCTX } from "../types/Common";
import { IRenderEntity } from "../types/RenderTargets";
import Renderer from "../utility/Renderer";
import { EItem, WeaponType } from "../types/Items";
import DataHandler from "../utility/DataHandler";
import { Projectiles, Weapons } from "../constants/Items";
import Vector from "../modules/Vector";
import Projectile from "../data/Projectile";

/**
 * Called when bundle rendering entities (player, animal)
 */
const renderEntity = (
    ctx: TCTX,
    entity: IRenderEntity,
    player: IRenderEntity,
) => {
    const isMyPlayer = entity === player;
    if (isMyPlayer) {
        Renderer.updateHSL();

        const position = new Vector(player.x, player.y);

        const currentWeapon = myPlayer.weapon.current;
        if (DataHandler.isShootable(currentWeapon)) {
            const secondary = Weapons[currentWeapon];
            const arrow = DataHandler.getProjectile(currentWeapon);

            const angle = Controller.mouse.sentAngle;
            const start = position.direction(angle, 70);
            const projectile = new Projectile(
                start.x, start.y, angle,
                arrow.range,
                arrow.speed,
                secondary.projectile,
                myPlayer.checkCollision(EItem.PLATFORM) ? 1 : 0,
                0
            );

            const entity = PlayerManager.getCurrentShootTarget(
                start, projectile.position.end,
                projectile.length,
                projectile.onPlatform
            );

            if (entity !== null) {
                const pos = entity.position.current;
                Renderer.rect(ctx, pos, entity.arrowScale, "#e39542");
            }
            // Renderer.line(ctx, start, projectile.position.end, "red");
        }

        Renderer.line(ctx, position, position.direction(myPlayer.angle, 70), "#e9adf0");
    }

    if (entity.isPlayer) {
        Renderer.renderBar(ctx, entity);
    }
    Renderer.renderHP(ctx, entity);
    if (isMyPlayer) return;
    Renderer.renderTracer(ctx, entity, player);
}

export default renderEntity;