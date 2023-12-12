import { TCTX } from "../types/Common";
import { IRenderEntity } from "../types/RenderTargets";
import Renderer from "./Renderer";
import DataHandler from "../utility/DataHandler";
import { Items, Projectiles, Weapons } from "../constants/Items";
import Vector from "../modules/Vector";
import settings from "../utility/Settings";
import { EHat } from "../types/Store";
import Animals, { EAnimal } from "../constants/Animals";
import { EDanger } from "../types/Enums";
import { myClient } from "..";
import Sorting from "../utility/Sorting";
import { ItemType } from "../types/Items";

const colors = [["orange", "red"], ["aqua", "blue"]] as const;

/**
 * Called when bundle rendering entities (player, animal)
 */
const EntityRenderer = new class EntityRenderer {
    private drawWeaponHitbox(ctx: TCTX, player: IRenderEntity) {
        if (!settings.weaponHitbox) return;

        const { myPlayer, ModuleHandler } = myClient;
        const current = myPlayer.getItemByType(ModuleHandler.weapon);
        if (DataHandler.isMelee(current)) {
            const weapon = Weapons[current];
            Renderer.circle(ctx, player.x, player.y, weapon.range, "#f5cb42", 1, 1);
        }
    }

    private drawPlacement(ctx: TCTX, position: Vector) {
        const { myPlayer, ModuleHandler } = myClient;
        // const spike = Items[myPlayer.getItemByType(ItemType.SPIKE)!];
        // const length = myPlayer.getItemPlaceScale(spike.id);
        const [type, angles] = ModuleHandler.staticModules.autoPlacer.placeAngles;
        if (type === null) return;

        const id = myPlayer.getItemByType(type)!;
        const length = myPlayer.getItemPlaceScale(id);
        const item = Items[id];
        for (let i=0;i<angles.length;i++) {
            const angle = angles[i];
            const pos = myPlayer.position.current.direction(angle, length);
            Renderer.circle(ctx, pos.x, pos.y, item.scale, "purple", 1, 1);
        }

        // const { myPlayer, ModuleHandler, ObjectManager } = myClient;
        // if (settings.placementHitbox && DataHandler.isPlaceable(myPlayer.currentItem)) {
        //     const item = Items[myPlayer.currentItem];
        //     const place = myPlayer.getPlacePosition(myPlayer.position.future, myPlayer.currentItem, ModuleHandler.mouse.sentAngle);
        //     const canPlace = ObjectManager.canPlaceItem(item.id, place);
        //     const color = canPlace ? "#ffa552" : "#13d16f";
        //     Renderer.circle(ctx, place.x, place.y, item.scale, color, 1, 1);
        // }
    }

    private drawEntityHP(ctx: TCTX, entity: IRenderEntity) {
        if (entity.isPlayer) {
            if (settings.turretHitbox && myClient.myPlayer.hatID === EHat.TURRET_GEAR) {
                Renderer.circle(ctx, entity.x, entity.y, 700, "#3e2773", 1, 1);
            }
        }
        Renderer.renderBar(ctx, entity);
        Renderer.renderHP(ctx, entity);
    }

    private drawHitScale(ctx: TCTX, entity: IRenderEntity) {
        if (!settings.weaponHitbox) return;

        const { PlayerManager } = myClient;
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

        const { PlayerManager } = myClient;
        if (entity.isPlayer) {
            const player = PlayerManager.playerData.get(entity.sid);
            if (player !== undefined && player.danger !== 0) {
                const isBoost = Number(player.usingBoost) as 0 | 1;
                const isDanger = Number(player.danger >= EDanger.HIGH) as 0 | 1;
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

            const pos = new Vector(player.x, player.y);
            if (settings.displayPlayerAngle) {
                Renderer.line(ctx, pos, pos.direction(myClient.myPlayer.angle, 70), "#e9adf0");
            }

            this.drawWeaponHitbox(ctx, player);
            this.drawPlacement(ctx, pos);

            const { myPlayer, EnemyManager } = myClient;
            const secondary = myPlayer.weapon.current;
            const enemy = EnemyManager.nearestEnemy;
            if (settings.projectileHitbox && DataHandler.isShootable(secondary) && enemy) {
                Renderer.circle(ctx, entity.x, entity.y, 700, "#3e2773", 1, 1);
            }

            // const nearestTrap = EnemyManager.nearestTrap;
            // const nearestTurretEntity = EnemyManager.nearestTurretEntity;

            // if (nearestTrap !== null) {
            //     const pos = nearestTrap.position.current;
            //     Renderer.fillCircle(ctx, pos.x, pos.y, nearestTrap.collisionScale, "pink", 0.5);
            // }

            // if (nearestTurretEntity !== null) {
            //     const pos = nearestTurretEntity.position.current;
            //     Renderer.fillCircle(ctx, pos.x, pos.y, nearestTurretEntity.collisionScale, "pink", 0.5);
            // }

            if (myPlayer.isTrapped) {
                Renderer.fillCircle(ctx, pos.x, pos.y, 35, "yellow", 0.5);
            }
            // if (settings.projectileHitbox && enemy && DataHandler.isShootable(secondary)) {
            //     const { myPlayer, ObjectManager, ProjectileManager } = myClient;
            //     const pos1 = myPlayer.position.current;
            //     const angle = pos1.angle(enemy.position.current);
            //     const bullet = DataHandler.getProjectile(secondary);
            //     const projectile = ProjectileManager.getProjectile(myPlayer, bullet.id, myPlayer.onPlatform, angle, 700);
            //     const angles = ProjectileManager.getFreeAttackAngles(projectile, enemy);
            //     for (const angle of angles) {
            //         const pos2 = pos1.direction(angle[0], angle[1]);
            //         Renderer.line(ctx, pos1, pos2, "yellow", 1, 1);
            //     }
            //     // const range = 700;

            //     // const objects = ObjectManager.retrieveObjects(pos1, range);
            //     // objects.sort(Sorting.byDistance(myPlayer, "current", "current"));
            //     // const object = objects[0] || null;
            //     // if (object !== null) {
            //     //     const pos2 = object.position.current;
            //     //     const distance = pos1.distance(pos2);
            //     //     const angle = pos1.angle(pos2);

            //     //     const scale = object.collisionScale;
            //     //     const offset = Math.asin((2 * scale) / (2 * distance));

            //     //     const left = pos1.direction(angle - offset, distance);
            //     //     const right = pos1.direction(angle + offset, distance);
            //     //     Renderer.line(ctx, pos1, left, "yellow", 1, 1);
            //     //     Renderer.line(ctx, pos1, right, "green", 1, 1);
            //     // }
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