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
import NotificationRenderer from "./NotificationRenderer";
import ObjectManager from "../Managers/ObjectManager";

const colors = [["orange", "red"], ["aqua", "blue"]] as const;

/**
 * Called when bundle rendering entities (player, animal)
 */
const EntityRenderer = new class EntityRenderer {
    private start = Date.now();
    step = 0;

    private drawWeaponHitbox(ctx: TCTX, player: IRenderEntity) {
        if (!settings.weaponHitbox) return;

        const { myPlayer, ModuleHandler } = myClient;
        const current = myPlayer.getItemByType(ModuleHandler.weapon);
        if (DataHandler.isMelee(current)) {
            const weapon = Weapons[current];
            Renderer.circle(ctx, player.x, player.y, weapon.range, "#f5cb42", 1, 1);
        }
    }

    private drawPlacement(ctx: TCTX) {
        if (!settings.possiblePlacement) return;
        const { myPlayer, ModuleHandler, ObjectManager } = myClient;
        // const [type, angles] = ModuleHandler.staticModules.autoPlacer.placeAngles;
        // if (type === null) return;

        // const id = myPlayer.getItemByType(type)!;
        const id = myPlayer.getItemByType(ItemType.TRAP);
        if (id === null) return;
        const angles = ObjectManager.getBestPlacementAngles(myPlayer.position.current, id);
        // console.log(angles.size);
        const dist = myPlayer.getItemPlaceScale(id);
        const item = Items[id];
        for (const angle of angles) {
            const pos = myPlayer.position.current.direction(angle, dist);
            Renderer.circle(ctx, pos.x, pos.y, item.scale, "purple", 1, 1);
        }
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
        const now = Date.now();
        this.step = now - this.start;
        this.start = now;
        
        const { myPlayer, EnemyManager } = myClient;
        const isMyPlayer = entity === player;
        if (isMyPlayer) {

            const pos = new Vector(player.x, player.y);
            if (settings.displayPlayerAngle) {
                Renderer.line(ctx, pos, pos.direction(myClient.myPlayer.angle, 70), "#e9adf0");
            }

            this.drawWeaponHitbox(ctx, player);
            this.drawPlacement(ctx);

            const secondary = myPlayer.weapon.current;
            const enemy = EnemyManager.nearestEnemy;
            if (settings.projectileHitbox && DataHandler.isShootable(secondary) && enemy) {
                Renderer.circle(ctx, entity.x, entity.y, 700, "#3e2773", 1, 1);
            }

            if (myPlayer.isTrapped) {
                Renderer.fillCircle(ctx, pos.x, pos.y, 35, "yellow", 0.5);
            }
        }

        this.drawEntityHP(ctx, entity);
        if (settings.collisionHitbox) {
            Renderer.circle(ctx, entity.x, entity.y, entity.scale, "#c7fff2", 1, 1);
        }

        if (!isMyPlayer) {
            const willCollide = EnemyManager.nearestCollideSpike;
            if (
                willCollide &&
                !entity.isAI &&
                myPlayer.isEnemyByID(entity.sid) &&
                entity.sid === willCollide.id
            ) {
                Renderer.circle(ctx, entity.x, entity.y, entity.scale, "#691313", 1, 13);
            }
            this.drawHitScale(ctx, entity);
            this.drawDanger(ctx, entity);
            Renderer.renderTracer(ctx, entity, player);
        }

        if (isMyPlayer) {
            NotificationRenderer.render(ctx, player);
        }
    }
}

export default EntityRenderer;