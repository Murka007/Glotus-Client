import { Items } from "../../constants/Items";
import PlayerClient from "../../PlayerClient";
import { ESentAngle } from "../../types/Enums";
import { ItemType } from "../../types/Items";
import settings from "../../utility/Settings";

class AutoPlacer {
    readonly name = "autoPlacer";
    private readonly client: PlayerClient;

    placeAngles: [Exclude<ItemType, ItemType.FOOD> | null, number[]] = [null, []];

    constructor(client: PlayerClient) {
        this.client = client;
    }

    postTick(): void {
        this.placeAngles[0] = null;
        this.placeAngles[1] = [];

        if (!settings.autoplacer) return;

        const { myPlayer, ObjectManager, ModuleHandler, EnemyManager } = this.client;
        const { currentType } = ModuleHandler;
        const pos = myPlayer.position.current;

        const nearestEnemy = EnemyManager.nearestEnemy;
        if (nearestEnemy === null) return;
        if (!myPlayer.collidingEntity(nearestEnemy, 450)) return;

        const nearestAngle = pos.angle(nearestEnemy.position.current);

        let itemType: ItemType | null = null;
        const spike = myPlayer.getItemByType(ItemType.SPIKE);
        const spikeAngles = ObjectManager.getBestPlacementAngles(pos, spike, nearestAngle);

        let angles: number[] = [];

        const length = myPlayer.getItemPlaceScale(spike);
        for (const angle of spikeAngles) {
            const newPos = pos.direction(angle, length);
            let shouldPlaceSpike = false;

            for (const enemy of EnemyManager.trappedEnemies) {
                const distance = newPos.distance(enemy.position.current);
                const range = Items[spike].scale * 2 + enemy.collisionScale;
                if (distance <= range) {
                    shouldPlaceSpike = true;
                    break;
                }
            }

            if (shouldPlaceSpike) {
                angles = spikeAngles;
                itemType = ItemType.SPIKE;
                break;
            }
        }

        if (angles.length === 0) {
            const type = currentType && currentType !== ItemType.FOOD ? currentType : ItemType.TRAP;
            if (!myPlayer.canPlace(type)) return;

            const id = myPlayer.getItemByType(type)!;
            angles = ObjectManager.getBestPlacementAngles(pos, id, nearestAngle);
            itemType = type;
        }

        if (itemType === null) return;
        this.placeAngles[0] = itemType;
        this.placeAngles[1] = angles;

        // const count = ModuleHandler.healedOnce && ModuleHandler.totalPlaces === 2 ? 4 : 3;
        for (const angle of angles) {
            // if (ModuleHandler.totalPlaces >= count) break;

            ModuleHandler.actionPlanner.createAction(
                itemType,
                (last) => ModuleHandler.place(itemType!, { angle, priority: ESentAngle.LOW, last })
            );
            ModuleHandler.placedOnce = true;
            // ModuleHandler.totalPlaces += 1;
        }
    }
}

export default AutoPlacer;