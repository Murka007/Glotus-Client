import myPlayer from "../data/ClientPlayer";
import PlayerManager from "../Managers/PlayerManager";
import { TCTX } from "../types/Common";
import { IRenderEntity } from "../types/RenderTargets";
import Renderer from "./Renderer";
import DataHandler from "../utility/DataHandler";
import { Items, Weapons } from "../constants/Items";
import Vector from "../modules/Vector";
import settings from "../utility/Settings";
import ObjectManager from "../Managers/ObjectManager";
import { EHat } from "../types/Store";
import Animals, { EAnimal } from "../constants/Animals";
import ModuleHandler from "../features/ModuleHandler";
import { EDanger } from "../types/Enums";

const colors = [["orange", "red"], ["aqua", "blue"]] as const;

/**
 * Called when bundle rendering entities (player, animal)
 */
const EntityRenderer = new class EntityRenderer {
    private drawWeaponHitbox(ctx: TCTX, player: IRenderEntity) {
        if (!settings.weaponHitbox) return;

        const current = myPlayer.getItemByType(ModuleHandler.weapon);
        if (DataHandler.isMelee(current)) {
            const weapon = Weapons[current];
            Renderer.circle(ctx, player.x, player.y, weapon.range, "#f5cb42", 1, 1);
        }
    }

    private drawPlacement(ctx: TCTX, position: Vector) {
        // const spike = Items[myPlayer.getItemByType(ItemType.SPIKE)!];
        // const length = myPlayer.getItemPlaceScale(spike.id);
        // const angles = ObjectManager.getBestPlacementAngles(myPlayer.position.future, spike.id, ModuleHandler.mouse.angle);
        // for (let i=0;i<angles.length;i++) {
        //     const angle = angles[i];
        //     const pos = myPlayer.position.future.direction(angle, length);
        //     Renderer.circle(ctx, pos.x, pos.y, spike.scale, "yellow", 1, 1);
        // }

        if (settings.placementHitbox && DataHandler.isPlaceable(myPlayer.currentItem)) {
            const item = Items[myPlayer.currentItem];
            const place = myPlayer.getPlacePosition(myPlayer.position.future, myPlayer.currentItem, ModuleHandler.mouse.sentAngle);
            const canPlace = ObjectManager.canPlaceItem(item.id, place);
            const color = canPlace ? "#ffa552" : "#13d16f";
            Renderer.circle(ctx, place.x, place.y, item.scale, color, 1, 1);
        }
    }

    private drawEntityHP(ctx: TCTX, entity: IRenderEntity) {
        if (entity.isPlayer) {
            if (settings.turretHitbox && myPlayer.hatID === EHat.TURRET_GEAR) {
                Renderer.circle(ctx, entity.x, entity.y, 700, "#3e2773", 1, 1);
            }
            
            Renderer.renderBar(ctx, entity);
        }
        Renderer.renderHP(ctx, entity);
    }

    private drawHitScale(ctx: TCTX, entity: IRenderEntity) {
        if (!settings.weaponHitbox) return;

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

    private drawDanger(ctx: TCTX, entity: IRenderEntity) {
        if (!settings.entityDanger) return;

        if (entity.isPlayer) {
            const player = PlayerManager.playerData.get(entity.sid);
            if (player !== undefined && player.danger !== 0) {
                const isBoost = Number(player.usingBoost) as 0 | 1;
                const isDanger = Number(player.danger === EDanger.HIGH) as 0 | 1;
                Renderer.fillCircle(ctx, entity.x, entity.y, player.scale, colors[isBoost][isDanger], 0.35);
            }
        }

        if (entity.isAI) {
            const animal = PlayerManager.animalData.get(entity.sid)!;
            const color = animal.isDanger ? "red" : "green";
            Renderer.fillCircle(ctx, entity.x, entity.y, animal.attackRange, color, 0.3);
        }
    }

    render(ctx: TCTX, entity: IRenderEntity, player: IRenderEntity) {
        const isMyPlayer = entity === player;
        if (isMyPlayer) {

            const lerpPosition = new Vector(player.x, player.y);
            if (settings.displayPlayerAngle) {
                Renderer.line(ctx, lerpPosition, lerpPosition.direction(myPlayer.angle, 70), "#e9adf0");
            }

            this.drawWeaponHitbox(ctx, player);
            this.drawPlacement(ctx, lerpPosition);

            // const secondary = myPlayer.weapon.current;
            // if (settings.projectileHitbox && DataHandler.isShootable(secondary)) {
            //     const bullet = DataHandler.getProjectile(secondary);
            //     const range = bullet.range * myPlayer.getWeaponSpeedMult();
            //     const pos = myPlayer.position.current;
            //     const angle = ModuleHandler.mouse.sentAngle;

            //     const projectile = ProjectileManager.getProjectile(pos, bullet.id, myPlayer.onPlatform, angle, range);
            //     const target = ProjectileManager.getCurrentShootTarget(myPlayer, myPlayer.id, projectile);
            //     if (target !== null) {
            //         const pos = target.position.current;
            //         Renderer.rect(ctx, pos, target.collisionScale, "#e39542", 2);
            //     }
            // }
        }

        this.drawEntityHP(ctx, entity);
        if (settings.collisionHitbox) {
            Renderer.circle(ctx, entity.x, entity.y, entity.scale, "#c7fff2", 1, 1);
        }

        if (isMyPlayer) return;
        this.drawHitScale(ctx, entity);
        this.drawDanger(ctx, entity);
        Renderer.renderTracer(ctx, entity, player);
    }
}

export default EntityRenderer;