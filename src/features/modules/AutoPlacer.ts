import ObjectManager from "../../Managers/ObjectManager";
import PlayerManager from "../../Managers/PlayerManager";
import myPlayer from "../../data/ClientPlayer";
import { ESentAngle } from "../../types/Enums";
import { ItemType } from "../../types/Items";
import ModuleHandler from "../ModuleHandler";

class AutoPlacer {
    private readonly triedPlacement = new Map<string, number[]>();

    postTick(): void {
        const { placedOnce } = ModuleHandler;
        if (placedOnce) return;

        const nearestEnemy = PlayerManager.getNearestEnemy(myPlayer);
        if (nearestEnemy === null || !myPlayer.collidingEntity(nearestEnemy, 500)) return;

        const item = ModuleHandler.currentType || ItemType.TRAP;
        if (item === ItemType.FOOD || !myPlayer.canPlace(item)) return;
        
        const pos = myPlayer.position.current;
        const nearestAngle = pos.angle(nearestEnemy.position.current);
        const id = myPlayer.getItemByType(item)!;
        const angles = ObjectManager.getBestPlacementAngles(pos, id, nearestAngle);

        const keyPos = pos.stringify();
        if (!this.triedPlacement.has(keyPos)) {
            this.triedPlacement.clear();

            this.triedPlacement.set(keyPos, []);
        }

        const placements = this.triedPlacement.get(keyPos)!;
        for (const angle of angles) {
            if (ModuleHandler.totalPlaces >= 5) break;
            if (placements.includes(angle)) continue;
            placements.push(angle);

            ModuleHandler.actionPlanner.createAction(
                item,
                (last) => ModuleHandler.place(item, { angle, priority: ESentAngle.NONE, last })
            );
            ModuleHandler.placedOnce = true;
            ModuleHandler.totalPlaces += 1;
        }
    }

    postTickObject(): void {
        this.postTick();
    }
}

export default AutoPlacer;