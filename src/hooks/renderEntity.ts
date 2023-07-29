import myPlayer from "../data/ClientPlayer";
import PlayerManager from "../Managers/PlayerManager";
import Controller from "../modules/Controller";
import { TCTX } from "../types/Common";
import { IRenderEntity } from "../types/RenderTargets";
import Renderer from "../utility/Renderer";
import { EItem, WeaponType } from "../types/Items";
import DataHandler from "../utility/DataHandler";
import { Items, Projectiles, Weapons } from "../constants/Items";
import Vector from "../modules/Vector";
import Projectile from "../data/Projectile";
import settings from "../utility/Settings";
import ObjectManager from "../Managers/ObjectManager";
import { EHat } from "../types/Store";
import ProjectileManager from "../Managers/ProjectileManager";
import Animals, { EAnimal } from "../constants/Animals";
import Config from "../constants/Config";
import { getAngleDist } from "../utility/Common";

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
        if (settings.rainbow) Renderer.updateHSL();

        const currentPosition = myPlayer.position.current;
        const futurePosition = myPlayer.position.future;
        const lerpPosition = new Vector(player.x, player.y);

        if (settings.projectileHitbox) {
            const projectile = myPlayer.getProjectile(currentPosition, myPlayer.weapon.current);
            if (projectile !== null) {
                const entity = ProjectileManager.getCurrentShootTarget(myPlayer, myPlayer.id, projectile);
                if (entity !== null) {
                    const pos = entity.position.current;
                    Renderer.rect(ctx, pos, entity.collisionScale, "#e39542", 3);
                }
            }
        }

        if (settings.possibleShootTarget) {
            const entity = PlayerManager.getPossibleShootEntity();
            if (entity !== null) {
                const pos = entity.position.current;
                Renderer.rect(ctx, pos, entity.collisionScale, "#4272e3", 3);
            }
        }

        if (settings.displayPlayerAngle) {
            Renderer.line(ctx, lerpPosition, lerpPosition.direction(myPlayer.angle, 70), "#e9adf0");
        }

        if (settings.weaponHitbox) {
            const current = myPlayer.getItemByType(Controller.weapon);
            if (DataHandler.isMelee(current)) {
                const weapon = Weapons[current];
                Renderer.circle(ctx, player.x, player.y, weapon.range, "#f5cb42", 1, 1);
            }
        }

        if (settings.placementHitbox && DataHandler.isPlaceable(myPlayer.currentItem)) {
            const item = Items[myPlayer.currentItem];
            const place = myPlayer.getPlacePosition(lerpPosition, myPlayer.currentItem, Controller.mouse.sentAngle);
            const color = ObjectManager.canPlaceItem(item.id, place) ? "#ffa552" : "#13d16f";
            Renderer.circle(ctx, place.x, place.y, item.scale, color, 1, 1);
        }

        // Renderer.line(ctx, currentPosition, futurePosition, "red", 1);
    }

    if (entity.isPlayer) {
        if (settings.turretHitbox && myPlayer.hatID === EHat.TURRET_GEAR) {
            Renderer.circle(ctx, entity.x, entity.y, 700, "#3e2773", 1, 1);
        }
        
        Renderer.renderBar(ctx, entity);
    }
    Renderer.renderHP(ctx, entity);

    if (settings.collisionHitbox) {
        Renderer.circle(ctx, entity.x, entity.y, entity.scale, "#c7fff2", 1, 1);
    }

    if (isMyPlayer) return;

    if (settings.weaponHitbox) {
        const type = entity.isPlayer ? PlayerManager.playerData : PlayerManager.animalData;
        const target = type.get(entity.sid);
        if (target !== undefined) {
            Renderer.circle(ctx, entity.x, entity.y, target.hitScale, "#3f4ec4", 1, 1);
        }

        if (entity.isAI && entity.index === EAnimal.MOOSTAFA) {
            const moostafa = Animals[EAnimal.MOOSTAFA];
            Renderer.circle(ctx, entity.x, entity.y, moostafa.hitRange, "#f5cb42", 1, 1);
        }
    }


    Renderer.renderTracer(ctx, entity, player);
}

export default renderEntity;